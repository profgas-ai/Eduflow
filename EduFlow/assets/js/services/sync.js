import { setSyncCallback, getData, saveData, persist } from './storage.js';
import { auth } from './auth.js';
import { db } from './database.js';

export async function setupSync() {
  if (!db.isOnline() || !auth.currentUser?.email) return;

  setSyncCallback(async (data) => {
    try {
      const json = JSON.stringify(data);
      const ts = new Date(data.user?.updatedAt || Date.now()).toISOString();
      await db.supabase.from('user_data').upsert(
        { user_email: auth.currentUser.email, data: json, updated_at: ts },
        { onConflict: 'user_email' }
      );
    } catch (e) {
      console.warn('Supabase sync failed:', e.message);
    }
  });

  try {
    const { data: row, error } = await db.supabase
      .from('user_data')
      .select('data, updated_at')
      .eq('user_email', auth.currentUser.email)
      .single();

    if (!error && row) {
      const remoteData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const localData = getData();
      const localT = localData.user?.updatedAt || 0;
      const remoteT = new Date(row.updated_at).getTime();

      if (remoteT > localT) {
        saveData(remoteData);
        console.log('Menggunakan data dari cloud (lebih baru)');
      } else {
        persist();
        console.log('Data lokal lebih baru, push ke cloud');
      }
    } else {
      persist();
      console.log('Tidak ada data remote, push data lokal');
    }
  } catch (e) {
    console.warn('Supabase load failed:', e.message);
  }
}
