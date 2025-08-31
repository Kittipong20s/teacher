import React, { useState } from 'react';
import { Label, Input, Button } from '../../components/ui/Controls.jsx';
import { toast } from '../../hooks/useToast.js';

export default function ChangePasswordForm({ onSubmit }){
  const [cur,setCur]=useState(''); const [nw,setNew]=useState(''); const [cf,setCf]=useState('');

  const save=async()=>{
    if (!nw || nw.length<8) { toast({ title:'รหัสผ่านสั้นเกินไป', message:'อย่างน้อย 8 ตัว', variant:'error' }); return; }
    if (nw!==cf) { toast({ title:'รหัสผ่านไม่ตรงกัน', message:'กรุณาตรวจสอบ', variant:'error' }); return; }
    await onSubmit?.({ current:cur, next:nw });
    setCur(''); setNew(''); setCf('');
  };

  return (
    <div className="form-grid">
      <div className="field"><Label>รหัสผ่านปัจจุบัน</Label><Input type="password" value={cur} onChange={e=>setCur(e.target.value)} /></div>
      <div className="field"><Label>รหัสผ่านใหม่</Label><Input type="password" value={nw} onChange={e=>setNew(e.target.value)} /></div>
      <div className="field"><Label>ยืนยันรหัสผ่านใหม่</Label><Input type="password" value={cf} onChange={e=>setCf(e.target.value)} /></div>
      <div className="actions" style={{ gridColumn:'1/-1' }}>
        <Button onClick={save}>เปลี่ยนรหัสผ่าน</Button>
      </div>
    </div>
  );
}