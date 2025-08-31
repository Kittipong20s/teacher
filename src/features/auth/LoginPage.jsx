import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes';
// ⬇️ แก้ import ให้ใช้ storage เดิมของโปรเจกต์ (ไม่ใช่ authApi)
import { setToken, setUser } from './authApi.js';
import Card from '../../components/ui/Card.jsx';
import { Button, Input, Label, Select } from '../../components/ui/Controls.jsx';
import { toast } from '../../hooks/useToast.js';

/** บัญชีเดโม่ที่อนุญาตให้ล็อกอินได้ขณะรอ API จริง */
const DEMO_ACCOUNTS = {
  teacher01: { password: '1234', role: 'teacher', name: 'ครูตัวอย่าง 01' },
  admin01:   { password: '1234', role: 'admin',   name: 'ผู้ดูแลระบบ 01' },
};

export default function LoginPage({ onLoggedIn }){
  const [role, setRole] = useState('teacher');     // 'teacher' | 'admin' | 'parent'
  const [identity, setIdentity] = useState('teacher01');
  const [password, setPassword] = useState('1234');
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const onChangeRole = (e) => {
    const r = e.target.value;
    setRole(r);
    // สลับ username default ตามประเภท
    if (r === 'teacher') setIdentity('teacher01');
    if (r === 'admin')   setIdentity('admin01');
    setPassword('1234');
  };

  const submit = async (e)=> {
    e.preventDefault();

    if (role === 'parent') {
      toast({ title:'พอร์ทัลนี้สำหรับครู/แอดมิน', message:'ผู้ปกครองโปรดใช้ระบบอีกตัว', variant:'error' });
      return;
    }

    const acct = DEMO_ACCOUNTS[identity];

    if (!acct || acct.password !== password || acct.role !== role) {
      toast({ title:'เข้าสู่ระบบไม่สำเร็จ', message:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', variant:'error' });
      return;
    }

    // จัดเก็บโทเคน/ผู้ใช้แบบเดโม่
    setToken(`demo.${identity}`);
    setUser({ id: Date.now(), role: acct.role, username: identity, name: acct.name });

    onLoggedIn?.();
    navigate(ROUTES.DASHBOARD, { replace:true });
  };

  return (
    <div className="container" style={{ display:'grid', placeItems:'center', minHeight:'100vh' }}>
      <Card style={{ width:'min(520px, 92vw)' }}>
        <h2 style={{ marginTop:0 }}>เข้าสู่ระบบ (เว็บคุณครู)</h2>

        <form onSubmit={submit} className="form-grid">
          <div className="field">
            <Label>ประเภทผู้ใช้</Label>
            <Select value={role} onChange={onChangeRole}>
              <option value="teacher">คุณครู/บุคลากร</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="parent">ผู้ปกครอง (ไม่ใช้ในพอร์ทัลนี้)</option>
            </Select>
            <div className="hint">
              บัญชีทดสอบ: <b>teacher01 / 1234</b> (ครู), <b>admin01 / 1234</b> (แอดมิน)
            </div>
          </div>

          <div className="field">
            <Label>ชื่อผู้ใช้ (Username)</Label>
            <Input value={identity} onChange={e=>setIdentity(e.target.value)} placeholder="teacher01" />
          </div>

          <div className="field">
            <Label>รหัสผ่าน</Label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
              <Input type={showPw ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••" />
              <Button type="button" variant="secondary" onClick={()=>setShowPw(s=>!s)}>{showPw ? 'ซ่อน' : 'แสดง'}</Button>
            </div>
          </div>

          <div className="actions" style={{ gridColumn:'1/-1' }}>
            <Button type="submit">เข้าสู่ระบบ</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}