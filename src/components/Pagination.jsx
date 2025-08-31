// src/components/ui/Pagination.jsx
import React from 'react';

export default function Pagination({ page, perPage, total, onPage }){
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
      <button className="btn secondary" disabled={!canPrev} onClick={()=>onPage(page-1)}>ก่อนหน้า</button>
      <div style={{ fontSize:13, color:'#6b7280' }}>
        หน้า {page} / {pages} · แสดง {perPage} รายการ/หน้า (ทั้งหมด {total})
      </div>
      <button className="btn secondary" disabled={!canNext} onClick={()=>onPage(page+1)}>ถัดไป</button>
    </div>
  );
}