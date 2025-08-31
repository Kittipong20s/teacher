import http from '../../api/http';
import { EP } from '../../api/endpoints';

// รายการประกาศ
// GET /announcements?page=1&q=keyword
export async function listAnnouncements({ page = 1, q = '' } = {}) {
  const p = new URLSearchParams({ page: String(page) });
  if (q) p.set('q', q);
  return http.get(`${EP.ANNOUNCEMENTS}?${p.toString()}`);
}

// สร้างประกาศใหม่
// payload: { title, body, pinned?:boolean, audience?:'all'|'teachers'|'parents' ... }
export async function createAnnouncement(payload) {
  return http.post(EP.ANNOUNCEMENTS, payload);
}

// ลบประกาศ
export async function deleteAnnouncement(id) {
  return http.del(`${EP.ANNOUNCEMENTS}/${id}`);
}

// ปักหมุด/ยกเลิกปักหมุด (ถ้าหลังบ้านรองรับ)
// POST /announcements/:id/pin { pinned:true|false }
export async function togglePinAnnouncement(id, pinned) {
  return http.post(`${EP.ANNOUNCEMENTS}/${id}/pin`, { pinned: !!pinned });
}