// src/mocks/meApi.js
import { delay, teacher as DB_TEACHER, students, CLASSROOMS } from './db';

function buildFullName(t) {
  return `${t.prefix ? t.prefix + ' ' : ''}${t.first_name} ${t.last_name}`.trim();
}

export async function getMe() {
  await delay(80);

  const homeroomCount = students.filter(
    s => s.grade === DB_TEACHER.homeroom.grade && s.room === DB_TEACHER.homeroom.room
  ).length;

  const full_name = buildFullName(DB_TEACHER);

  return {
    id: DB_TEACHER.id,
    teacher_code: DB_TEACHER.teacher_code,
    full_name,
    prefix: DB_TEACHER.prefix,
    first_name: DB_TEACHER.first_name,
    last_name: DB_TEACHER.last_name,
    email: DB_TEACHER.email,
    phone: DB_TEACHER.phone,
    timezone: DB_TEACHER.timezone,
    locale: DB_TEACHER.locale,
    roles: DB_TEACHER.roles,

    homeroom: { ...DB_TEACHER.homeroom, student_count: homeroomCount },
    classrooms: CLASSROOMS,

    account: {
      username: DB_TEACHER.teacher_code,
      last_login: '2025-08-24T07:11:00Z',
      last_password_change: '2025-06-01T03:10:00Z',
      enabled: true,
    },

    teacher: { ...DB_TEACHER },
  };
}

export async function updateProfile(patch = {}) {
  await delay(150);
  const src = patch.teacher ?? patch;
  Object.assign(DB_TEACHER, src);
  return getMe();
}

// ❌ ไม่มีพารามิเตอร์ → ไม่โดน no-unused-vars
export async function changePassword() {
  await delay(150);
  return { ok: true };
}