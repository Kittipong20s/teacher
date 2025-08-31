import React from 'react';

export default function CommonModal({ open, title, children, actions, onClose }){
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true"
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
        display:'grid', placeItems:'center', zIndex:60
      }}
      onClick={(e)=>{ if (e.target===e.currentTarget) onClose?.(); }}
    >
      <div style={{ width:'min(680px, 92vw)', background:'#fff', borderRadius:14, padding:16, border:'1px solid #e5e7eb' }}>
        {title && <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>{title}</div>}
        <div style={{ maxHeight:'60vh', overflow:'auto' }}>{children}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
          {actions}
        </div>
      </div>
    </div>
  );
}