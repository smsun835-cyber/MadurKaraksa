import React, { useState } from 'react';
import PageLayout from '../layout/PageLayout';

interface ResidentData {
  id: string;
  block: string;
  name: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

interface RTBillingTemplateProps {
  rtNumber: 'RT 01' | 'RT 02' | 'RT 03';
  activeMenu: 'rt01' | 'rt02' | 'rt03';
  totalCollected: string;
  pendingDues: string;
  collectionRate: string;
  progressWidth: string;
  residents: ResidentData[];
}

export default function RTBillingTemplate({
  rtNumber,
  activeMenu,
  totalCollected,
  pendingDues,
  collectionRate,
  progressWidth,
  residents,
}: RTBillingTemplateProps) {
  const [residentBlock, setResidentBlock] = useState('');
  const [month, setMonth] = useState('Januari');
  const [amount, setAmount] = useState('');

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Data untuk ${rtNumber} - Blok ${residentBlock} bulan ${month} sebesar Rp ${amount} berhasil disimpan!`);
    setResidentBlock('');
    setAmount('');
  };

  return (
    <PageLayout activeMenu={activeMenu}>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">{rtNumber} Financial Overview</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage monthly dues, special assessments, and payment records for residents of {rtNumber}.
          </p>
        </div>
        <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2 w-max">
          <span>📥</span> Export Report
        </button>
      </div>

      {/* SECTION TITLE */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-800">{rtNumber} Billing</h3>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected (Nov)</p>
            <div className="text-slate-400 border border-slate-200 p-1.5 rounded">💳</div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{totalCollected}</h3>
          <p className="text-xs font-medium text-green-600">↗ +4.2% from last month</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Dues</p>
            <div className="text-red-500 bg-red-50 border border-red-100 p-1.5 rounded">📋</div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{pendingDues}</h3>
          <p className="text-xs font-medium text-red-500">Households pending</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collection Rate</p>
            <div className="text-emerald-600 bg-emerald-50 border border-emerald-100 p-1.5 rounded">🎯</div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">{collectionRate}</h3>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-800 h-full rounded-full" style={{ width: progressWidth }}></div>
          </div>
        </div>
      </div>

      {/* INPUT NEW PAYMENT RECORD FORM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-lg text-slate-800 mb-4">Input New Payment Record</h3>
        <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Resident / Block</label>
            <input 
              type="text" 
              placeholder="e.g. A1-01" 
              value={residentBlock}
              onChange={(e) => setResidentBlock(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Month</label>
            <select 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-100"
            >
              <option>Januari</option>
              <option>Februari</option>
              <option>Maret</option>
              <option>April</option>
              <option>Mei</option>
              <option>Juni</option>
              <option>Juli</option>
              <option>Agustus</option>
              <option>September</option>
              <option>Oktober</option>
              <option>November</option>
              <option>Desember</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (Rp)</label>
            <input 
              type="number" 
              placeholder="150000" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <button 
              type="submit" 
              className="w-full bg-blue-900 text-white font-medium py-2.5 px-4 rounded-lg text-sm hover:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              <span>💾</span> Save Record
            </button>
          </div>
        </form>
      </div>

      {/* TABLE DATA WARGA PER BULAN */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Search resident or block..." 
              className="w-full border border-slate-300 rounded-lg py-1.5 px-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="absolute left-3 top-2 text-slate-400">🔍</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button className="px-4 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white">
              All Status
            </button>
            <button className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white">
              ⚙️
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Resident / Block</th>
                <th className="p-4 font-semibold text-center">Jan</th>
                <th className="p-4 font-semibold text-center">Feb</th>
                <th className="p-4 font-semibold text-center">Mar</th>
                <th className="p-4 font-semibold text-center">Apr</th>
                <th className="p-4 font-semibold text-center">May</th>
                <th className="p-4 font-semibold text-center">Jun</th>
                <th className="p-4 font-semibold text-center">Jul</th>
                <th className="p-4 font-semibold text-center">Aug</th>
                <th className="p-4 font-semibold text-center">Sep</th>
                <th className="p-4 font-semibold text-center">Oct</th>
                <th className="p-4 font-semibold text-center">Nov</th>
                <th className="p-4 font-semibold text-center">Dec</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {residents.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-800">
                    {item.block} <span className="text-slate-500 font-normal">({item.name})</span>
                  </td>
                  <td className="p-4 text-center">{item.jan.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.feb.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.mar.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.apr.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.may.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.jun.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.jul.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.aug.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.sep.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.oct.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.nov.toLocaleString()}</td>
                  <td className="p-4 text-center">{item.dec.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <button className="text-slate-500 hover:text-blue-900 transition p-1">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Showing records for {rtNumber}</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">&lt;</button>
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">&gt;</button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}