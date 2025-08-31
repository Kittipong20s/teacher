import http from '../../api/http';
import { EP } from '../../api/endpoints';

// ดึงสรุปรายงานตามช่วงเวลา/ห้อง/สถานะ ฯลฯ
// params ตัวอย่าง:
// { date_from, date_to, classroom, student_id, statuses: ['เข้า','มาสาย',...]}
export async function getSummary(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '') return;
    if (Array.isArray(v)) v.forEach(x => q.append(k, x));
    else q.set(k, v);
  });
  const qs = q.toString();
  const url = qs ? `${EP.SUMMARY}?${qs}` : EP.SUMMARY;
  return http.get(url);
}

// ส่งออก CSV (สมมุติว่าหลังบ้านส่งลิงก์หรือ job result เป็น JSON)
// ถ้าหลังบ้านส่งไฟล์ blob ตรง ๆ ควรเขียน fetch ตรงในหน้า UI อีกที
export async function exportCSV(params = {}) {
  return http.post(EP.SUMMARY_EXPORT_CSV, params);
}

export async function exportXLSX(params = {}) {
  return http.post(EP.SUMMARY_EXPORT_XLSX, params);
}