// src/mocks/studentsApi.js
import { delay, students, norm } from './db';

export async function listStudents({ q = '' } = {}) {
  await delay();
  const k = norm(q);
  if (!k) return students;
  return students.filter(s =>
    [s.code, s.first_name, s.last_name, s.full_name].some(v => norm(v).includes(k))
  );
}