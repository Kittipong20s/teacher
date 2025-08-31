// src/mocks/leavesApi.js
import { delay, leaves, teacher, norm } from './db';

export async function listLeaveRequests(filters = {}) {
  await delay();
  const { status, type, studentId, from, to, q = '' } = filters;
  const k = norm(q);
  const overlap = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || aStart > bEnd);

  return leaves.filter(l => {
    if (status && l.status !== status) return false;
    if (type && l.type !== type) return false;
    if (studentId && l.student_id !== Number(studentId)) return false;
    if (from && to && !overlap(l.date_from, l.date_to, from, to)) return false;

    // ให้คำค้นหาเจอทั้งเหตุผล/ชื่อผู้ปกครอง/เบอร์โทร
    if (k) {
      const hay = norm([l.reason, l.guardian_name, l.guardian_phone].filter(Boolean).join(' '));
      if (!hay.includes(k)) return false;
    }
    return true;
  });
}

export async function updateLeaveRequest(id, { status, rejectReason }) {
  await delay(300);
  const idx = leaves.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('ไม่พบคำร้อง');
  const l = leaves[idx];
  l.status = status;
  l.history.push({
    by: teacher.teacher_code,
    action: status === 'อนุมัติ' ? 'อนุมัติ' : 'ปฏิเสธ',
    at: new Date().toISOString(),
    note: rejectReason || '',
  });
  return l;
}

export async function getPendingLeaveCount() {
  await delay(120);
  return leaves.filter(l => l.status === 'รออนุมัติ').length;
}