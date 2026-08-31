import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import { databases, DATABASE_ID, COLLECTION_ID_RT02, getUserRole } from '../services/appwrite';
import { Query, ID } from 'appwrite';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export default function RT02Billing() {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('warga');
    const [namaWarga, setNamaWarga] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bulanPilih, setBulanPilih] = useState('November');
    const [nominal, setNominal] = useState('');
    const [isEditing, setIsEditing] = useState(null);
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
            const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID_RT02, [Query.limit(100)]);
            setResidents(response.documents);
        }
        catch (error) {
            console.error("Gagal mengambil data:", error);
        }
        finally {
            setLoading(false);
        }
    };
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
        doc.save("Laporan_Iuran_RT_02.pdf");
    };
    const daftarNamaUnik = Array.from(new Set(residents.map((r) => r.Nama).filter(Boolean)));
    const filteredNama = daftarNamaUnik.filter(nama => nama.toLowerCase().includes(namaWarga.toLowerCase()));
    const handleSaveRecord = async (e) => {
        e.preventDefault();
        if (!namaWarga.trim())
            return alert("Silakan isi atau pilih nama warga!");
        try {
            if (isEditing) {
                // Mode Edit dari tombol "Edit" di tabel
                await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT02, isEditing, {
                    Nama: namaWarga,
                    [bulanPilih]: Number(nominal),
                });
                alert(`Data ${namaWarga} berhasil diubah!`);
            }
            else {
                // Mode Input Baru: Cek apakah nama warga sudah ada di database
                const existingResident = residents.find((r) => r.Nama.toLowerCase() === namaWarga.toLowerCase().trim());
                if (existingResident) {
                    // JIKA NAMA SUDAH ADA: Update baris yang lama (tambahkan nominal di bulan yang dipilih)
                    await databases.updateDocument(DATABASE_ID, COLLECTION_ID_RT02, existingResident.$id, {
                        [bulanPilih]: Number(nominal),
                    });
                    alert(`Data iuran bulan ${bulanPilih} berhasil ditambahkan ke baris milik ${namaWarga}!`);
                }
                else {
                    // JIKA NAMA BELUM ADA: Buat baris baru
                    await databases.createDocument(DATABASE_ID, COLLECTION_ID_RT02, ID.unique(), {
                        Nama: namaWarga,
                        [bulanPilih]: Number(nominal),
                    });
                    alert(`Warga baru ${namaWarga} berhasil ditambahkan!`);
                }
            }
            // Bersihkan form setelah selesai
            setIsEditing(null);
            setNamaWarga('');
            setNominal('');
            fetchData();
        }
        catch (error) {
            console.error("Gagal menyimpan data:", error);
            alert("Terjadi kesalahan saat menyimpan data.");
        }
    };
    const handleEdit = (item) => {
        setIsEditing(item.$id);
        setNamaWarga(item.Nama);
        setIsDropdownOpen(false);
        setNominal(String(item[bulanPilih] || 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleCancelEdit = () => {
        setIsEditing(null);
        setNamaWarga('');
        setNominal('');
        setIsDropdownOpen(false);
    };
    const handleDelete = async (id, nama) => {
        if (window.confirm(`YAKIN HAPUS? Seluruh record data milik ${nama} pada baris ini akan dihapus permanen.`)) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTION_ID_RT02, id);
                alert(`Data ${nama} berhasil dihapus.`);
                if (isEditing === id)
                    handleCancelEdit();
                fetchData();
            }
            catch (error) {
                console.error("Gagal menghapus:", error);
                alert("Terjadi kesalahan saat menghapus data.");
            }
        }
    };
    const months = ['November', 'Desember', 'Januari', 'Febuari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus'];
    const totalCollected = residents.reduce((acc, curr) => {
        const sumRow = months.reduce((mAcc, month) => mAcc + (Number(curr[month]) || 0), 0);
        return acc + sumRow;
    }, 0);
    const targetPerCell = 10000;
    const totalTargetCell = residents.length * months.length * targetPerCell;
    const pendingDues = Math.max(0, totalTargetCell - totalCollected);
    const amount75 = totalCollected * 0.75;
    const amount25 = totalCollected * 0.25;
    const collectionRate = totalTargetCell > 0 ? ((totalCollected / totalTargetCell) * 100).toFixed(1) : '0';
    return (_jsxs(PageLayout, { activeMenu: "rt02", children: [_jsxs("div", { className: "mb-6 flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-blue-900", children: "RT 02 Financial Overview" }), _jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Manage monthly dues and payment records for residents of RT 02." })] }), _jsxs("div", { className: "text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-medium border border-slate-200", children: ["Status Akses: ", _jsx("span", { className: "font-bold uppercase text-blue-800", children: userRole })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Total Collected" }), _jsxs("h3", { className: "text-2xl font-bold text-slate-800 mb-2", children: ["Rp ", totalCollected.toLocaleString('id-ID')] }), _jsxs("div", { className: "text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Alokasi 75%:" }), _jsxs("span", { className: "font-semibold text-blue-900", children: ["Rp ", amount75.toLocaleString('id-ID')] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Alokasi 25%:" }), _jsxs("span", { className: "font-semibold text-emerald-700", children: ["Rp ", amount25.toLocaleString('id-ID')] })] })] })] }), _jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Pending Dues" }), _jsxs("h3", { className: "text-2xl font-bold text-slate-800 mb-1", children: ["Rp ", pendingDues.toLocaleString('id-ID')] }), _jsxs("p", { className: "text-xs font-medium text-red-500", children: [residents.length, " Terdaftar (", months.length, " Bulan Periode)"] })] }), _jsxs("div", { className: "bg-white p-5 rounded-xl border border-slate-200 shadow-sm", children: [_jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Collection Rate" }), _jsxs("h3", { className: "text-2xl font-bold text-slate-800 mb-2", children: [collectionRate, "%"] }), _jsx("div", { className: "w-full bg-slate-100 h-2 rounded-full overflow-hidden", children: _jsx("div", { className: "bg-emerald-800 h-full rounded-full transition-all duration-500", style: { width: `${Math.min(Number(collectionRate), 100)}%` } }) })] })] }), userRole !== 'warga' && (_jsxs("div", { className: `p-6 rounded-xl border shadow-sm mb-6 ${isEditing ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`, children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h3", { className: "font-bold text-lg text-slate-800", children: isEditing ? '✏️ Edit Record Iuran' : 'Input Data Iuran Baru' }), isEditing && (_jsx("button", { type: "button", onClick: handleCancelEdit, className: "text-sm bg-white border border-slate-300 px-3 py-1 rounded text-slate-600 hover:text-red-500 font-medium", children: "X Batal Edit" }))] }), _jsxs("form", { onSubmit: handleSaveRecord, className: "grid grid-cols-1 md:grid-cols-4 gap-4 items-start relative", children: [_jsxs("div", { className: "relative", children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Nama Warga" }), _jsx("input", { type: "text", placeholder: "Cari atau ketik nama...", value: namaWarga, onChange: (e) => { setNamaWarga(e.target.value); setIsDropdownOpen(true); }, onFocus: () => setIsDropdownOpen(true), onBlur: () => setTimeout(() => setIsDropdownOpen(false), 200), disabled: !!isEditing, className: `w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${isEditing ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300'}`, required: true }), isDropdownOpen && !isEditing && (_jsxs("ul", { className: "absolute z-10 w-full bg-white border border-slate-200 shadow-xl max-h-48 overflow-y-auto rounded-lg mt-1", children: [filteredNama.length > 0 ? (filteredNama.map((nama, index) => (_jsx("li", { 
                                                // UBAH onClick MENJADI onMouseDown DI SINI:
                                                onMouseDown: () => { setNamaWarga(nama); setIsDropdownOpen(false); }, className: "p-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-50 transition", children: nama }, index)))) : (_jsx("li", { className: "p-2.5 text-sm text-slate-500 italic", children: "Nama belum ada di DB" })), namaWarga.trim() !== '' && !daftarNamaUnik.includes(namaWarga) && (_jsxs("li", { 
                                                // UBAH onClick MENJADI onMouseDown DI SINI:
                                                onMouseDown: () => setIsDropdownOpen(false), className: "p-2.5 text-sm bg-blue-50 text-blue-800 font-semibold cursor-pointer sticky bottom-0 border-t border-blue-100", children: ["+ Jadikan \"", namaWarga, "\" warga baru"] }))] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Bulan" }), _jsxs("select", { value: bulanPilih, onChange: (e) => {
                                            const bulan = e.target.value;
                                            setBulanPilih(bulan);
                                            if (isEditing) {
                                                const currentResident = residents.find(r => r.$id === isEditing);
                                                if (currentResident)
                                                    setNominal(String(currentResident[bulan] || 0));
                                            }
                                        }, className: "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-100 h-[42px]", children: [_jsx("option", { value: "November", children: "November" }), _jsx("option", { value: "Desember", children: "Desember" }), _jsx("option", { value: "Januari", children: "Januari" }), _jsx("option", { value: "Febuari", children: "Februari" }), _jsx("option", { value: "Maret", children: "Maret" }), _jsx("option", { value: "April", children: "April" }), _jsx("option", { value: "Mei", children: "Mei" }), _jsx("option", { value: "Juni", children: "Juni" }), _jsx("option", { value: "Juli", children: "Juli" }), _jsx("option", { value: "Agustus", children: "Agustus" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-slate-600 uppercase mb-1", children: "Nominal (Rp)" }), _jsx("input", { type: "number", placeholder: "10000", value: nominal, onChange: (e) => setNominal(e.target.value), className: "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 h-[42px]", required: true })] }), _jsx("div", { className: "h-full flex items-end", children: _jsx("button", { type: "submit", className: `w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm transition h-[42px] ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-900 hover:bg-blue-800'}`, children: isEditing ? '💾 Update Record' : '💾 Save Record' }) })] })] })), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl shadow-sm mb-6 flex flex-col", children: [_jsxs("div", { className: "p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl", children: [_jsx("h3", { className: "font-bold text-lg text-slate-800", children: "Tabel Iuran Warga RT 02" }), _jsx("button", { type: "button", onClick: handleDownloadPDF, className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-md transition flex items-center gap-2 cursor-pointer", children: "\uD83D\uDCE5 DOWNLOAD Laporan PDF" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse min-w-[1200px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50", children: [_jsx("th", { className: "p-4 font-semibold", children: "Nama" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Nov" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Des" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Jan" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Feb" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Mar" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Apr" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Mei" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Jun" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Jul" }), _jsx("th", { className: "p-4 font-semibold text-center", children: "Agu" }), userRole !== 'warga' && (_jsx("th", { className: "p-4 font-semibold text-center bg-slate-100 border-l border-slate-200", children: "Aksi" }))] }) }), _jsx("tbody", { className: "text-sm", children: loading ? (_jsx("tr", { children: _jsx("td", { colSpan: 12, className: "p-6 text-center text-slate-400", children: "Memuat data dari database..." }) })) : residents.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 12, className: "p-6 text-center text-slate-400", children: "Belum ada data tersimpan." }) })) : (residents.map((item) => (_jsxs("tr", { className: `border-b border-slate-100 hover:bg-slate-50 transition ${isEditing === item.$id ? 'bg-orange-50' : ''}`, children: [_jsx("td", { className: "p-4 font-medium text-slate-800", children: item.Nama }), _jsx("td", { className: "p-4 text-center", children: item.November?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Desember?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Januari?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Febuari?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Maret?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.April?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Mei?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Juni?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Juli?.toLocaleString('id-ID') || 0 }), _jsx("td", { className: "p-4 text-center", children: item.Agustus?.toLocaleString('id-ID') || 0 }), userRole !== 'warga' && (_jsx("td", { className: "p-4 text-center bg-slate-50 border-l border-slate-100", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { type: "button", onClick: () => handleEdit(item), className: "px-3 py-1 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 font-semibold transition text-xs", children: "Edit" }), userRole === 'admin' && (_jsx("button", { type: "button", onClick: () => handleDelete(item.$id, item.Nama), className: "px-3 py-1 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 font-semibold transition text-xs", children: "Hapus" }))] }) }))] }, item.$id)))) })] }) })] })] }));
}
