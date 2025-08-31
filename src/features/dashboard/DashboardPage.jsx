// src/features/dashboard/DashboardPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Page from '../../components/ui/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import CommonModal from '../../components/CommonModal.jsx';
import { Input, Label, Button } from '../../components/ui/Controls.jsx';
import Pagination from '../../components/Pagination.jsx';
import {
  getDailyDashboard,
  getMe,
  listStudents,
  updateStudentStatusForDate
} from '../../mocks/teacherApi';

const PER_PAGE = 10;

/* ---------- localStorage overrides ---------- */
const LS_KEY = 'att_overrides_v1';
function safeParse(json, fallback) { try { return JSON.parse(json); } catch { return fallback; } }
function lsLoad(dateYMD){ const all = safeParse(localStorage.getItem(LS_KEY) || '{}', {}); return all?.[dateYMD] || {}; }
function lsSave(dateYMD, studentId, payload){
  const all = safeParse(localStorage.getItem(LS_KEY) || '{}', {});
  if (!all[dateYMD]) all[dateYMD] = {};
  all[dateYMD][studentId] = payload;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}
function lsRemove(dateYMD, studentId){
  const all = safeParse(localStorage.getItem(LS_KEY) || '{}', {});
  if (all?.[dateYMD]) {
    delete all[dateYMD][studentId];
    if (Object.keys(all[dateYMD]).length === 0) delete all[dateYMD];
  }
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}
function getOperatorName(me){ return (me?.full_name || me?.name || '').trim(); }

