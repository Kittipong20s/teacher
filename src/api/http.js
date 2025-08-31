const BASE = import.meta.env.VITE_API_BASE_URL_TEACHER || '/api';

async function request(path, { method='GET', headers={}, body } = {}){
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type':'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request error'), { payload: err, status: res.status });
  }
  return res.json().catch(()=> ({}));
}

export default {
  get: (p)=>request(p),
  post:(p,b)=>request(p,{method:'POST',body:b}),
  patch:(p,b)=>request(p,{method:'PATCH',body:b}),
  put:  (p,b)=>request(p,{method:'PUT', body:b}),
  del:  (p)=>request(p,{method:'DELETE'}),
};