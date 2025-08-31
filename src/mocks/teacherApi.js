// src/mocks/teacherApi.js
// re-export ฟังก์ชันจากไฟล์ย่อย — หน้าเดิมไม่ต้องแก้ import
export * from './meApi';
export * from './studentsApi';
export * from './attendanceApi';
export * from './leavesApi';
export * from './announcementsApi';
export * from './dashboardApi';

// ---------- เพิ่ม wrapper สำหรับคำร้องลา ให้หน้า LeaveRequestsPage ใช้ได้ทันที ----------
import { updateLeaveRequest } from './leavesApi';

/** อนุมัติคำร้องลา */
export async function approveLeaveRequest(id) {
  return updateLeaveRequest(id, { status: 'อนุมัติ' });
}

/** ปฏิเสธคำร้องลา */
export async function rejectLeaveRequest(id, rejectReason = '') {
  return updateLeaveRequest(id, { status: 'ปฏิเสธ', rejectReason });
}