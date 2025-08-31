import { useEffect, useState } from 'react';
import { getMe } from '../mocks/teacherApi';

/** ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่ (teacher, homeroom, account) */
export default function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // cache เบาๆ กันกระพริบเวลาเปลี่ยนหน้า
        const cached = sessionStorage.getItem('me');
        if (cached) {
          const obj = JSON.parse(cached);
          if (alive) { setMe(obj); setLoading(false); }
        } else {
          const data = await getMe();
          if (alive) {
            setMe(data);
            sessionStorage.setItem('me', JSON.stringify(data));
            setLoading(false);
          }
        }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { me, loading };
}