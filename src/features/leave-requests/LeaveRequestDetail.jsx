import React from 'react';
export default function LeaveRequestDetail({ item }){
  if (!item) return null;
  return (
    <div>
      <div><b>นักเรียน:</b> {item.student}</div>
      <div><b>ประเภท:</b> {item.type}</div>
      <div><b>ช่วงวัน:</b> {item.range}</div>
      <div><b>สถานะ:</b> {item.status}</div>
      <div><b>ไฟล์แนบ:</b> {item.hasFile?'มี':'ไม่มี'}</div>
    </div>
  );
}