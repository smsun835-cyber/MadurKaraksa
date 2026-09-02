import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RTBilling from './pages/RT03Billing'; // Halaman RT 03 yang dibuat sebelumnya
import RT01Billing from './pages/RT01Billing';
import RT02Billing from './pages/RT02Billing';
import Login from './pages/login';
// Jangan lupa import komponen barunya di bagian paling atas
import LaporanKegiatan from './pages/LaporanKegiatan';
import GeneratorSurat from './pages/GeneratorSurat'; // Sesuaikan lokasi filenya

// Di dalam <Routes> Anda, tambahkan:

// Tambahkan di dalam <Routes> Anda

function App() {
  return (
    
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/rt-01" element={<RT01Billing />} />
        <Route path="/rt-02" element={<RT02Billing />} />
        <Route path="/rt-03" element={<RTBilling />} />
        <Route path="/laporan-kegiatan" element={<LaporanKegiatan />} />
        <Route path="/generator-surat" element={<GeneratorSurat />} />
      </Routes>
    
  );
}

export default App;