import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT01, getUserRole } from '../services/appwrite';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BillingRecord {
  $id: string;
  Nama: string;
  November: number;
  Desember: number;
  Januari: number;
  Febuari: number;
  Maret: number;
  April: number;
  Mei: number;
  Juni: number;
  Juli: number;
  Agustus: number;
}

export default function RT01Billing() {
  const [residents, setResidents] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('warga');

  const [namaWarga, setNamaWarga] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [bulanPilih, setBulanPilih] = useState('November');
  const [nominal, setNominal] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const role = await getUserRole();
      setUserRole(role);
      fetchData();
    }
    init();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT01, [Query.limit(100)]);
      setResidents(response.documents as unknown as BillingRecord[]);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI DOWNLOAD PDF ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text("Laporan Iuran Warga - RT 01", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 14, 27);

    const tableColumn = ["Nama Warga", "Nov", "Des", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu"];
    const tableRows = residents.map(item => [
      item.Nama,
      (item.November || 0).toLocaleString('id-ID'),
      (item.Desember || 0).toLocaleString('id-ID'),
      (item.Januari || 0).toLocaleString('id-ID'),
      (item.Febuari || 0).toLocaleString('id-ID'),
      (item.Maret || 0).toLocaleString('id-ID'),
      (item.April || 0).toLocaleString('id-ID'),
      (item.Mei || 0).toLocaleString('id-ID'),
      (item.Juni || 0).toLocaleString('id-ID'),
      (item.Juli || 0).toLocaleString('id-ID'),
      (item.Agustus || 0).toLocaleString('id-ID')
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save("Laporan_Iuran_RT_01.pdf");
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaWarga.trim()) return alert("Silakan isi atau pilih nama warga!");

    try {
      if (isEditing) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT01, isEditing, {
          Nama: namaWarga,
          [bulanPilih]: Number(nominal),
        });
        alert(`Data ${namaWarga} berhasil diubah!`);
      } else {
        await databases.createDocument(DATABASE_ID, COLLECTION_ID_RT01, ID.unique(), {
          Nama: namaWarga,
          [bulanPilih]: Number(nominal),
        });
        alert(`Data baru untuk ${namaWarga} berhasil disimpan!`);
      }
      setIsEditing(null);
      setNamaWarga('');
      setNominal('');
      fetchData(); 
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    }
  };

  const handleEdit = (item: BillingRecord) => {
    setIsEditing(item.$id);
    setNamaWarga(item.Nama);
    setNominal(String(item[bulanPilih as keyof BillingRecord] || 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin hapus data ${nama}?`)) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_RT01, id);
        fetchData();
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  return (
    <PageLayout activeMenu="rt01">
      {/* BAGIAN HEADER INI YANG MEMUAT TOMBOL DOWNLOAD PDF */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-900">RT 01 Financial Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Manage monthly dues and payment records for residents of RT 01.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium border border-slate-200">
            Status Akses: <span className="font-bold uppercase text-blue-800">{userRole}</span>
          </div>

          

      {/* KARTU RINGKASAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* ... kartu total collected, pending, collection rate ... */}
      </div>

      {/* FORM INPUT HANYA UNTUK ADMIN/BARUDAK */}
      {userRole !== 'warga' && (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
          {/* ... isi form ... */}
        </div>
      )}

      {/* TABEL DATA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-800">Tabel Iuran Warga RT 01</h3>
          {/* TOMBOL DOWNLOAD */}
          <button 
            type="button"
            onClick={handleDownloadPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2 px-4 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            📥 Download PDF
          </button>
        </div>
      </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Nama</th>
                <th className="p-4 font-semibold text-center">Nov</th>
                <th className="p-4 font-semibold text-center">Des</th>
                <th className="p-4 font-semibold text-center">Jan</th>
                <th className="p-4 font-semibold text-center">Feb</th>
                <th className="p-4 font-semibold text-center">Mar</th>
                <th className="p-4 font-semibold text-center">Apr</th>
                <th className="p-4 font-semibold text-center">Mei</th>
                <th className="p-4 font-semibold text-center">Jun</th>
                <th className="p-4 font-semibold text-center">Jul</th>
                <th className="p-4 font-semibold text-center">Agu</th>
                {userRole !== 'warga' && <th className="p-4 font-semibold text-center bg-slate-100 border-l">Aksi</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {residents.map((item) => (
                <tr key={item.$id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{item.Nama}</td>
                  <td className="p-4 text-center">{item.November?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Desember?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Januari?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Febuari?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Maret?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.April?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Mei?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Juni?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Juli?.toLocaleString('id-ID') || 0}</td>
                  <td className="p-4 text-center">{item.Agustus?.toLocaleString('id-ID') || 0}</td>
                  {userRole !== 'warga' && (
                    <td className="p-4 text-center bg-slate-50 border-l">
                      <button onClick={() => handleEdit(item)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-2">Edit</button>
                      {userRole === 'admin' && (
                        <button onClick={() => handleDelete(item.$id, item.Nama)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Hapus</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}