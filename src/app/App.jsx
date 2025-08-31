import '../styles/styles.css';
import '../styles/table.css';
import '../styles/responsive.css';

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ROUTES } from './routes';
import Sidebar from './layout/Sidebar.jsx';
import ToastHost from '../components/ToastHost.jsx';

import LoginPage from '../features/auth/LoginPage.jsx';
import { getToken, clearAuthAll } from '../features/auth/authApi.js';

import TeacherDashboardPage from '../features/dashboard/DashboardPage.jsx';
import SummaryReportPage from '../features/summary/SummaryReportPage.jsx';
import LeaveRequestsPage from '../features/leave-requests/LeaveRequestsPage.jsx';
import AnnouncementsPage from '../features/announcements/AnnouncementsPage.jsx';
import ProfileSettingsPage from '../features/profile/ProfileSettingsPage.jsx';

export default function App(){
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  // มือถือ: เปิด/ปิด drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  // เดสก์ท็อป: โหมด “รางไอคอน”
  const [rail, setRail] = useState(false);

  if (!authed) {
    return (
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage onLoggedIn={()=>setAuthed(true)} />} />
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    );
  }

  const onLogout = () => { clearAuthAll(); setAuthed(false); };

  return (
    /* ใส่ class ตามสถานะเพื่อให้ CSS ดัน main และคุม Drawer */
    <div className={`layout ${rail ? 'is-rail' : ''} ${mobileOpen ? 'is-open' : ''}`} style={{ minHeight:'100vh', display:'flex' }}>
      {/* Sidebar ทำงานได้ทั้ง desktop & mobile */}
      <Sidebar
        rail={rail}
        setRail={setRail}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={onLogout}
      />

      {/* Backdrop มือถือ */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={()=>setMobileOpen(false)} />}

      {/* ปุ่มเปิดเมนู (มือถือเท่านั้น) */}
      {!mobileOpen && (
        <button className="edge-toggle" onClick={()=>setMobileOpen(true)} aria-label="แสดงเมนู" title="แสดงเมนู">
          ☰
        </button>
      )}

      <main style={{ flex:1, padding:16 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <ToastHost />
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.LOGIN} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

            <Route path={ROUTES.DASHBOARD} element={<TeacherDashboardPage />} />
            <Route path="/my-class" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.SUMMARY} element={<SummaryReportPage />} />
            <Route path={ROUTES.LEAVE_REQUESTS} element={<LeaveRequestsPage />} />
            <Route path={ROUTES.ANNOUNCEMENTS} element={<AnnouncementsPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfileSettingsPage />} />
            <Route path="*" element={<div>ไม่พบหน้า 404</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}