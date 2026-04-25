import React from 'react';

const Unauthorized = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>403 - Akses Ditolak</h2>
    <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
    <a href="/" className='btn btn-primary'>Go Home</a>
  </div>
);

export default Unauthorized;
