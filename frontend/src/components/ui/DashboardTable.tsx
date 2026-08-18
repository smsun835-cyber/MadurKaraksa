import React from 'react';

// Data sementara (Mock Data) sebelum disambungkan ke Appwrite
const mockData = [
  { id: 1, name: 'Budi Santoso', rt: 'RT 01', jan: 10000, feb: 10000, mar: 10000, apr: 10000 },
  { id: 2, name: 'Siti Aminah', rt: 'RT 03', jan: 10000, feb: 0, mar: 10000, apr: 10000 },
];

export default function DashboardTable() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
      {/* Table Header / Actions */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h3 className="font-bold text-lg text-slate-800">Rincian Iuran per RT</h3>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            Export CSV
          </button>
          <button className="px-4 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            Print
          </button>
        </div>
      </div>
      
      {/* Table Wrapper for Mobile Scroll */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <th className="p-4 font-semibold">Resident Name</th>
              <th className="p-4 font-semibold">RT</th>
              <th className="p-4 font-semibold text-center">Jan</th>
              <th className="p-4 font-semibold text-center">Feb</th>
              <th className="p-4 font-semibold text-center">Mar</th>
              <th className="p-4 font-semibold text-center">Apr</th>
              {/* Tambahkan bulan lainnya jika perlu */}
            </tr>
          </thead>
          <tbody className="text-sm">
            {mockData.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="p-4 font-medium text-slate-800">{row.name}</td>
                <td className="p-4 text-slate-500">{row.rt}</td>
                <td className="p-4 text-center">{row.jan.toLocaleString('id-ID')}</td>
                <td className={`p-4 text-center ${row.feb === 0 ? 'text-red-500 font-bold' : ''}`}>
                  {row.feb === 0 ? '0' : row.feb.toLocaleString('id-ID')}
                </td>
                <td className="p-4 text-center">{row.mar.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center">{row.apr.toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}