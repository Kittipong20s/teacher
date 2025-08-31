import {
  delay, students, attendance, leaves,
  STAT, filterByClass, within, getHolidayInfo
} from './db';
import { getAttendanceSummary } from './attendanceApi';
import { getAnnouncements } from './announcementsApi';

// ดึงชื่อผู้ดำเนินการจาก log (รองรับทั้ง operator/byName)
const pickOp = (log) => (log?.operator || log?.byName || '') || '';

export async function getDailyDashboard(dateYMD, classCode) {
  await delay(200);

  const allowedStudents = filterByClass(students, classCode);
  const allowedIds = new Set(allowedStudents.map(s => s.id));
  const total = allowedStudents.length;

  const { isHoliday, name: holidayName } = getHolidayInfo(dateYMD);

  const logsOfDay = attendance.filter(
    a => a.date === dateYMD && allowedIds.has(a.student_id)
  );

  if (isHoliday) {
    const normalized = logsOfDay
      .map(a => (a.status === STAT.LATE ? { ...a, status: STAT.IN } : a))
      .filter(a => a.status === STAT.IN || a.status === STAT.OUT);

    const inOnTime = normalized.filter(a => a.status === STAT.IN).length;
    const out      = normalized.filter(a => a.status === STAT.OUT).length;

    const rows = allowedStudents.map(s => {
      const logs = normalized.filter(x => x.student_id === s.id);
      const outLog = logs.filter(l => l.status === STAT.OUT).sort((a,b)=>b.time.localeCompare(a.time))[0];
      if (outLog) {
        return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.OUT, time: outLog.time, note:'', operator: pickOp(outLog) };
      }
      const inLog = logs.find(l => l.status === STAT.IN);
      if (inLog) {
        return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.IN, time: inLog.time, note:'', operator: pickOp(inLog) };
      }
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status:'วันหยุด', time:'—', note:'', operator:'' };
    });

    return {
      holiday: { isHoliday, name: holidayName },
      counts: { totalStudents: total, inOnTime, late: 0, out, absent: 0, notInYet: 0, leaveBusiness: 0, leaveSick: 0 },
      rows
    };
  }

  const inOnTime = logsOfDay.filter(a => a.status === STAT.IN).length;
  const late     = logsOfDay.filter(a => a.status === STAT.LATE).length;
  const out      = logsOfDay.filter(a => a.status === STAT.OUT).length;
  const absent   = logsOfDay.filter(a => a.status === STAT.ABS).length;

  const leavesOfDay = leaves.filter(
    l => l.status === 'อนุมัติ' &&
         within(dateYMD, l.date_from, l.date_to) &&
         allowedIds.has(l.student_id)
  );
  const leaveBusiness = leavesOfDay.filter(l => l.type === 'ธุระส่วนตัว').length;
  const leaveSick     = leavesOfDay.filter(l => l.type === 'ป่วย').length;

  const touchedIds = new Set([
    ...logsOfDay.map(a => a.student_id),
    ...leavesOfDay.map(l => l.student_id),
  ]);
  const notInYet = total - touchedIds.size;

  const rows = allowedStudents.map(s => {
    const logs = logsOfDay.filter(a => a.student_id === s.id);

    const absLog = logs.find(l => l.status === STAT.ABS);
    if (absLog) {
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.ABS, time:'—', note:'ไม่มาเรียน', operator: pickOp(absLog) };
    }

    // ถ้าครูบันทึก "ลา" ด้วยมือ ให้ใช้ log นี้ (จะมี operator)
    const leaveAttLog = logs.find(l => l.status === STAT.LEAVE);
    if (leaveAttLog) {
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.LEAVE, time:'—', note: leaveAttLog.note || 'ลา', operator: pickOp(leaveAttLog) };
    }

    // ถ้ามาจากคำร้องที่อนุมัติ จะไม่มี operator
    const leaveApproved = leavesOfDay.find(l => l.student_id === s.id);
    if (leaveApproved) {
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.LEAVE, time:'—', note: leaveApproved.type, operator: '' };
    }

    const outLog = logs.filter(l => l.status === STAT.OUT).sort((a,b)=>b.time.localeCompare(a.time))[0];
    if (outLog) {
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: STAT.OUT, time: outLog.time, note:'', operator: pickOp(outLog) };
    }

    const inLog = logs.find(l => l.status === STAT.IN || l.status === STAT.LATE);
    if (inLog) {
      return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: inLog.status, time: inLog.time, note: inLog.note || '', operator: pickOp(inLog) };
    }

    return { id:`${dateYMD}-${s.id}`, student_id:s.id, student_name:s.full_name, status: 'ยังไม่เข้าโรงเรียน', time:'—', note:'', operator:'' };
  });

  return {
    holiday: { isHoliday: false, name: '' },
    counts: { totalStudents: total, inOnTime, late, out, absent, notInYet, leaveBusiness, leaveSick },
    rows
  };
}

export async function getDashboard() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  const fmt = d => d.toISOString().slice(0, 10);
  const summary = await getAttendanceSummary({ start: fmt(start), end: fmt(today) });
  const anns = await getAnnouncements();
  return { summary, announcements: anns };
}