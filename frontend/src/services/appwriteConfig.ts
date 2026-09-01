import { Client, Account, Databases } from 'appwrite';

const client = new Client();
client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
    .setProject('6a7bd1ea001cc740052d'); 

export const databases = new Databases(client);

// ---> TAMBAHKAN BARIS INI (Membuat instansiasi objek 'account') <---
export const account = new Account(client);

export {Client};

export const DATABASE_ID = '6a7be3640032a6fe80bb';
export const COLLECTION_ID_RT01 = 'rt_1';
export const COLLECTION_ID_RT02 = 'rt_2';
export const COLLECTION_ID_RT03 = 'rt_3';
// Tambahkan di deretan variabel ID Anda yang lain
export const COLLECTION_ID_KEUANGAN = 'keuangan';
export const COLLECTION_ID_KEGIATAN = 'kegiatan';

// Fungsi helper untuk mengecek role
export async function getUserRole() {
    try {
        const user = await account.get();
        const labels = user.labels || [];
        
        if (labels.includes('admin')) return 'admin';
        if (labels.includes('bendahara')) return 'bendahara';
        if (labels.includes('Barudak')) return 'Barudak';
        return 'warga';
    } catch (error) {
        return 'warga'; // Publik / Belum login
    }
}