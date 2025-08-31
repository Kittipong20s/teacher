import React from 'react';
export function Label(props){ return <label className="label" {...props} />; }
export function Input(props){ return <input className="input" {...props} />; }
export function Select(props){ return <select className="select" {...props} />; }
export function Textarea(props){ return <textarea className="textarea" {...props} />; }
export function Button({ variant='primary', ...rest }){
  const cls = variant==='secondary' ? 'btn secondary' : 'btn';
  return <button className={cls} {...rest} />;
}