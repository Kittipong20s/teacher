import http from '../../api/http';
import { EP } from '../../api/endpoints';

// ค้นหารายการคำร้องลา
// params ตัวอย่าง: { page, status, student_id, classroom, date_from, date_to }
export async function listLeaveRequests(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '') return;
    q.set(k, String(v));
  });
  const qs = q.toString();
  const url = qs ? `${EP.LEAVE_REQUESTS}?${qs}` : EP.LEAVE_REQUESTS;
  return http.get(url);
}

// รายละเอียดคำร้องลา (สำหรับหน้า LeaveRequestDetail.jsx ถ้ามี)
export async function getLeaveRequestDetail(id) {
  return http.get(`${EP.LEAVE_REQUESTS}/${id}`);
}

// อนุมัติ/ไม่อนุมัติ
export async function approveLeave(id, note = '') {
  return http.post(`${EP.LEAVE_REQUESTS}/${id}/approve`, { note });
}
export async function rejectLeave(id, note = '') {
  return http.post(`${EP.LEAVE_REQUESTS}/${id}/reject`, { note });
}