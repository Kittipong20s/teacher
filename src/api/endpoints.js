// รวบรวม path ของทุก resource จาก .env ไว้ที่เดียว
// ช่วยให้หน้าแต่ละหน้า import จากที่นี่ ไม่ต้องฮาร์ดโค้ด

const env = import.meta.env;

// ดึง path จาก .env ถ้าไม่ใส่ ให้มีค่า fallback ที่ใช้ทั่วไป
function p(name, fallback) {
  const v = (env[name] || '').trim();
  if (!v) return fallback;
  return v.startsWith('/') ? v : `/${v}`;
}

export const EP = {
  // ----- Auth / Me -----
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_REFRESH: '/auth/refresh',

  // ----- Dashboard / รายวัน -----
  DASHBOARD: '/dashboard',             // GET ?date=YYYY-MM-DD&classroom=1/6
  STUDENTS: p('VITE_API_STUDENT_PATH', '/students'),
  ATTENDANCE: '/attendance',           // POST บันทึกสถานะรายวัน
  CALENDAR: p('VITE_API_CALENDAR_PATH', '/calendar'),

  // ----- Summary / สรุปรายงาน -----
  SUMMARY: '/summary',
  SUMMARY_EXPORT_CSV: '/summary/export/csv',
  SUMMARY_EXPORT_XLSX: '/summary/export/xlsx',

  // ----- Announcements -----
  ANNOUNCEMENTS: '/announcements',

  // ----- Leave Requests -----
  LEAVE_REQUESTS: '/leave-requests',

  // ----- Profile -----
  PROFILE: '/profile',
  PROFILE_CHANGE_PASSWORD: '/profile/change-password',
};