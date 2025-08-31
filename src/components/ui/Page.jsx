import React from 'react';
export default function Page({ title, children }){
  return (
    <div className="container">
      {title && <h1 className="page-title">{title}</h1>}
      {children}
    </div>
  );
}