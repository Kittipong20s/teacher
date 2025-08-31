export const isEmail = (v='') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
export const isPhone10 = (v='') => /^\d{10}$/.test(String(v).replace(/[^\d]/g,''));
export const isEmailOrPhone = (v='') => isEmail(v) || isPhone10(v);
export const normalizePhone = (v='') => String(v).replace(/[^\d]/g,'').slice(0,10);
export const minLen = (v, n) => String(v||'').length >= n;
export const hasLetter = (v) => /[A-Za-z]/.test(String(v));
export const hasDigit = (v) => /\d/.test(String(v));