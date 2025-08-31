// src/features/summary/SummaryReportPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Page from '../../components/ui/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import { Input, Label, Button } from '../../components/ui/Controls.jsx';
import { getMe, listStudents, listAttendance } from '../../mocks/teacherApi';

/* -------------------- helpers -------------------- */
function parseClass(code = '') {
  const m = String(code).match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  return { grade: Number(m[1]), room: Number(m[2]) };
}
function filterByClass(list = [], code = '') {
  const pr = parseClass(code);
  if (!pr) return list;
  return list.filter(s => Number(s.grade) === pr.grade && Number(s.room) === pr.room);
}
/* dd/mm/yyyy (เลี่ยง monthsShort ที่ไม่ใช้) */
function thaiDateShort(ymd) {
  if (!ymd) return '—';
  const d = new Date(ymd + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function SummaryReportPage() {
  // ผู้ใช้ + ห้องเรียน
  const [classroom, setClassroom] = useState('');
  const [classOptions, setClassOptions] = useState([]);

  // รายชื่อนักเรียน (ไว้ใช้กรองตอนส่งออก)
  const [students, setStudents] = useState([]);
  const [classStudents, setClassStudents] = useState([]);

  // ฟิลเตอร์
  const [query, setQuery] = useState('');
  const [datePivot, setDatePivot] = useState(() => new Date().toISOString().slice(0, 10));
  const [studentId, setStudentId] = useState('ALL');
  const [checked, setChecked] = useState({
    'เข้า': true,
    'ออก': true,
    'มาสาย': true,
    'ขาด': true,
    'ลากิจ': true,
    'ลาป่วย': true,
  });

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    (async () => {
      const meRes = await getMe();
      const list = Array.isArray(meRes?.classrooms) ? meRes.classrooms : [];
      if (list.length) {
        // ✅ ใช้ comparator ที่อ้างทั้ง a และ b เพื่อลด warning no-unused-vars
        const roleWeight = (r) => (String(r.role || '').toLowerCase() === 'main' ? 0 : 1);
        const sorted = [...list].sort((a, b) => roleWeight(a) - roleWeight(b));
        const opts = sorted.map(c => ({
          value: c.code,
          label: `${c.code}${(c.role || '') === 'main' ? ' (ประจำหลัก)' : ' (ประจำรอง)'}`
        }));
        setClassOptions(opts);
        setClassroom(prev => prev || (sorted[0]?.code || ''));
      } else {
        const code = meRes?.homeroom?.code || '';
        setClassOptions(code ? [{ value: code, label: code }] : []);
        setClassroom(code);
      }
    })();
  }, []);

  // โหลดรายชื่อนักเรียนเมื่อเปลี่ยนห้อง
  useEffect(() => {
    (async () => {
      const all = await listStudents();
      setStudents(all);
      setClassStudents(filterByClass(all, classroom));
      setStudentId('ALL');
    })();
  }, [classroom]);

  // ช่วงวันที่ (รายวันอิง datePivot)
  const range = useMemo(() => ({ start: datePivot, end: datePivot }), [datePivot]);

  // รวมพารามิเตอร์ส่งออก
  const buildParams = () => {
    const idsInClass = new Set(classStudents.map(s => s.id));
    const statuses = Object.entries(checked).filter(([, v]) => v).map(([k]) => k);
    return {
      start: range.start,
      end: range.end,
      statuses,
      studentId: studentId === 'ALL' ? undefined : Number(studentId),
      classIds: idsInClass,
      q: query,
    };
  };

  // เตรียมข้อมูลใช้ส่งออก (ไม่แสดงตัวอย่าง)
  async function queryDataForExport() {
    const params = buildParams();
    const logs = await listAttendance({
      start: params.start,
      end: params.end,
      studentId: params.studentId,
      statuses: params.statuses,
      q: params.q,
    });

    const ids = params.classIds;
    const filtered = logs.filter(l => ids.has(l.student_id));

    const smap = new Map(students.map(s => [s.id, s]));
    return filtered.map(r => {
      const s = smap.get(r.student_id);
      return {
        code: s?.code || r.student_id,
        student: s?.full_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim(),
        classroom: s ? `${s.grade}/${s.room}` : '',
        date: thaiDateShort(r.date),
        time: r.time,
        status: r.status,
        note: r.status === 'ขาด' ? 'ไม่มาเรียน' : (r.note || ''),
        operator: r.operator || r.byName || '',
      };
    });
  }

  // ส่งออก CSV
  async function handleExportCSV() {
    const rows = await queryDataForExport();
    const header = ['รหัส', 'ชื่อ–สกุล', 'ห้องเรียน', 'วันที่', 'เวลา', 'สถานะ', 'หมายเหตุ', 'ผู้ดำเนินการ'];
    const csv = [
      '\ufeff' + header.join(','),
      ...rows.map(r =>
        [r.code, r.student, r.classroom, r.date, r.time, r.status, (r.note || '').replace(/,/g, ' '), (r.operator || '').replace(/,/g, ' ')].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานการมาเรียน_${classroom || 'ทุกห้อง'}_${range.start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ส่งออก XLSX แบบง่าย (CSV → .xlsx)
  async function handleExportXLSX() {
    const rows = await queryDataForExport();
    const header = ['รหัส', 'ชื่อ–สกุล', 'ห้องเรียน', 'วันที่', 'เวลา', 'สถานะ', 'หมายเหตุ', 'ผู้ดำเนินการ'];
    const csv = [
      '\ufeff' + header.join(','),
      ...rows.map(r =>
        [r.code, r.student, r.classroom, r.date, r.time, r.status, (r.note || '').replace(/,/g, ' '), (r.operator || '').replace(/,/g, ' ')].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายงานการมาเรียน_${classroom || 'ทุกห้อง'}_${range.start}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const studentOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ids = new Set(classStudents.map(s => s.id));
    return students
      .filter(s => ids.has(s.id))
      .filter(s => {
        if (!q) return true;
        const full = (s.full_name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
        return full.includes(q) || String(s.code || '').includes(q);
      })
      .map(s => ({
        value: String(s.id),
        label: `${s.code || s.id} • ${s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}`
      }));
  }, [students, classStudents, query]);

  return (
    <Page title="สรุปรายงาน">
      {/* ฟอร์มเลือกเงื่อนไข — ไม่มีปุ่มค้นหา/ไม่มีตาราง */}
      <Card>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <Label>ค้นหา (รหัสนักเรียน / ชื่อ–สกุล)</Label>
            <Input
              placeholder="เช่น 10023, เด็กชาย หมายเลข 5"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          <div className="field">
            <Label>เลือกวันอ้างอิง</Label>
            <Input type="date" value={datePivot} onChange={e => setDatePivot(e.target.value)} />
            <div className="hint">ช่วงอัตโนมัติ: {range.start} → {range.end} ({thaiDateShort(range.start)})</div>
          </div>

          <div className="field">
            <Label>ห้องเรียน</Label>
            <select className="input" value={classroom} onChange={e => setClassroom(e.target.value)}>
              {classOptions.length === 0
                ? <option value="">— ไม่มีข้อมูลห้อง —</option>
                : classOptions.map(op => <option key={op.value} value={op.value}>{op.label}</option>)
              }
            </select>
            <div className="hint">รองรับห้องหลัก/ห้องรอง หากมี</div>
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <Label>นักเรียน</Label>
            <select className="input" value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="ALL">— ทั้งหมด —</option>
              {studentOptions.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <Label>สถานะ</Label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {Object.keys(checked).map(k => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={checked[k]}
                    onChange={e => setChecked(prev => ({ ...prev, [k]: e.target.checked }))}
                  />
                  {k}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ปุ่มส่งออกเท่านั้น */}
      <Card>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={handleExportCSV}>ส่งออก .csv</Button>
          <Button onClick={handleExportXLSX}>ส่งออก .xlsx</Button>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          ระบบจะส่งออกข้อมูลตามเงื่อนไขด้านบนโดยไม่แสดงตัวอย่างบนหน้าเว็บ
        </div>
      </Card>
    </Page>
  );
}