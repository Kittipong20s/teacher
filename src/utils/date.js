export function today(){ return new Date(); }
export function addDays(d, n){ const dd = new Date(d); dd.setDate(dd.getDate()+n); return dd; }
export function fmtYMD(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
export function defaultRange(){ // 30 วันล่าสุด
  const end=today(); const start=addDays(end,-30);
  return { start: fmtYMD(start), end: fmtYMD(end) };
}
export function within90(start, end){
  const s = new Date(start), e = new Date(end);
  const diff = (e - s) / (1000*3600*24);
  return diff <= 90 && diff >= 0;
}