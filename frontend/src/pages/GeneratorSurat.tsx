import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';

// Interface untuk pihak "Mengetahui" tambahan
interface MengetahuiItem {
  id: string;
  jabatan: string;
  nama: string;
}

export default function GeneratorSurat() {
  // State untuk form input surat
  const [nomorUrut, setNomorUrut] = useState('001');
  const [kodePerihal, setKodePerihal] = useState('U');
  const [perihal, setPerihal] = useState('Undangan Rapat Pengurus');
  const [namaTujuan, setNamaTujuan] = useState('Seluruh Warga RT 01');
  const [isiSurat, setIsiSurat] = useState('Dengan hormat,\n\nSehubungan dengan akan diadakannya kegiatan kerja bakti dan evaluasi keamanan lingkungan, kami mengundang Bapak/Ibu/Sdr/i untuk hadir pada rapat yang akan diselenggarakan pada:\n\nHari/Tanggal :\nWaktu        :\nTempat       :\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya kami ucapkan terima kasih.');
  const [tanggalSurat, setTanggalSurat] = useState(new Date().toISOString().split('T')[0]);

  // State untuk Tanda Tangan Utama
  const [jenisKetua, setJenisKetua] = useState<'Ketua Karang Taruna' | 'Ketua Pelaksana'>('Ketua Karang Taruna');
  const [namaKetua, setNamaKetua] = useState('Nama Ketua');
  const [namaSekretaris, setNamaSekretaris] = useState('Nama Sekretaris');

  // State untuk Opsi "Mengetahui" Tambahan (Bisa lebih dari 1)
  const [daftarMengetahui, setDaftarMengetahui] = useState<MengetahuiItem[]>([]);

  // Fungsi menambah kolom pihak Mengetahui baru
  const tambahMengetahui = () => {
    setDaftarMengetahui([
      ...daftarMengetahui,
      { id: Date.now().toString(), jabatan: 'Ketua RW. 04', nama: 'Nama Pejabat' }
    ]);
  };

  // Fungsi mengubah data pihak Mengetahui
  const updateMengetahui = (id: string, field: 'jabatan' | 'nama', value: string) => {
    setDaftarMengetahui(
      daftarMengetahui.map(item => item.id === id ? { ...item, [field]: value } : item)
    );
  };

  // Fungsi menghapus pihak Mengetahui
  const hapusMengetahui = (id: string) => {
    setDaftarMengetahui(daftarMengetahui.filter(item => item.id !== id));
  };

  // Logika Nomor Surat Otomatis
  const getBulanRomawi = (monthIndex: number) => {
    const romawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romawi[monthIndex];
  };

  const dateObj = new Date(tanggalSurat);
  const bulanRomawi = getBulanRomawi(dateObj.getMonth());
  const tahun = dateObj.getFullYear();
  const nomorSuratLengkap = `${nomorUrut}/${kodePerihal}/KARTA/${bulanRomawi}/${tahun}`;

  const formatTanggalIndo = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageLayout activeMenu="generator">
      <style>{`
        .font-times {
          font-family: 'Times New Roman', Times, serif;
        }
        @media print {
          body * {
            visibility: hidden;
            background-color: white !important;
          }
          #area-surat, #area-surat * {
            visibility: visible;
          }
          #area-surat {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 15mm 20mm !important;
            box-shadow: none !important;
          }
          .sembunyikan-saat-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0mm; 
          }
        }
      `}</style>

      <div className="mb-6 sembunyikan-saat-print">
        <h2 className="text-2xl font-bold text-blue-900">Generator Surat</h2>
        <p className="text-slate-500 text-sm mt-1">Buat template surat dengan Kop, Nomor Surat otomatis, kustomisasi penanda tangan, dan pihak Mengetahui.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ======================================================== */}
        {/* BAGIAN KIRI: FORM INPUT SURAT & TANDA TANGAN */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4 sembunyikan-saat-print bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit sticky top-6">
          <h3 className="font-bold text-slate-800 border-b pb-2 mb-2">Pengaturan Surat</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Urut</label>
              <input type="text" value={nomorUrut} onChange={e => setNomorUrut(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Perihal</label>
              <input type="text" value={kodePerihal} onChange={e => setKodePerihal(e.target.value)} className="w-full border rounded p-2 text-sm uppercase" placeholder="U / PEM" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Perihal Surat</label>
            <input type="text" value={perihal} onChange={e => setPerihal(e.target.value)} className="w-full border rounded p-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tujuan / Kepada Yth:</label>
            <input type="text" value={namaTujuan} onChange={e => setNamaTujuan(e.target.value)} className="w-full border rounded p-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Surat</label>
            <input type="date" value={tanggalSurat} onChange={e => setTanggalSurat(e.target.value)} className="w-full border rounded p-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Isi Surat</label>
            <textarea 
              value={isiSurat} 
              onChange={e => setIsiSurat(e.target.value)} 
              className="w-full border rounded p-2 text-sm h-36 resize-none"
            />
          </div>

          {/* PENGATURAN PENANDA TANGAN */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Pengaturan Penanda Tangan</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Jabatan Pimpinan</label>
                <select 
                  value={jenisKetua} 
                  onChange={e => setJenisKetua(e.target.value as any)}
                  className="w-full border rounded p-2 text-xs bg-white"
                >
                  <option value="Ketua Karang Taruna">Ketua Karang Taruna</option>
                  <option value="Ketua Pelaksana">Ketua Pelaksana</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Pimpinan</label>
                <input type="text" value={namaKetua} onChange={e => setNamaKetua(e.target.value)} className="w-full border rounded p-2 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Sekretaris</label>
              <input type="text" value={namaSekretaris} onChange={e => setNamaSekretaris(e.target.value)} className="w-full border rounded p-2 text-xs" />
            </div>
          </div>

          {/* OPSI TAMBAHAN PIHAK "MENGETAHUI" */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Pihak Mengetahui (Opsional)</h4>
              <button 
                type="button" 
                onClick={tambahMengetahui}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded font-semibold hover:bg-blue-100 transition"
              >
                + Tambah Pihak
              </button>
            </div>

            {daftarMengetahui.map((item) => (
              <div key={item.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                <input 
                  type="text" 
                  placeholder="Jabatan (Cth: Ketua RW)" 
                  value={item.jabatan} 
                  onChange={e => updateMengetahui(item.id, 'jabatan', e.target.value)} 
                  className="w-1/2 border rounded p-1.5 text-xs bg-white"
                />
                <input 
                  type="text" 
                  placeholder="Nama Lengkap" 
                  value={item.nama} 
                  onChange={e => updateMengetahui(item.id, 'nama', e.target.value)} 
                  className="w-1/2 border rounded p-1.5 text-xs bg-white"
                />
                <button 
                  type="button" 
                  onClick={() => hapusMengetahui(item.id)}
                  className="text-red-500 hover:text-red-700 font-bold px-1.5 text-sm"
                  title="Hapus"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={handlePrint}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition mt-4"
          >
            🖨️ Print / Simpan PDF
          </button>
        </div>


        {/* ======================================================== */}
        {/* BAGIAN KANAN: KERTAS PREVIEW SURAT A4 */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 overflow-x-auto">
          <div
            id="area-surat"
            className="bg-white mx-auto shadow-lg p-8 md:p-12 text-black font-times border border-slate-200"
            style={{ width: '100%', maxWidth: '210mm', minHeight: '297mm' }}
            >
            <div>
              {/* 1. KOP SURAT */}
              <div className="flex items-center justify-between border-b-[3px] border-black pb-3 mb-1">
                <div className="w-20 h-24 flex-shrink-0 flex items-center justify-center">
                  <img src="logo-kiri.png" alt="Logo Kiri" className="w-full h-full object-contain" />
                </div>
                
                <div className="text-center flex-1 px-2 font-times text-slate-800">
                  <h1 className="text-2xl font-bold mb-1 tracking-wide text-slate-800">Karang Taruna RW. 04</h1>
                  <p className="text-[13px] m-0 leading-tight text-slate-700">Jl. Cangkuang – Cikalong Kp. Madur Rw. 04 Desa.</p>
                  <p className="text-[13px] m-0 leading-tight text-slate-700">Sukamaju Kec. Cimaung KAB. BANDUNG</p>
                  <p className="text-[13px] m-0 leading-tight text-slate-700">JAWA BARAT - INDONESIA</p>
                </div>

                <div className="w-20 h-24 flex-shrink-0 flex items-center justify-center">
                  <img src="logo-kanan.png" alt="Logo Kanan" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="border-b border-black mb-6 w-full"></div>

              {/* 2. METADATA & TUJUAN SURAT (Tujuan dipindah ke bawah Perihal) */}
              <div className="mb-6 text-sm space-y-4">
                <div>
                  <table>
                    <tbody>
                      <tr>
                        <td className="pr-4 py-0.5">Nomor</td>
                        <td className="px-2 py-0.5">:</td>
                        <td className="py-0.5 font-semibold">{nomorSuratLengkap}</td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-0.5">Lampiran</td>
                        <td className="px-2 py-0.5">:</td>
                        <td className="py-0.5">-</td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-0.5 align-top">Perihal</td>
                        <td className="px-2 py-0.5 align-top">:</td>
                        <td className="py-0.5 font-semibold">{perihal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <p className="mb-0.5">Kepada Yth,</p>
                  <p className="font-semibold">{namaTujuan}</p>
                  <p>di Tempat</p>
                </div>
              </div>

              {/* 3. ISI SURAT UTAMA */}
              <div className="text-justify text-sm mb-8 whitespace-pre-wrap leading-relaxed">
                {isiSurat}
              </div>
            </div>

           {/* 4. BAGIAN TANDA TANGAN DINAMIS */}
            <div className="text-sm pt-6 space-y-6">
              
              {/* Bagian Tanda Tangan Utama (Sekretaris & Ketua Sejajar Sempurna) */}
              <div className="flex justify-between text-center">
                <div className="w-48">
                  {/* Perhatikan class invisible agar teks 'Spacer' tidak terlihat */}
                  <p className="invisible mb-1 text-xs select-none"></p>
                  <br></br>
                  <p className="mb-14">Sekretaris,</p>
                  <p className="font-bold underline">{namaSekretaris}</p>
                </div>

                <div className="w-48">
                  <p className="mb-1">Bandung, {formatTanggalIndo(tanggalSurat)}</p>
                  <p className="mb-14">{jenisKetua},</p>
                  <p className="font-bold underline">{namaKetua}</p>
                </div>
              </div>

              {/* Bagian Pihak Mengetahui Tambahan (Aman dan tidak terpotong di bawah) */}
              {daftarMengetahui.length > 0 && (
                <div className="pt-2">
                  <p className="text-center text-xs italic font-medium text-slate-600 mb-2">Mengetahui,</p>
                  
                  <div className="flex flex-wrap justify-center gap-16 text-center">
                    {daftarMengetahui.map((item) => (
                      <div key={item.id} className="w-48">
                        <p className="mb-1 text-xs font-semibold">{item.jabatan}</p>
                        <div className="h-10"></div> {/* Ruang tanda tangan proporsional */}
                        <p className="font-bold underline text-sm">{item.nama}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            

            </div>

          </div>
        </div>

      </div>
    </PageLayout>
  );
}