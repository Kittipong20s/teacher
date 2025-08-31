// src/features/auth/authApi.js
import http from '../../api/http';
import { EP } from '../../api/endpoints';

/* =========================
   Storage helpers (ให้ LoginPage.jsx import ได้)
   ========================= */
const TK_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function setToken(token) {
  if (token) localStorage.setItem(TK_KEY, token);
  else localStorage.removeItem(TK_KEY);
}
export function getToken() {
  return localStorage.getItem(TK_KEY) || '';
}
export function setUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}
export function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
}
export function clearAuthAll() {
  localStorage.removeItem(TK_KEY);
  localStorage.removeItem(USER_KEY);
}

/* =========================
   API calls (เผื่อใช้ตอนต่อหลังบ้านจริง)
   ========================= */

// เข้าสู่ระบบ — รองรับทั้ง username หรือ email
export async function login(identity, password, role) {
  const isEmail = typeof identity === 'string' && identity.includes('@');
  const body = isEmail ? { email: identity, password } : { username: identity, password };
  if (role) body.role = role; // ถ้าหลังบ้านต้องการ role

  // คาดหวังผลลัพธ์ { token, user }
  return http.post(EP.AUTH_LOGIN, body);
}

// ดึงข้อมูลผู้ใช้ปัจจุบัน
export async function getMe() {
  return http.get(EP.AUTH_ME);
}

// รีเฟรชโทเคน (มีเมื่อหลังบ้านรองรับเท่านั้น)
export async function refreshToken(refresh_token) {
  if (!EP.AUTH_REFRESH) {
    const e = new Error('NOT_CONFIGURED');
    e.payload = { error: 'AUTH_REFRESH endpoint is not configured' };
    throw e;
  }
  return http.post(EP.AUTH_REFRESH, { refresh_token });
}