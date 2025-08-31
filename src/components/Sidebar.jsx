// src/app/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import useMe from '../../hooks/useMe';
import { ROUTES } from '../routes';

export default function Sidebar({ onLogout }){
  const { me, loading } = useMe();

  const teacher = me?.teacher;
  const homeroom = me?.homeroom;
  const fullName = teacher ? `${teacher.prefix || ''}${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : '';
  const code = teacher?.teacher_code || '';
  const room = homeroom?.code || '';

  // อักษรย่อสำหรับ avatar
  const initials = teacher
    ? (teacher.first_name?.[0] || '') + (teacher.last_name?.[0] || '')
    : '';

  return (
    <aside style={{width:280, background:'#0b1221', color:'#fff', padding:22, boxSizing:'border-box'}}>
      {/* หัวข้อแอป */}
      <div style={{fontSize:28, fontWeight:900, marginBottom:16}}>Teacher Portal</div>

      {/* โปรไฟล์ครู */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        background:'#0f172a', borderRadius:14, padding:'10px 12px',
        marginBottom:16, border:'1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          width:36, height:36, borderRadius:'50%',
          background:'linear-gradient(135deg,#93c5fd,#a7f3d0)',
          color:'#0b1221', fontWeight:800, display:'grid', placeItems:'center'
        }}>
          {loading ? '…' : (initials || 'T')}
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
            {loading ? 'กำลังโหลด…' : (fullName || '—')}
          </div>
          <div style={{fontSize:12, opacity:.8}}>
            {code || '—'}{room ? ` • ${room}` : ''}
          </div>
        </div>
      </div>

      {/* เมนู */}
      <nav style={{display:'grid', gap:10}}>
        <SideLink to={ROUTES.DASHBOARD} label="แดชบอร์ด" />
        <SideLink to={ROUTES.MY_CLASS} label="ห้องของฉัน" />

        {/* ✅ เมนูใหม่ */}
        <SideLink to={ROUTES.SUMMARY} label="สรุปรายงาน" />

        {/* เมนูเดิม (ยังคงอยู่) */}
        <SideLink to={ROUTES.ATT_HISTORY} label="ประวัติเข้า–ออก" />
        <SideLink to={ROUTES.ATT_REPORT} label="สรุปรายงานเข้า–ออก" />
        <SideLink to={ROUTES.LEAVE_REQUESTS} label="คำร้องลา" />
        <SideLink to={ROUTES.LEAVE_REPORT} label="รายงานการลา" />
        <SideLink to={ROUTES.ANNOUNCEMENTS} label="ประกาศ" />
        <SideLink to={ROUTES.PROFILE} label="โปรไฟล์ & รหัสผ่าน" />

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{marginTop:8, padding:'10px 14px', borderRadius:12, background:'#1f2937', color:'#fff', border:0, textAlign:'left'}}
          >
            ออกจากระบบ
          </button>
        )}
      </nav>
    </aside>
  );
}

function SideLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'side-link' + (isActive ? ' active' : '')
      }
      style={({ isActive })=>({
        display:'block',
        padding:'12px 14px',
        borderRadius:12,
        color:'#e5e7eb',
        textDecoration:'none',
        background: isActive ? '#1f2a44' : 'transparent'
      })}
    >
      {label}
    </NavLink>
  );
}