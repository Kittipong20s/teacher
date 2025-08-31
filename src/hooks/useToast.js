import { useEffect, useState } from 'react';

export function toast({ title, message, variant='success', timeout=3000 }){
  const ev = new CustomEvent('toast:add', { detail: { id: Date.now(), title, message, variant, timeout } });
  window.dispatchEvent(ev);
}

export default function useToastHost(){
  const [items, setItems] = useState([]);
  useEffect(()=>{
    const onAdd = (e)=>{
      const it = e.detail;
      setItems((s)=>[...s, it]);
      setTimeout(()=> setItems((s)=>s.filter(x=>x.id!==it.id)), it.timeout || 3000);
    };
    window.addEventListener('toast:add', onAdd);
    return ()=> window.removeEventListener('toast:add', onAdd);
  },[]);
  return items;
}