export default function DashboardPage(){
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [clock, setClock] = useState(() => new Date());

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [holiday, setHoliday] = useState({ isHoliday:false, name:'' });

  // ห้องเรียน
  const [classroom, setClassroom] = useState('');
  const [classOptions, setClassOptions] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [students, setStudents] = useState([]);

  // ผู้ใช้/โมดัล
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewer, setViewer] = useState(null);

  // กรอง/แบ่งหน้า
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // เมนูเลือกนักเรียน
  const [stuChoice, setStuChoice] = useState('ALL');
  const [stuChipQuery, setStuChipQuery] = useState('');

  /* นาฬิกา */
  useEffect(()=>{
    const t = setInterval(()=>setClock(new Date()), 1000);
    return ()=>clearInterval(t);
  },[]);

  /* โหลดห้องครู + ชื่อผู้ใช้ */
  useEffect(()=>{
    (async ()=>{
      try{
        const meRes = await getMe();
        setMe(meRes||null);
        const { options, def } = buildClassOptions(meRes);
        setClassOptions(options);
        setClassroom(prev=>prev || def);
      }catch{ setClassOptions([]); }
    })();
  },[]);

  /* โหลดสรุป */
  useEffect(()=>{
    (async ()=>{
      setLoading(true);
      try{
        const res = await getDailyDashboard(date, classroom);
        setHoliday(res.holiday || { isHoliday:false, name:'' });
        setRows(res.rows || []);
        setPage(1);
      } finally { setLoading(false); }
    })();
  },[date, classroom]);

  /* โหลดรายชื่อทั้งหมด + ของห้อง */
  useEffect(()=>{
    (async ()=>{
      try{
        const all = await listStudents();
        setStudents(all);
        setClassStudents(filterByClass(all, classroom));
      }catch{
        setStudents([]); setClassStudents([]);
      }
    })();
  }, [classroom]);

  /* เปลี่ยนวันที่/ห้อง → รีเซ็ตการกรอง */
  useEffect(()=>{ setActiveFilter('ALL'); setStuChoice('ALL'); }, [date, classroom]);

  /* lookup */
  const studentMap = useMemo(()=>new Map(students.map(s=>[s.id, s])),[students]);

  /* รวมแถวสถานะ + overlay localStorage */
  const combinedRows = useMemo(()=>{
    if (holiday?.isHoliday) return rows;

    const latestByStu = new Map();
    rows.forEach(r => latestByStu.set(r.student_id, r));
    const base = [...latestByStu.values()];

    const overrides = lsLoad(date);
    const idsInClass = new Set(classStudents.map(s=>s.id));
    Object.entries(overrides).forEach(([sid, ov])=>{
      const idNum = Number(sid);
      if (idsInClass.size && !idsInClass.has(idNum)) return;
      const s = studentMap.get(idNum);
      const idx = base.findIndex(r=>r.student_id===idNum);
      const orow = {
        id: `ovr-${date}-${sid}`,
        student_id: idNum,
        student_name: s?.full_name || '',
        status: ov.status,
        time: ov.time ?? '—',
        note: ov.note || '',
        retro: !!ov.retro,
        operator: ov.operator || ov.byName || ''
      };
      if (idx>=0) base[idx] = { ...base[idx], ...orow };
      else base.push(orow);
    });

    if (!classStudents.length) return base;

    const hasRowIds = new Set(base.map(r => r.student_id).filter(Boolean));
    const notInRows = classStudents
      .filter(s => !hasRowIds.has(s.id))
      .map(s => ({
        id: `notin-${s.id}`,
        student_id: s.id,
        student_name: s.full_name || `${s.first_name||''} ${s.last_name||''}`.trim(),
        status: 'ยังไม่เข้าโรงเรียน',
        time: '—',
        note: ''
      }));

    return [...base, ...notInRows];
  }, [rows, classStudents, holiday, date, studentMap]);

  /* กล่องสรุป */
  const boxLatest = useMemo(()=>{
    const agg = { totalStudents: combinedRows.length, inOnTime:0, late:0, out:0, absent:0, notInYet:0, leaveBusiness:0, leaveSick:0 };
    combinedRows.forEach(r=>{
      if (r.status==='เข้า') agg.inOnTime++;
      else if (r.status==='มาสาย') agg.late++;
      else if (r.status==='ออก') agg.out++;
      else if (r.status==='ขาด') agg.absent++;
      else if (r.status==='ยังไม่เข้าโรงเรียน') agg.notInYet++;
      else if (r.status==='ลา' || r.status==='ลาป่วย' || r.status==='ลากิจ'){
        if (r.status==='ลาป่วย' || r.note==='ป่วย') agg.leaveSick++;
        else if (r.status==='ลากิจ' || r.note==='ธุระส่วนตัว') agg.leaveBusiness++;
      }
    });
    return agg;
  }, [combinedRows]);

  /* ตารางที่แสดง */
  const displayRows = useMemo(()=>{
    const collator = new Intl.Collator('th');
    const arr = combinedRows
      .filter(r=>{
        if (activeFilter==='ALL') return true;
        if (activeFilter==='ลากิจ') return r.status==='ลากิจ' || (r.status==='ลา' && r.note==='ธุระส่วนตัว');
        if (activeFilter==='ลาป่วย') return r.status==='ลาป่วย' || (r.status==='ลา' && r.note==='ป่วย');
        return r.status===activeFilter;
      })
      .filter(r => (stuChoice==='ALL' ? true : r.student_id === Number(stuChoice)))
      .map(r=>{
        const s = studentMap.get(r.student_id);
        return {
          ...r,
          student_code: s?.code || r.student_id,
          student_name: r.student_name || s?.full_name || ''
        };
      })
      .sort((a,b)=>collator.compare(a.student_name||'', b.student_name||''));
    return arr;
  }, [combinedRows, activeFilter, studentMap, stuChoice]);

  const visRows = useMemo(()=>{
    const start = (page-1)*PER_PAGE;
    return displayRows.slice(start, start+PER_PAGE);
  }, [displayRows, page]);

  function handleBoxClick(key){ setActiveFilter(prev => prev === key ? 'ALL' : key); setPage(1); }
  function openView(r){
    const s = studentMap.get(r.student_id);
    setViewer({
      id: r.student_id,
      code: s?.code || r.student_id,
      name: r.student_name || s?.full_name || '',
      grade: s?.grade, room: s?.room,
      row: r
    });
  }
  function openEdit(r){
    const init = toEditDefault(r.status, r.note);
    setEditing({ student_id: r.student_id, name: r.student_name, initialStatus: init });
  }

  async function onSaveStatus(newStatus, note=''){
    if (!editing) return;
    const isBackdate = date !== new Date().toISOString().slice(0,10);
    const operatorName = getOperatorName(me);

    await updateStudentStatusForDate(editing.student_id, date, newStatus, note, operatorName);
    const mapped = normalizeDailyRow(editing.student_id, editing.name, date, newStatus, note, isBackdate);
    const mappedWithOp = { ...mapped, operator: operatorName };

    setRows(prev => {
      const idx = prev.findIndex(x => x.student_id === editing.student_id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], ...mappedWithOp }; return copy; }
      return [...prev, { id:`man-${editing.student_id}-${date}`, ...mappedWithOp }];
    });

    if (newStatus === 'ยังไม่เข้าโรงเรียน') {
      lsRemove(date, editing.student_id);
    } else {
      lsSave(date, editing.student_id, {
        status: mapped.status, time: mapped.time, note: mapped.note, retro: !!mapped.retro, operator: operatorName
      });
    }

    setEditing(null);

    setLoading(true);
    try{
      const res = await getDailyDashboard(date, classroom);
      setHoliday(res.holiday || { isHoliday:false, name:'' });
      setRows(res.rows || []);
    } finally { setLoading(false); }
  }

  /* chips นักเรียน */
  const rosterChips = useMemo(()=>{
    const q = stuChipQuery.trim().toLowerCase();
    const ids = new Set(classStudents.map(s=>s.id));
    return students
      .filter(s=>ids.has(s.id))
      .filter(s=>{
        if (!q) return true;
        const full = (s.full_name || `${s.first_name||''} ${s.last_name||''}`).toLowerCase();
        return full.includes(q) || String(s.code||'').includes(q);
      })
      .map(s=>({ id:s.id, label:`${s.code || s.id} • ${s.full_name || `${s.first_name||''} ${s.last_name||''}`.trim()}` }))
      .sort((a,b)=> a.label.localeCompare(b.label, 'th'));
  }, [students, classStudents, stuChipQuery]);

  return (
    <Page title="ภาพรวม">
      <style>{`.sidebar .menu-item, .sidebar a { -webkit-text-stroke:0!important; text-shadow:none!important; }`}</style>

      {/* เลือกวันที่/ห้อง */}
      <Card>
        <div className="form-grid">
          <div className="field">
            <Label>วันที่</Label>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="field">
            <Label>ห้องเรียน</Label>
            <select className="input" value={classroom} onChange={e=>setClassroom(e.target.value)}>
              {classOptions.length===0
                ? <option value="">(ไม่มีข้อมูลห้อง)</option>
                : classOptions.map(op=><option key={op.value} value={op.value}>{op.label}</option>)
              }
            </select>
            <div className="hint">รองรับห้องหลัก/ห้องรอง หากมี</div>
          </div>
        </div>
      </Card>

      {/* แถบเมนูเลือกนักเรียน */}
      <Card>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <h3 style={{margin:0}}>รายชื่อนักเรียน</h3>
          <div style={{marginLeft:'auto', minWidth:280}}>
            <Input value={stuChipQuery} onChange={e=>setStuChipQuery(e.target.value)} placeholder="ค้นหาชื่อ/รหัสนักเรียน…" />
          </div>
        </div>

        <div style={{display:'flex', gap:8, overflowX:'auto', paddingTop:10, paddingBottom:6}}>
          <Chip label="ทั้งหมด" active={stuChoice==='ALL'} onClick={()=>{ setStuChoice('ALL'); setPage(1); }} />
          {rosterChips.map(s=>(
            <Chip key={s.id} label={s.label} active={Number(stuChoice)===Number(s.id)} onClick={()=>{
              setStuChoice(s.id); setPage(1);
            }} />
          ))}
        </div>
        <div className="hint">เลือก 1 คน หรือ “ทั้งหมด” เพื่อกรองตารางด้านล่าง</div>
      </Card>

      {/* วันหยุด */}
      {holiday?.isHoliday && (
        <Card>
          <div style={{fontWeight:700}}>วันนี้เป็นวันหยุด{holiday.name ? `: ${holiday.name}` : ''}</div>
          <div className="hint">ระบบจะไม่แจ้ง “ขาด/มาสาย/ยังไม่เข้าโรงเรียน” ในวันหยุด แต่ถ้ามีการเข้า–ออกจริงจะแสดงผลให้</div>
        </Card>
      )}

      {/* กล่องสรุป — ใช้ .rgrid-4 เพื่อ responsive */}
      <div className="rgrid-4" style={{marginTop:12}}>
        <Stat title="จำนวนนักเรียน" value={boxLatest.totalStudents} active={activeFilter==='ALL'} onClick={()=>handleBoxClick('ALL')} />
        <Stat title="เข้าตรงเวลา" value={boxLatest.inOnTime} color="#16a34a" active={activeFilter==='เข้า'} onClick={()=>handleBoxClick('เข้า')} />
        <Stat title="มาสาย" value={boxLatest.late} color="#f59e0b" active={activeFilter==='มาสาย'} onClick={()=>handleBoxClick('มาสาย')} />
        <Stat title="ออก (วันนี้)" value={boxLatest.out} color="#0ea5e9" active={activeFilter==='ออก'} onClick={()=>handleBoxClick('ออก')} />
      </div>
      <div className="rgrid-4" style={{marginTop:12}}>
        <Stat title="ยังไม่เข้าโรงเรียน" value={boxLatest.notInYet} color="#6b7280" active={activeFilter==='ยังไม่เข้าโรงเรียน'} onClick={()=>handleBoxClick('ยังไม่เข้าโรงเรียน')} />
        <Stat title="ขาด" value={boxLatest.absent} color="#ef4444" active={activeFilter==='ขาด'} onClick={()=>handleBoxClick('ขาด')} />
        <Stat title="ลากิจ" value={boxLatest.leaveBusiness} color="#a855f7" active={activeFilter==='ลากิจ'} onClick={()=>handleBoxClick('ลากิจ')} />
        <Stat title="ลาป่วย" value={boxLatest.leaveSick} color="#7c3aed" active={activeFilter==='ลาป่วย'} onClick={()=>handleBoxClick('ลาป่วย')} />
      </div>

      {/* ตาราง + นาฬิกา */}
      <Card>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <h3 style={{marginTop:0, marginBottom:0}}>
            สถานะของวันนี้{holiday?.isHoliday && ` (วันหยุด${holiday.name ? `: ${holiday.name}` : ''})`}
            {activeFilter !== 'ALL' && <span style={{marginLeft:8, fontWeight:500, color:'#6b7280'}}>— กำลังกรอง: {activeFilter}</span>}
            {stuChoice !== 'ALL' && <span style={{marginLeft:8, fontWeight:500, color:'#6b7280'}}>— เลือกนักเรียนเฉพาะ</span>}
          </h3>
          <div style={{marginLeft:'auto', padding:'6px 10px', borderRadius:10, background:'#0f172a0d', border:'1px solid #e5e7eb', fontWeight:800}}>
            {thaiDateTimeFull(clock)}
          </div>
        </div>

        {loading ? 'กำลังโหลด…' : (
          <>
            <div className="att-wrap" style={{marginTop:8}}>
              <table className="att-table" style={{borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    <Th>รหัส</Th>
                    <Th>ชื่อ–สกุล</Th>
                    <Th>วันที่</Th>
                    <Th>เวลา</Th>
                    <Th>สถานะ</Th>
                    <Th>หมายเหตุ</Th>
                    <Th>ผู้ดำเนินการ</Th>
                    <Th className="__actions">การทำงาน</Th>
                  </tr>
                </thead>
                <tbody>
                  {visRows.length===0 ? (
                    <tr><Td colSpan={8} style={{color:'#6b7280'}}>— ไม่มีข้อมูล —</Td></tr>
                  ) : visRows.map(r=>(
                    <tr key={r.id}>
                      <Td>{r.student_code}</Td>
                      <Td>{r.student_name}</Td>
                      <Td>{thaiDateShort(date)}</Td>
                      <Td>{r.time}</Td>
                      <Td>
                        <button type="button" onClick={()=>openEdit(r)} title="แก้ไขสถานะ" style={{background:'transparent',border:0,padding:0,cursor:'pointer'}}>
                          <StatusBadge status={r.status} note={r.note} />
                          {r.retro && <span style={{marginLeft:6, fontSize:12, color:'#6b7280'}}>ย้อนหลัง</span>}
                        </button>
                      </Td>
                      <Td>{r.status==='ขาด' ? 'ไม่มาเรียน' : (r.note || '—')}</Td>
                      <Td>{r.operator || '—'}</Td>
                      <Td className="__actions">
                        <div style={{display:'flex', gap:8}}>
                          <Button variant="secondary" onClick={()=>openView(r)} title="ดูข้อมูล">🔍</Button>
                          <Button onClick={()=>openEdit(r)} title="แก้ไข"><span className="btn-text">แก้ไข</span></Button>
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

      {/* โมดัลต่างๆ */}
      <EditModal
        open={!!editing}
        me={me}
        dateYMD={date}
        name={editing?.name || ''}
        initialStatus={editing?.initialStatus || 'เข้า'}
        onClose={()=>setEditing(null)}
        onSave={onSaveStatus}
      />
      <StudentInfoModal open={!!viewer} data={viewer} onClose={()=>setViewer(null)} />
    </Page>
  );
}

/* ---------- helpers ---------- */
function thaiDateShort(ymd){
  if (!ymd) return '—';
  const d = new Date(ymd + 'T00:00:00');
  const monthsShort = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()+543}`;
}
function thaiDateTimeFull(d){
  if (!d) return '—';
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const dow = days[d.getDay()];
  const dd = d.getDate();
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  return `วัน${dow} ที่ ${dd} ${mm} ${yyyy} • ${hh}:${min}:${ss}`;
}
function toEditDefault(status, note){
  if (status==='ลาป่วย') return 'ลาป่วย';
  if (status==='ลากิจ') return 'ลากิจ';
  if (status==='ลา' && note==='ป่วย') return 'ลาป่วย';
  if (status==='ลา' && note==='ธุระส่วนตัว') return 'ลากิจ';
  return status;
}
function buildClassOptions(me){
  const list = Array.isArray(me?.classrooms) ? me.classrooms : [];
  if (list.length){
    const sorted = [...list].sort((a,b)=>{
      const ra = String(a.role||'').toLowerCase();
      const rb = String(b.role||'').toLowerCase();
      if (ra===rb) return 0;
      return ra==='main' ? -1 : 1;
    });
    const options = sorted.map(c=>({ value:c.code, label:`${c.code}${(c.role||'')==='main'?' (ประจำหลัก)':' (ประจำรอง)'}` }));
    return { options, def: sorted[0]?.code || '' };
  }
  const code = me?.homeroom?.code || (me?.homeroom ? `${me.homeroom.grade}/${me.homeroom.room}` : '');
  if (code) return { options:[{value:code, label:code}], def:code };
  return { options:[], def:'' };
}
function parseClass(code=''){ const m = String(code).match(/(\d+)\s*\/\s*(\d+)/); if (!m) return null; return { grade:Number(m[1]), room:Number(m[2]) }; }
function filterByClass(students=[], code=''){ const pr = parseClass(code); if (!pr) return students; return students.filter(s => Number(s.grade)===pr.grade && Number(s.room)===pr.room); }
function nowHHMM(){ const now = new Date(); const hh = String(now.getHours()).padStart(2,'0'); const mm = String(now.getMinutes()).padStart(2,'0'); return `${hh}:${mm}`; }

/** map ค่าจากโมดัล → แถวรายวันในตาราง (รองรับ “ย้อนหลัง”) */
function normalizeDailyRow(studentId, studentName, dateYMD, status, note = '', retro = false) {
  // กรณีลา: รวมเป็น 'ลา' แล้วระบุชนิดใน note
  if (status === 'ลากิจ' || status === 'ลาป่วย') {
    return {
      id: `${dateYMD}-${studentId}-LEAVE-MAN`,
      student_id: studentId,
      student_name: studentName,
      status: 'ลา',
      time: '—',
      note: status === 'ลากิจ' ? 'ธุระส่วนตัว' : 'ป่วย',
      retro
    };
  }

  // ยังไม่เข้าโรงเรียน
  if (status === 'ยังไม่เข้าโรงเรียน') {
    return {
      id: `${dateYMD}-${studentId}-NOTIN`,
      student_id: studentId,
      student_name: studentName,
      status: 'ยังไม่เข้าโรงเรียน',
      time: '—',
      note: '',
      retro
    };
  }

  // สถานะทั่วไป
  const map = { 'เข้า':'เข้า', 'ออก':'ออก', 'มาสาย':'มาสาย', 'ขาด':'ขาด' };
  return {
    id: `${dateYMD}-${studentId}-MAN-${map[status] || status}`,
    student_id: studentId,
    student_name: studentName,
    status: map[status] || status,
    time: status === 'ขาด' ? '—' : nowHHMM(),
    note,
    retro
  };
}

/* ---------- UI minis ---------- */
function hex2rgba(hex, a=0.12){
  const h = hex.replace('#','');
  const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function Stat({title, value, color='#0f172a', active=false, onClick}){
  const bg = active ? hex2rgba(color, 0.12) : 'transparent';
  const border = active ? `2px solid ${color}` : '1px solid #e5e7eb';
  const scale = active ? 'scale(1.04)' : 'scale(1)';
  const shadow = active ? '0 6px 18px rgba(0,0,0,.08)' : 'none';
  const BOX_HEIGHT = 110;

  return (
    <Card>
      <button
        type="button"
        onClick={onClick}
        style={{
          position:'relative', width:'100%', height: BOX_HEIGHT, textAlign:'left',
          background:bg, border:border, padding:12, borderRadius:14, cursor:'pointer',
          transform: scale, boxShadow: shadow,
          transition:'transform .15s ease, box-shadow .15s ease, background .15s ease, border .15s ease',
          willChange:'transform'
        }}
        aria-pressed={active}
      >
        <div style={{fontSize:13, color:'#6b7280'}}>{title}</div>
        <div style={{ fontSize:30, fontWeight:800, color }}>{value}</div>
        {active && (
          <div style={{position:'absolute', left:12, right:12, bottom:8, fontSize:12, color:'#6b7280'}}>กำลังแสดงข้อมูลสถานะนี้</div>
        )}
      </button>
    </Card>
  );
}
function Th({children, className, ...p}){
  return (
    <th
      {...p}
      className={className}
      style={{textAlign:'left', padding:'8px 6px', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap'}}
    >
      {children}
    </th>
  );
}
function Td({children, className, ...p}){
  return (
    <td
      {...p}
      className={className}
      style={{padding:'8px 6px', borderBottom:'1px solid #f3f4f6'}}
    >
      {children}
    </td>
  );
}
function StatusBadge({ status, note }){
  const map = {
    'เข้า': { bg:'#dcfce7', fg:'#166534' },
    'ออก': { bg:'#e0f2fe', fg:'#075985' },
    'มาสาย': { bg:'#fef9c3', fg:'#854d0e' },
    'ยังไม่เข้าโรงเรียน': { bg:'#f3f4f6', fg:'#374151' },
    'ขาด': { bg:'#fee2e2', fg:'#991b1b' },
    'ลา': { bg:'#ede9fe', fg:'#6b21a8' },
    'ลากิจ': { bg:'#ede9fe', fg:'#6b21a8' },
    'ลาป่วย': { bg:'#ede9fe', fg:'#6b21a8' },
    'วันหยุด': { bg:'#e5e7eb', fg:'#374151' },
  };
  const style = map[status] || { bg:'#e5e7eb', fg:'#374151' };
  const text = status==='ลา'
    ? (note==='ป่วย' ? 'ลาป่วย' : note==='ธุระส่วนตัว' ? 'ลากิจ' : 'ลา')
    : status;
  return <span style={{background:style.bg, color:style.fg, padding:'2px 8px', borderRadius:999, fontSize:13}}>{text}</span>;
}
function Chip({ label, active=false, onClick }){
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        whiteSpace:'nowrap',
        border:'1px solid', borderColor: active ? '#0ea5e9' : '#e5e7eb',
        background: active ? 'rgba(14,165,233,.10)' : '#fff',
        color: active ? '#075985' : '#111827',
        borderRadius:999, padding:'6px 10px', fontSize:14, cursor:'pointer'
      }}
    >
      {label}
    </button>
  );
}

/* ---------- Modals ---------- */
function EditModal({ open, name, me, dateYMD, initialStatus='เข้า', onClose, onSave }){
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState('');
  const isBackdate = dateYMD !== new Date().toISOString().slice(0,10);
  useEffect(()=>{ if(open){ setStatus(initialStatus||'เข้า'); setNote(''); } },[open, initialStatus]);

  const handleSave = ()=>{
    if (isBackdate && !note.trim()){
      alert('การแก้ไขย้อนหลังต้องระบุหมายเหตุ');
      return;
    }
    onSave(status, note);
  };

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={`แก้ไขสถานะ — ${name || ''}`}
      actions={<><Button variant="secondary" onClick={onClose}>ยกเลิก</Button><Button onClick={handleSave}>บันทึก</Button></>}
    >
      <div style={{display:'grid', gap:10}}>
        <div style={{fontSize:13, color:'#6b7280'}}>ผู้ดำเนินการ: <b>{me?.full_name || me?.name || '-'}</b></div>

        <div>
          <Label>สถานะ</Label>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:6}}>
            {['เข้า','ออก','มาสาย','ยังไม่เข้าโรงเรียน','ขาด','ลากิจ','ลาป่วย'].map(s=>(
              <label key={s} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="radio" name="st" checked={status===s} onChange={()=>setStatus(s)} />{s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>หมายเหตุ {isBackdate && <span style={{color:'#ef4444'}}>(จำเป็นสำหรับย้อนหลัง)</span>}</Label>
          <Input value={note} onChange={e=>setNote(e.target.value)} placeholder={isBackdate ? 'ระบุเหตุผลการแก้ไขย้อนหลัง' : 'เช่น ทัศนศึกษา / อนุมัติโดยผู้ปกครอง ฯลฯ'} />
        </div>

        {isBackdate && <div className="hint">บันทึกนี้จะติดป้าย “ย้อนหลัง” ในตาราง</div>}
      </div>
    </CommonModal>
  );
}

function StudentInfoModal({ open, data, onClose }){
  return (
    <CommonModal
      open={open}
      onClose={onClose}
      title={data ? `ข้อมูลนักเรียน — ${data.name}` : 'ข้อมูลนักเรียน'}
      actions={<Button variant="secondary" onClick={onClose}>ปิด</Button>}
    >
      {data ? (
        <div style={{display:'grid', gap:8}}>
          <div><b>รหัส:</b> {data.code}</div>
          <div><b>ชั้น/ห้อง:</b> {data.grade ?? '-'} / {data.room ?? '-'}</div>
          <div><b>สถานะวันนี้:</b> <StatusBadge status={data.row?.status} note={data.row?.note} /> {data.row?.retro && <span style={{marginLeft:6, fontSize:12, color:'#6b7280'}}>ย้อนหลัง</span>}</div>
          <div><b>เวลา:</b> {data.row?.time || '—'}</div>
          <div><b>หมายเหตุ:</b> {data.row?.note || '—'}</div>
          <div><b>ผู้ดำเนินการ:</b> {data.row?.operator || '—'}</div>
        </div>
      ) : null}
    </CommonModal>
  );
}