import http from '../../api/http';
import { EP } from '../../api/endpoints';

// ดึงโปรไฟล์ครู
export async function getProfile() {
  return http.get(EP.PROFILE);
}

// อัปเดตโปรไฟล์ครู
// payload เช่น { phone, email, display_name }
export async function updateProfile(payload) {
  return http.put(EP.PROFILE, payload);
}

// เปลี่ยนรหัสผ่าน
export async function changePassword(old_password, new_password) {
  return http.post(EP.PROFILE_CHANGE_PASSWORD, { old_password, new_password });
}