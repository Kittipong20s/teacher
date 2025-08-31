import React from 'react';
import { NavLink } from 'react-router-dom';
import useMe from '../../hooks/useMe';
import { ROUTES } from '../routes';

/**
 * โครง: เดสก์ท็อปใช้ rail/expanded (กดปุ่มพับในหัวข้อ)
 * มือถือใช้ setMobileOpen(true/false) เป็น Drawer
 */
export default function Sidebar({
  onLogout,
  rail = false,
  setRail = () => {},
  setMobileOpen = () => {},   // ← ใช้เฉพาะปุ่มปิดบนมือถือ
}) {
  const { me, loading } = useMe();

  const teacher = me?.teacher;
  const homeroom = me?.homeroom;
  const fullName = teacher ? `${teacher.prefix || ''}${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : '';
  const code = teacher?.teacher_code || '';
  const room = homeroom?.code || '';
  const initials = teacher ? (teacher.first_name?.[0] || '') + (teacher.last_name?.[0] || '') : 'T';

  const items = [
    { to: ROUTES.DASHBOARD, label: 'แดชบอร์ด', icon: <IconHome /> },
    { to: ROUTES.SUMMARY, label: 'สรุปรายงาน', icon: <IconChart /> },
    { to: ROUTES.LEAVE_REQUESTS, label: 'คำร้องลา', icon: <IconCalendar /> },
    { to: ROUTES.ANNOUNCEMENTS, label: 'ประกาศ', icon: <IconMegaphone /> },
    { to: ROUTES.PROFILE, label: 'โปรไฟล์ & รหัสผ่าน', icon: <IconUser /> },
  ];

  return (
    <>
      <aside className="sidebar" aria-hidden={false} aria-label="แถบเมนู">
        {/* ปุ่มปิดบนมือถือ */}
        <button
          className="side-toggle-mobile"
          onClick={() => setMobileOpen(false)}
          aria-label="ซ่อนเมนู"
          title="ซ่อนเมนู"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div className="brand">{rail ? 'TP' : 'Teacher Portal'}</div>
          {/* ปุ่มพับ/กาง (เดสก์ท็อป) */}
          <button
            type="button"
            className="side-toggle-desktop"
            onClick={() => setRail(!rail)}
            aria-pressed={rail}
            aria-label={rail ? 'แสดงเมนู' : 'ย่อเป็นรางไอคอน'}
            title={rail ? 'แสดงเมนู' : 'ย่อเป็นรางไอคอน'}
          >
            <IconChevron direction={rail ? 'right' : 'left'} />
          </button>
        </div>

        {/* โปรไฟล์ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#0f172a',
            borderRadius: 14,
            padding: '10px 12px',
            margin: '12px 0',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#93c5fd,#a7f3d0)',
              color: '#0b1221',
              fontWeight: 800,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {loading ? '…' : initials}
          </div>
          <div className="side-label" style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loading ? 'กำลังโหลด…' : fullName || '—'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {code || '—'}
              {room ? ` • ${room}` : ''}
            </div>
          </div>
        </div>

        {/* เมนู */}
        <nav>
          {items.map((x) => (
            <NavLink
              key={x.to}
              to={x.to}
              className={({ isActive }) => 'side-item' + (isActive ? ' active' : '')}
              title={x.label}
            >
              <span className="side-icon">{x.icon}</span>
              <span className="side-label">{x.label}</span>
            </NavLink>
          ))}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="side-item"
              title="ออกจากระบบ"
              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 0 }}
            >
              <span className="side-icon">
                <IconLogout />
              </span>
              <span className="side-label">ออกจากระบบ</span>
            </button>
          )}
        </nav>
      </aside>

      {/* ❌ ลบปุ่มลอย edge-toggle-desktop ทิ้ง เพื่อไม่ให้มีปุ่ม “>” เกินมา */}
    </>
  );
}

/* ========== Icons (SVG เล็ก ๆ) ========== */
function IconChevron({ direction = 'left', size = 18 }) {
  const rotate = { left: '0deg', right: '180deg', up: '-90deg', down: '90deg' }[direction] || '0deg';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rotate})` }}>
      <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M4 20h16M7 16v-5m5 5V8m5 8v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMegaphone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M3 11v2l10 4V7L3 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 9a6 6 0 0 0 8-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c1.5-3.5 5-5 8-5s6.5 1.5 8 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path d="M15 17l5-5-5-5M20 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}