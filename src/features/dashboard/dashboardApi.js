import http from '../../api/http';
import { EP } from '../../api/endpoints';

// สรุปข้อมูลประจำวัน (กล่องสรุป + ตาราง)
// GET /dashboard?date=YYYY-MM-DD&classroom=1/6
export async function getDailyDashboard(dateYMD, classroomCode = '') {
  const params = new URLSearchParams();
  if (dateYMD) params.set('date', dateYMD);
  if (classroomCode) params.set('classroom', classroomCode);
  return http.get(`${EP.DASHBOARD}?${params.toString()}`);
}

// รายชื่อนักเรียน (ใช้ในชิปกรอง)
// GET /students?classroom=1/6
export async function listStudents(classroomCode = '') {
  const qs = classroomCode ? `?classroom=${encodeURIComponent(classroomCode)}` : '';
  return http.get(`${EP.STUDENTS}${qs}`);
}

// บันทึก/แก้ไขสถานะของนักเรียน ณ วันที่กำหนด
// POST /attendance
// payload ตัวอย่าง:
// { student_id, date: '2025-08-27', status: 'เข้า'|'ออก'|'มาสาย'|'ขาด'|'ลาป่วย'|'ลากิจ'|'ยังไม่เข้าโรงเรียน', note, operator }
export async function updateStudentStatusForDate(studentId, dateYMD, status, note = '', operator = '') {
  return http.post(EP.ATTENDANCE, {
    student_id: Number(studentId),
    date: dateYMD,
    status,
    note,
    operator
  });
}

// วันหยุด/ปฏิทินโรงเรียน (ถ้าหน้าแดชบอร์ดต้องใช้)
// GET /calendar?date=YYYY-MM-DD
export async function getSchoolCalendar(dateYMD) {
  const qs = dateYMD ? `?date=${encodeURIComponent(dateYMD)}` : '';
  return http.get(`${EP.CALENDAR}${qs}`);
}

// (ถ้าหน้าอื่นเรียกใช้ getMe จากที่นี่ด้วย)
export async function getMe() {
  // reuse ของ authApi ก็ได้ แต่ไว้ให้ import ง่ายจากที่เดียว
  return http.get('/auth/me');
}