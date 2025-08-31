// src/features/leave-requests/LeaveRequestsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Page from '../../components/ui/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import CommonModal from '../../components/CommonModal.jsx';
import { Input, Label, Button } from '../../components/ui/Controls.jsx';
import Pagination from '../../components/Pagination.jsx';

// เปลี่ยนให้ตรงกับของคุณถ้าชื่อไม่เหมือน
import {
  listLeaveRequests,       // ดึงรายการคำร้องลา
  approveLeaveRequest,     // อนุมัติ
  rejectLeaveRequest       // ปฏิเสธ
} from '../../mocks/teacherApi';

const PER_PAGE = 10;

function thai(ymd) {
  if (!ymd) return '—';
  const d = new Date(ymd + 'T00:00:00');
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export default function LeaveRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);

  // ฟิลเตอร์เบื้องต้น
  const [status, setStatus] = useState('ALL');   // ALL | pending | approved | rejected
  const [type, setType] = useState('ALL');       // ALL | ป่วย | ธุระส่วนตัว | อื่นๆ
  const [fromDate, setFromDate] = useState('');
  const [q, setQ] = useState('');

  // โมดัล
  const [view, setView] = useState(null);        // แสดงรายละเอียด + อนุมัติ/ปฏิเสธ
  const [decisionNote, setDecisionNote] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await listLeaveRequests({
          status: status === 'ALL' ? undefined : status,
          type: type === 'ALL' ? undefined : type,
          from: fromDate || undefined,
          q
        });
        setRows(res || []);
        setPage(1);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, type, fromDate, q]);

  const displayRows = useMemo(() => {
    const collator = new Intl.Collator('th');
    return [...rows].sort((a, b) => new Date(b.request_date) - new Date(a.request_date))
      .sort((a, b) => collator.compare(a.student_name || '', b.student_name || ''));
  }, [rows]);

  const visRows = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return displayRows.slice(start, start + PER_PAGE);
  }, [displayRows, page]);

  async function doApprove() {
    if (!view) return;
    await approveLeaveRequest(view.id, { note: decisionNote });
    setView(null);
    setDecisionNote('');
    // refresh
    const res = await listLeaveRequests({
      status: status === 'ALL' ? undefined : status,
      type: type === 'ALL' ? undefined : type,
      from: fromDate || undefined,
      q
    });
    setRows(res || []);
  }
  async function doReject() {
    if (!view) return;
    await rejectLeaveRequest(view.id, { note: decisionNote });
    setView(null);
    setDecisionNote('');
    const res = await listLeaveRequests({
      status: status === 'ALL' ? undefined : status,
      type: type === 'ALL' ? undefined : type,
      from: fromDate || undefined,
      q
    });
    setRows(res || []);
  }

  return (
    <Page title="คำร้องลา">
      {/* ฟิลเตอร์ */}
      <Card>
        <div className="form-grid">
          <div className="field">
            <Label>สถานะ</Label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="ALL">— ทั้งหมด —</option>
              <option value="pending">รออนุมัติ</option>
              <option value="approved">อนุมัติ</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>

          <div className="field">
            <Label>ประเภท</Label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              <option value="ALL">— ทั้งหมด —</option>
              <option value="ป่วย">ป่วย</option>
              <option value="ธุระส่วนตัว">ธุระส่วนตัว</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          <div className="field">
            <Label>ตั้งแต่วันที่</Label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <Label>ค้นหา (รหัส/ชื่อ–สกุล/เหตุผล)</Label>
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="เช่น 10001, เด็กชาย ขยัน, ทำธุระสำคัญ" />
          </div>
        </div>
      </Card>

      {/* ตาราง */}
      <Card>
        {loading ? 'กำลังโหลด…' : (
          <>
            <div className="att-wrap" style={{ marginTop: 8 }}>
              <table className="att-table">
                <thead>
                  <tr>
                    <Th>วันที่ยื่น</Th>
                    <Th>นักเรียน</Th>
                    <Th>ประเภท</Th>
                    <Th>ช่วงลา</Th>
                    <Th>เหตุผล</Th>
                    <Th>ไฟล์แนบ</Th>
                    <Th>สถานะ</Th>
                    <Th className="__actions">การทำงาน</Th>
                  </tr>
                </thead>
                <tbody>
                  {visRows.length === 0 ? (
                    <tr><Td colSpan={8} style={{ color: '#6b7280' }}>— ไม่พบข้อมูล —</Td></tr>
                  ) : visRows.map(r => (
                    <tr key={r.id}>
                      <Td>{thai(r.request_date)}</Td>
                      <Td>{r.student_code || r.student_id} • {r.student_name}</Td>
                      <Td>{r.type}</Td>
                      <Td>{thai(r.date_from)} → {thai(r.date_to)}</Td>
                      <Td>{r.reason || '—'}</Td>
                      <Td>{r.files?.length ? `มี (${r.files.length})` : '—'}</Td>
                      <Td>
                        {r.status === 'pending' ? <span style={{ background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:999, fontSize:13 }}>รออนุมัติ</span>
                          : r.status === 'approved' ? <span style={{ background:'#dcfce7', color:'#166534', padding:'2px 8px', borderRadius:999, fontSize:13 }}>อนุมัติ</span>
                          : <span style={{ background:'#fee2e2', color:'#991b1b', padding:'2px 8px', borderRadius:999, fontSize:13 }}>ปฏิเสธ</span>}
                      </Td>
                      <Td className="__actions">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="secondary" onClick={() => { setView(r); setDecisionNote(''); }} title="ดู/อนุมัติ">
                            🔍 <span className="btn-text">รายละเอียด</span>
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} perPage={PER_PAGE} total={displayRows.length} onPage={setPage} />
          </>
        )}
      </Card>

      <DetailModal
        open={!!view}
        onClose={() => setView(null)}
        data={view}
        decisionNote={decisionNote}
        setDecisionNote={setDecisionNote}
        onApprove={doApprove}
        onReject={doReject}
      />
    </Page>
  );
}

/* ---------- UI minis ---------- */
function Th({ children, className, ...p }) {
  return <th {...p} className={className} style={{ textAlign:'left', padding:'8px 6px', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>{children}</th>;
}
function Td({ children, ...p }) {
  return <td {...p} style={{ padding:'8px 6px', borderBottom:'1px solid #f3f4f6' }}>{children}</td>;
}

/* ---------- Modal (เพิ่มข้อมูลผู้ปกครอง) ---------- */
function DetailModal({ open, onClose, data, decisionNote, setDecisionNote, onApprove, onReject }) {
  if (!open) return null;
  if (!data) return null;

  const guardianName = data.guardian_name || data.parent_name || '—';
  const guardianPhone = data.guardian_phone || data.parent_phone || '—';

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={`คำร้อง ${data.code || data.id || ''}`}
      actions={(
        <>
          <Button variant="secondary" onClick={onClose}>ปิด</Button>
          <Button variant="secondary" onClick={onReject}>ปฏิเสธ</Button>
          <Button onClick={onApprove}>อนุมัติ</Button>
        </>
      )}
    >
      <div style={{ display:'grid', gap:10 }}>
        <div><b>วันที่ยื่น:</b> {thai(data.request_date)}</div>
        <div><b>นักเรียน:</b> {data.student_name} ({data.student_code || data.student_id})</div>
        <div><b>ประเภท:</b> {data.type}</div>
        <div><b>ช่วงลา:</b> {thai(data.date_from)} → {thai(data.date_to)}</div>
        <div><b>เหตุผล:</b> {data.reason || '—'}</div>
        <div><b>ไฟล์แนบ:</b> {data.files?.length ? `มี (${data.files.length})` : '—'}</div>

        {/* ⭐ เพิ่มข้อมูลผู้ปกครอง */}
        <div style={{ marginTop:4 }}>
          <b>ข้อมูลผู้ปกครอง:</b>
          <div style={{ display:'grid', gap:6, marginTop:6 }}>
            <div><b>ชื่อ–สกุล:</b> {guardianName}</div>
            <div><b>เบอร์โทร:</b> {guardianPhone}</div>
          </div>
        </div>

        <div style={{ marginTop:10 }}>
          <Label>เหตุผลการปฏิบัติ (กรอกเมื่อต้องการบันทึก)</Label>
          <Input value={decisionNote} onChange={e => setDecisionNote(e.target.value)} placeholder="ระบุเหตุผล (ถ้าปฏิเสธ)" />
        </div>
      </div>
    </CommonModal>
  );
}