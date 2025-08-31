// src/mocks/db.js
// Seed และ utils กลาง (ใช้ร่วมทุกโมดูล)

export const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ---------- ห้องเรียนที่ครูดูแล: หลายห้อง ---------- */
export const CLASSROOMS = [
  { grade: 6, room: 1, code: 'ป.6/1', role: 'main' },       // ครูประจำหลัก
  { grade: 6, room: 2, code: 'ป.6/2', role: 'assistant' },  // ครูประจำรอง
  { grade: 6, room: 3, code: 'ป.6/3', role: 'assistant' },  // ครูประจำรอง
];

/* ---------- ครู (เปลี่ยนเป็นชื่อสมมุติ) ---------- */
export const teacher = {
  id: 101,
  teacher_code: 'T000123',
  prefix: 'ครู',
  first_name: 'อลิสา',
  last_name: 'รัตนกุล',
  email: 'teacher01@school.ac.th',
  phone: '0991234567',
  timezone: 'Asia/Bangkok',
  locale: 'th',
  roles: ['teacher', 'homeroom'],
  homeroom: { grade: 6, room: 1, code: 'ป.6/1' },
  classrooms: CLASSROOMS,
};

/* ---------- รายชื่อนักเรียน: 3 ห้อง × 10 คน (ชื่อจริง-นามสกุลสมมุติทั้งหมด) ---------- */
const maleFirstNames = [
  'ภูริ','กฤติน','ศุภณัฐ','ธนกร','นที','ปรเมศวร์','คเชนทร์','ชยพล','ณัฐดนัย','ปุณณวิช',
  'ธีรภัทร','ปรัชญา','ชยุตม์','พีรวิชญ์','ธนภัทร'
];
const femaleFirstNames = [
  'พิชญา','ชลธิชา','ปัณณ์นภา','ธัญชนก','กัญญารัตน์','นภัสสร','พิมพ์อร','กุลธิดา','ธิดารัตน์','มณีรัตน์',
  'พิมพ์ดาว','พัชราภา','ณิชากร','วรินดา','ขวัญชนก'
];
const lastNames = [
  'ศิริกาญจน์','วัฒนกิจ','สันตะกูล','จันทนภา','อัครเดช','รัตนกุล','สิริมงคล','บุญประสิทธิ์','วงศ์ภักดี','กมลศิลป์',
  'อินทรสุข','ปราชญ์พิพัฒน์','ชนะชัย','พุทธรักษา','เมธารัตน์','ณรงค์เดช','สกุลไทย','ทวีทรัพย์','โสภณพงศ์','จิตอาสา',
  'อัมพรเพชร','ดลวิทย์','สุนทรวาทิน','จตุรงค์กิจ','พานิชกุล','พงศ์เกียรติ','สถาพรชัย','อัครวงศ์','ชลวัฒนา','อุดมเดช'
];

let runningStudentId = 6001;
export const students = CLASSROOMS.flatMap((c, cIdx) => {
  return Array.from({ length: 10 }).map((_, i) => {
    const idx = cIdx * 10 + i;
    const isMale = (idx % 2 === 0);
    const prefix = isMale ? 'เด็กชาย' : 'เด็กหญิง';
    const first = isMale
      ? maleFirstNames[idx % maleFirstNames.length]
      : femaleFirstNames[idx % femaleFirstNames.length];
    const last = lastNames[idx % lastNames.length];

    const id = runningStudentId++;
    const code = String(10000 + cIdx * 100 + (i + 1)); // กันซ้ำแต่ละห้อง

    return {
      id,
      code,
      first_name: first,
      last_name: last,
      full_name: `${prefix} ${first} ${last}`,
      grade: c.grade,
      room: c.room,
    };
  });
});

/* ---------- สถานะ + ประตู ---------- */
export const STAT = { IN: 'เข้า', OUT: 'ออก', LATE: 'มาสาย', ABS: 'ขาด', LEAVE: 'ลา' };
export const gateNames = ['ประตูหน้า', 'ประตูหลัง', 'จุดสแกน A', 'จุดสแกน B'];

