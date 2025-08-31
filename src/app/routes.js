// src/app/routes.js

// เส้นทางหลัก (เว็บคุณครู)
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  // ❌ ลบ: MY_CLASS: '/my-class',
  LEAVE_REQUESTS: '/leaves/requests',
  ANNOUNCEMENTS: '/announcements',
  PROFILE: '/profile',

  // หน้าใหม่ที่รวมรายงาน
  SUMMARY: '/summary',
};

// เมนูด้านซ้าย (ถ้าโค้ดส่วนอื่นยังใช้)
export const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'แดชบอร์ด' },
  // ❌ ลบ: { path: ROUTES.MY_CLASS, label: 'ห้องของฉัน' },
  { path: ROUTES.SUMMARY, label: 'สรุปรายงาน' },
  { path: ROUTES.LEAVE_REQUESTS, label: 'คำร้องลา' },
  { path: ROUTES.ANNOUNCEMENTS, label: 'ประกาศ' },
  { path: ROUTES.PROFILE, label: 'โปรไฟล์ & รหัสผ่าน' },
];

// (ลบคีย์ ATT_HISTORY, ATT_REPORT, LEAVE_REPORT ออกแล้ว)