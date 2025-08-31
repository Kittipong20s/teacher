import {
  delay, attendance, students, leaves,
  within, norm, STAT
} from './db';

export async function listAttendance({ start, end, studentId, statuses = [], q = '' } = {}) {
  await delay();
  const sel = new Set(statuses || []);
  const k = norm(q);
  return attendance.filter(a => {
    if (!within(a.date, start, end)) return false;
    if (studentId && a.student_id !== Number(studentId)) return false;
    if (sel.size && !sel.has(a.status)) return false;
    if (k && !norm(a.channel + ' ' + a.note).includes(k)) return false;
    return true;
  });
}

export async function getAttendanceSummary({ start, end } = {}) {
  await delay();
  const logs = attendance.filter(a => within(a.date, start, end));
  const byStatus = logs.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
  const totalLogs = logs.length;

  const byStuLate = new Map();
  const byStuAbs = new Map();
  logs.forEach(l => {
    if (l.status === STAT.LATE) byStuLate.set(l.student_id, (byStuLate.get(l.student_id) || 0) + 1);
    if (l.status === STAT.ABS) byStuAbs.set(l.student_id, (byStuAbs.get(l.student_id) || 0) + 1);
  });

  const topLate = [...byStuLate.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sid, n]) => ({ student: students.find(s => s.id === sid)?.full_name || sid, count: n }));

  const topAbsent = [...byStuAbs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sid, n]) => ({ student: students.find(s => s.id === sid)?.full_name || sid, count: n }));

  return {
    totalStudents: students.length,
    totalLogs,
    onTime: byStatus[STAT.IN] || 0,
    late: byStatus[STAT.LATE] || 0,
    absent: byStatus[STAT.ABS] || 0,
    topLate,
    topAbsent,
  };
}

/* ----- summary ต่อช่วงเวลา (รายคน) ----- */
export async function getAttendanceAggregate({ start, end, studentId }) {
  await delay(220);
  const filtered = attendance.filter(a =>
    within(a.date, start, end) && (!studentId || a.student_id === Number(studentId))
  );

  const byStu = new Map();
  filtered.forEach(a => {
    const rec = byStu.get(a.student_id) || {
      student_id: a.student_id,
      student_name: students.find(s => s.id === a.student_id)?.full_name || a.student_id,
      inOnTime: 0, late: 0, out: 0, absent: 0, leave: 0
    };
    if (a.status === STAT.IN) rec.inOnTime += 1;
    else if (a.status === STAT.LATE) rec.late += 1;
    else if (a.status === STAT.OUT) rec.out += 1;
    else if (a.status === STAT.ABS) rec.absent += 1;
    else if (a.status === STAT.LEAVE) rec.leave += 1;
    byStu.set(a.student_id, rec);
  });

  return [...byStu.values()].sort((a,b) => a.student_name.localeCompare(b.student_name));
}

/* ----- helper สำหรับหน้า My Class ----- */
function onLeaveTypeForDate(studentId, dateYMD) {
  const rec = leaves.find(l =>
    l.student_id === studentId &&
    l.status === 'อนุมัติ' &&
    within(dateYMD, l.date_from, l.date_to)
  );
  return rec ? (rec.type || 'ลา') : null;
}
export function summarizeStatusForDate(studentId, dateYMD) {
  const logs = attendance.filter(a => a.student_id === studentId && a.date === dateYMD);

  if (logs.some(l => l.status === STAT.ABS)) {
    return { status: STAT.ABS, time: '—', note: 'ไม่มาเรียน' };
  }
  const leaveType = onLeaveTypeForDate(studentId, dateYMD);
  if (leaveType) {
    return { status: STAT.LEAVE, time: '—', note: leaveType };
  }
  const leaveLog = logs.find(l => l.status === STAT.LEAVE);
  if (leaveLog) {
    return { status: STAT.LEAVE, time: '—', note: leaveLog.note || 'ลา' };
  }
  const out = logs.filter(l => l.status === STAT.OUT).sort((a,b)=>b.time.localeCompare(a.time))[0];
  if (out) return { status: STAT.OUT, time: out.time, note: '' };
  const inLog = logs.find(l => l.status === STAT.IN || l.status === STAT.LATE);
  if (inLog) return { status: inLog.status, time: inLog.time, note: inLog.note || '' };
  return { status: 'ยังไม่เข้าโรงเรียน', time: '—', note: '' };
}

export async function listStatusesForDate(dateYMD) {
  await delay(150);
  return students.map(s => {
    const sum = summarizeStatusForDate(s.id, dateYMD);
    return {
      student_id: s.id,
      student_name: s.full_name,
      status: sum.status,
      time: sum.time,
      note: sum.note
    };
  });
}

/* ====== ที่ต้องแก้เพื่อบันทึกชื่อผู้ดำเนินการ ====== */
export async function updateStudentStatusForDate(studentId, dateYMD, status, note = '', operator = '') {
  await delay(150);
  // ลบ log เดิมของวันนั้น (ความง่าย)
  for (let i = attendance.length - 1; i >= 0; i--) {
    if (attendance[i].student_id === studentId && attendance[i].date === dateYMD) {
      attendance.splice(i, 1);
    }
  }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeNow = `${hh}:${mm}`;

  if (status === 'ลากิจ' || status === 'ลาป่วย') {
    attendance.push({
      id: `${dateYMD}-${studentId}-LEAVE-MAN`,
      date: dateYMD,
      time: '—',
      status: STAT.LEAVE,
      channel: '-',
      note: status === 'ลากิจ' ? 'ธุระส่วนตัว' : 'ป่วย',
      student_id: studentId,
      attach: true,
      operator: operator || '',
      byName: operator || ''
    });
    return { ok: true };
  }

  if (status === 'ยังไม่เข้าโรงเรียน') return { ok: true };

  const map = { 'เข้า': STAT.IN, 'ออก': STAT.OUT, 'มาสาย': STAT.LATE, 'ขาด': STAT.ABS };
  const to = map[status] || status;

  attendance.push({
    id: `${dateYMD}-${studentId}-${to}-MAN`,
    date: dateYMD,
    time: to === STAT.ABS ? '—' : timeNow,
    status: to,
    channel: to === STAT.OUT ? 'ประตูหน้า' : 'จุดสแกน A',
    note: note || (to === STAT.LATE ? 'มาสาย' : ''),
    student_id: studentId,
    attach: false,
    operator: operator || '',
    byName: operator || ''
  });

  return { ok: true };
}