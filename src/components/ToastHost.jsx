import React from 'react';
import useToastHost from '../hooks/useToast.js';

export default function ToastHost(){
  const items = useToastHost();
  return (
    <div style={{ position:'fixed', right:16, top:16, zIndex:50, display:'grid', gap:8 }}>
      {items.map(it=>(
        <div key={it.id} style={{
          background:'#fff', border:'1px solid #e5e7eb', borderLeft:`4px solid ${it.variant==='error'?'#ef4444':'#22c55e'}`,
          padding:'10px 12px', borderRadius:10, minWidth:260, boxShadow:'0 8px 24px rgba(0,0,0,.08)'
        }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>{it.title}</div>
          <div style={{ fontSize:14, color:'#374151' }}>{it.message}</div>
        </div>
      ))}
    </div>
  );
}