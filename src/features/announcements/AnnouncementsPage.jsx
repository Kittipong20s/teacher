import React, { useEffect, useState } from 'react';
import Page from '../../components/ui/Page.jsx';
import Card from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Controls.jsx';
import { getAnnouncements } from '../../mocks/teacherApi';

export default function AnnouncementsPage(){
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{ setRows(await getAnnouncements()); } finally{ setLoading(false); }
    })();
  },[]);

  const filtered = rows.filter(a => (a.title + ' ' + a.body).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Page title="ประกาศ">
      <Card>
        <Input placeholder="ค้นหา" value={q} onChange={e=>setQ(e.target.value)} />
      </Card>
      <div style={{display:'grid', gap:12}}>
        {loading ? <Card>กำลังโหลด…</Card> :
         filtered.length===0 ? <Card style={{color:'#6b7280'}}>— ไม่มีประกาศ —</Card> :
         filtered.map(a=>(
           <Card key={a.id}>
             <div style={{fontSize:18, fontWeight:800}}>{a.title}</div>
             <div style={{color:'#6b7280', fontSize:12}}>{new Date(a.created_at).toLocaleString()}</div>
             <div style={{marginTop:6}}>{a.body}</div>
           </Card>
         ))}
      </div>
    </Page>
  );
}