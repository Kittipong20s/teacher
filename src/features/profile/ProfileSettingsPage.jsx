import React, { useState } from 'react';
import Page from '../../components/ui/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import { Button, Input, Label } from '../../components/ui/Controls.jsx';
import { toast } from '../../hooks/useToast.js';
import useMe from '../../hooks/useMe';
import { changePassword } from './profileApi.js';

export default function ProfileSettingsPage(){
  const { me, loading } = useMe();

  // ฟอร์มเปลี่ยนรหัสผ่านเท่านั้น
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const teacher = me?.teacher || {};
  const homeroom = me?.homeroom || {};
  const code = teacher.teacher_code || '-';
  const prefix = teacher.prefix || '';
  const first = teacher.first_name || '';
  const last  = teacher.last_name || '';
  const email = teacher.email || me?.email || '-';
  const phone = teacher.phone || '-';
  const room  = homeroom.code || (homeroom.grade && homeroom.room ? `${homeroom.grade}/${homeroom.room}` : '-');
  const statusText = teacher.is_active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน';

  const onChangePassword = async (e)=>{
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw){
      toast({ title:'กรอกข้อมูลไม่ครบ', message:'กรุณากรอกรหัสผ่านทุกช่อง', variant:'error' });
      return;
    }
    if (newPw.length < 4){
      toast({ title:'รหัสผ่านสั้นเกินไป', message:'กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร', variant:'error' });
      return;
    }
    if (newPw !== confirmPw){
      toast({ title:'ยืนยันรหัสผ่านไม่ตรงกัน', message:'กรุณาตรวจสอบรหัสผ่านใหม่อีกครั้ง', variant:'error' });
      return;
    }

    setSaving(true);
    try{
      await changePassword(currentPw, newPw);
      toast({ title:'เปลี่ยนรหัสผ่านสำเร็จ', message:'รหัสผ่านใหม่ถูกบันทึกแล้ว', variant:'success' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    }catch(err){
      const msg = err?.payload?.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้';
      toast({ title:'เกิดข้อผิดพลาด', message: String(msg), variant:'error' });
    }finally{
      setSaving(false);
    }
  };

  return (
    <Page title="โปรไฟล์ & รหัสผ่าน">
      {/* โปรไฟล์ (อ่านอย่างเดียว) */}
      <Card>
        <h3 style={{marginTop:0, marginBottom:12}}>โปรไฟล์คุณครู (อ่านอย่างเดียว)</h3>

        {loading ? 'กำลังโหลด…' : (
          <div>
            <style>{`.kv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
              @media (max-width:768px){.kv-grid{grid-template-columns:1fr}}
              .kv{display:grid;gap:6px;border:1px solid #e5e7eb;border-radius:12px;padding:10px}
              .kv .k{font-size:12px;color:#6b7280}
              .kv .v{font-weight:600}
            `}</style>

            <div className="kv-grid">
              <KV k="คำนำหน้า" v={prefix || '-'} />
              <KV k="ชื่อ" v={first || '-'} />
              <KV k="สกุล" v={last || '-'} />
              <KV k="อีเมล" v={email} />
              <KV k="เบอร์โทร" v={phone} />
              <KV k="ห้องประจำ" v={room} />
              <KV k="รหัสครู" v={code} />
              <KV k="สถานะบัญชี" v={statusText} />
            </div>

            <div className="hint" style={{marginTop:10}}>
              หากต้องการแก้ไขข้อมูลส่วนตัว โปรดติดต่อผู้ดูแลระบบของโรงเรียน
            </div>
          </div>
        )}
      </Card>

      {/* เปลี่ยนรหัสผ่าน (แก้ไขได้) */}
      <Card>
        <h3 style={{marginTop:0}}>เปลี่ยนรหัสผ่าน</h3>

        <form onSubmit={onChangePassword} className="form-grid">
          <div className="field">
            <Label>รหัสผ่านเดิม</Label>
            <Input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e=>setCurrentPw(e.target.value)} />
          </div>
          <div className="field">
            <Label>รหัสผ่านใหม่</Label>
            <Input type={showPw ? 'text' : 'password'} value={newPw} onChange={e=>setNewPw(e.target.value)} />
          </div>
          <div className="field">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <Input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} />
          </div>
          <div className="field" style={{alignSelf:'end'}}>
            <Button type="button" variant="secondary" onClick={()=>setShowPw(s=>!s)} style={{marginRight:8}}>
              {showPw ? 'ซ่อนรหัส' : 'แสดงรหัส'}
            </Button>
            <Button type="submit" disabled={saving}>{saving ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}</Button>
          </div>
        </form>
      </Card>

      {/* ข้อมูลบัญชีสรุป (อ่านอย่างเดียว) */}
      <Card>
        <div style={{whiteSpace:'pre-line', lineHeight:1.7}}>
          <b>รหัสครู:</b> {code || '-'}
          {'\n'}<b>ชื่อ–สกุล:</b> {prefix}{first} {last || ''}
          {'\n'}<b>ห้องประจำ:</b> {room}
          {'\n'}<b>สถานะบัญชี:</b> {statusText}
        </div>
      </Card>
    </Page>
  );
}

function KV({ k, v }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">{v || '-'}</div>
    </div>
  );
}