/* ---------- ประวัติการเข้าออก 60 วัน (คงพฤติกรรมเดิม) ---------- */
export const attendance = [];
(() => {
  const days = 60;
  const now = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() - d);
    const ymd = date.toISOString().slice(0, 10);

    students.forEach(stu => {
      const r = Math.random();

      if (r < 0.1) {
        attendance.push({
          id: `${ymd}-${stu.id}-ABS`, date: ymd, time: '—',
          status: STAT.ABS, channel: '-', note: 'ไม่มาเรียน', student_id: stu.id, attach: false,
        });
      } else if (r < 0.18) {
        const leaveNote = Math.random() < 0.6 ? 'ป่วย' : 'ธุระส่วนตัว';
        attendance.push({
          id: `${ymd}-${stu.id}-LEAVE`, date: ymd, time: '—',
          status: STAT.LEAVE, channel: '-', note: leaveNote, student_id: stu.id, attach: true,
        });
      } else {
        const late = Math.random() < 0.15;
        attendance.push({
          id: `${ymd}-${stu.id}-IN`, date: ymd,
          time: late ? `08:${randInt(31, 55)}` : `07:${String(randInt(15, 59)).padStart(2, '0')}`,
          status: late ? STAT.LATE : STAT.IN,
          channel: gateNames[randInt(0, gateNames.length - 1)],
          note: late ? 'มาสาย' : '', student_id: stu.id, attach: false,
        });
        attendance.push({
          id: `${ymd}-${stu.id}-OUT`, date: ymd,
          time: `16:${String(randInt(0, 45)).padStart(2, '0')}`,
          status: STAT.OUT,
          channel: gateNames[randInt(0, gateNames.length - 1)],
          note: '', student_id: stu.id, attach: false,
        });
      }
    });
  }
})();

/* ---------- คำร้องลา (เพิ่มข้อมูลผู้ปกครอง) ---------- */
export const leaves = [
  {
    id: 'LV-1001', submitted_at: '2025-08-20',
    student_id: students[2].id, type: 'ป่วย',
    date_from: '2025-08-20', date_to: '2025-08-21',
    status: 'รออนุมัติ', reason: 'มีไข้', attachments: 1, history: [],
    guardian_name: 'นางสาวสมร ใจดี',
    guardian_phone: '081-234-5678',
  },
  {
    id: 'LV-1002', submitted_at: '2025-08-22',
    student_id: students[15].id, type: 'ธุระส่วนตัว',
    date_from: '2025-08-23', date_to: '2025-08-23',
    status: 'อนุมัติ', reason: 'ไปทำบัตรประชาชน', attachments: 0,
    history: [{ by: teacher.teacher_code, action: 'อนุมัติ', at: '2025-08-22T10:20:00Z' }],
    guardian_name: 'นายสมชาย ขยันดี',
    guardian_phone: '089-999-0000',
  },
];

/* ---------- ประกาศ ---------- */
export const announcements = [
  { id: 'AN-1', title: 'ปิดเรียน 1 วัน', body: 'ปิดเรียนวันที่ 25 ส.ค. เพื่ออบรมครู', created_at: '2025-08-18T02:00:00Z' },
  { id: 'AN-2', title: 'ประกวดวิทยาศาสตร์', body: 'รับสมัครถึง 31 ส.ค.', created_at: '2025-08-21T05:45:00Z' },
];

/* ---------- Helpers ---------- */
export const within = (d, start, end) => (!start || d >= start) && (!end || d <= end);
export const norm = s => (s ?? '').toString().trim().toLowerCase();

export function parseClass(code = '') {
  const m = String(code).match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  return { grade: Number(m[1]), room: Number(m[2]) };
}
export function filterByClass(list = [], classCode = '') {
  const pr = parseClass(classCode);
  if (!pr) return list;
  return list.filter(s => Number(s.grade) === pr.grade && Number(s.room) === pr.room);
}

/* ---------- วันหยุด ---------- */
export const SCHOOL_HOLIDAYS = new Map([
  ['2025-12-05', 'วันพ่อแห่งชาติ'],
  ['2025-12-31', 'วันสิ้นปี'],
]);
export function isWeekend(ymd) {
  const d = new Date(ymd);
  const day = d.getDay(); // 0=อา,6=ส
  return day === 0 || day === 6;
}
export function getHolidayInfo(ymd) {
  if (SCHOOL_HOLIDAYS.has(ymd)) return { isHoliday: true, name: SCHOOL_HOLIDAYS.get(ymd) };
  if (isWeekend(ymd)) return { isHoliday: true, name: 'วันหยุดสุดสัปดาห์' };
  return { isHoliday: false, name: '' };
}