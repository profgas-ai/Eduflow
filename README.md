# EduFlow 📚

**Aplikasi manajemen mata kuliah cerdas untuk mahasiswa**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-eduflow--two--pearl.vercel.app-4f46e5?style=flat-square&logo=vercel)](https://eduflow-two-pearl.vercel.app/)
[![Version](https://img.shields.io/badge/Versi-2.0.0-blue?style=flat-square)](https://github.com/profgas-ai/Eduflow)
[![License](https://img.shields.io/badge/Lisensi-MIT-green?style=flat-square)](LICENSE)

---

## Tentang EduFlow

EduFlow adalah Progressive Web App (PWA) yang dirancang untuk membantu mahasiswa mengelola perkuliahan dalam satu platform. Mulai dari mencatat mata kuliah, melacak tugas dan deadline, memantau kehadiran, hingga menghitung IPK — semua tersedia tanpa perlu install aplikasi tambahan.

Dibangun sebagai **project mandiri** oleh mahasiswa Teknik Informatika **Universitas Maritim Raja Ali Haji (UMRAH)**.

---

## Fitur Utama

### 📊 Dashboard
- Ringkasan aktivitas kuliah hari ini dan minggu ini
- Jadwal kuliah dengan indikator kelas aktif
- Tugas mendekati deadline
- Catatan yang di-pin
- Kalkulator IPK real-time dengan persistensi data

### 📖 Mata Kuliah
- Kelola mata kuliah per semester
- Informasi lengkap: dosen, ruang, link LMS, link Meet, link WA grup
- Indikator sisa jatah alpha langsung di card
- Filter dan pencarian cepat

### ✅ Tugas
- Tambah tugas dengan prioritas (Rendah / Sedang / Tinggi)
- Sub-tugas dengan checklist yang bisa di-tick langsung dari card
- Pengingat deadline via notifikasi
- Filter berdasarkan status, prioritas, dan kategori
- Sortir berdasarkan deadline, prioritas, judul, atau tanggal dibuat

### 📋 Presensi
- Catat kehadiran per pertemuan (Hadir / Izin / Sakit / Alpha)
- Hitung otomatis persentase kehadiran per mata kuliah
- Tampilkan sisa jatah alpha sebelum di bawah 75%
- Riwayat presensi lengkap dengan opsi edit status

### 📅 Kalender
- Tampilan bulan dengan event terintegrasi
- Deadline tugas otomatis muncul di kalender
- Jadwal kuliah otomatis dari data mata kuliah

### 📝 Catatan
- Buat catatan per mata kuliah
- Dukungan Markdown
- Pin catatan ke dashboard
- Tag untuk organisasi
- Export catatan per file `.md`
- Pencarian catatan real-time

### ⚙️ Pengaturan
- Dark mode / Light mode / Sistem
- Ganti warna aksen (8 pilihan)
- Profil pengguna (nama, program studi, universitas)
- Export & Import data (backup JSON)
- Reset data

---

## Teknologi

| Kategori | Teknologi |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES Modules) |
| Database Cloud | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Penyimpanan Lokal | IndexedDB + localStorage |
| PWA | Service Worker, Web App Manifest |
| Chart | [Chart.js](https://www.chartjs.org/) |
| Deployment | [Vercel](https://vercel.com) |

---

## Struktur Folder

```
EduFlow/
├── index.html              # Dashboard
├── subjects.html           # Mata kuliah
├── tasks.html              # Tugas
├── attendance.html         # Presensi
├── calendar.html           # Kalender
├── notes.html              # Catatan
├── settings.html           # Pengaturan
├── login.html              # Login / Register
├── manifest.json           # PWA manifest
├── service-worker.js       # PWA caching
├── database/
│   └── schema.sql          # Skema database Supabase
└── assets/
    ├── css/
    │   ├── main.css         # Style global & variabel tema
    │   ├── components.css   # Komponen UI (card, modal, toast)
    │   ├── responsive.css   # Breakpoint mobile
    │   ├── dashboard.css
    │   ├── subjects.css
    │   ├── tasks.css
    │   ├── attendance.css
    │   └── calendar.css
    ├── js/
    │   ├── app.js           # Entry point & inisialisasi halaman
    │   ├── config/
    │   │   └── config.js    # Konfigurasi global & konstanta
    │   ├── modules/         # Logic tiap halaman
    │   │   ├── dashboard.js
    │   │   ├── subjects.js
    │   │   ├── tasks.js
    │   │   ├── attendance.js
    │   │   ├── calendar.js
    │   │   ├── notes.js
    │   │   ├── settings.js
    │   │   ├── gpa.js       # Kalkulator IPK
    │   │   └── timetable.js # Jadwal mingguan
    │   ├── services/        # Layer data & autentikasi
    │   │   ├── auth.js      # Login, register, sesi
    │   │   ├── database.js  # CRUD dengan fallback lokal
    │   │   ├── storage.js   # IndexedDB + localStorage
    │   │   ├── supabase.js  # Inisialisasi Supabase client
    │   │   └── notification.js
    │   ├── components/      # UI reusable
    │   │   ├── card.js
    │   │   ├── modal.js
    │   │   ├── toast.js
    │   │   ├── dialog.js
    │   │   ├── chart.js
    │   │   ├── sidebar.js
    │   │   └── navbar.js
    │   └── utils/
    │       ├── helper.js
    │       ├── validator.js
    │       ├── formatter.js
    │       └── constants.js
    └── icons/
        ├── icon.svg
        ├── icon-192.svg
        └── icon-512.svg
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat
- Browser modern (Chrome, Firefox, Edge, Safari)
- Web server lokal (Live Server, Python HTTP server, dll.)
- Akun [Supabase](https://supabase.com) *(opsional — app bisa jalan offline tanpa Supabase)*

### Langkah

**1. Clone repositori**
```bash
git clone https://github.com/profgas-ai/Eduflow.git
cd Eduflow/EduFlow
```

**2. Setup Supabase (opsional)**

Buat project baru di [supabase.com](https://supabase.com), lalu jalankan `database/schema.sql` di SQL Editor Supabase. Setelah itu, edit `assets/js/config/config.js`:

```js
export const CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
  // ...
};
```

**3. Jalankan dengan Live Server**

Gunakan ekstensi [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) di VS Code, atau:

```bash
# Python
python -m http.server 5500

# Node.js
npx serve .
```

Buka `http://localhost:5500` di browser.

> ⚠️ Harus dijalankan lewat HTTP server, bukan buka file langsung (`file://`), karena menggunakan ES Modules.

---

## Mode Offline

EduFlow bisa berjalan **sepenuhnya tanpa koneksi internet**. Data tersimpan di IndexedDB browser. Kalau Supabase tersambung, data otomatis tersinkron ke cloud saat ada koneksi.

> ⚠️ Mode login offline tidak menggunakan enkripsi yang kuat. Disarankan untuk menggunakan akun Supabase agar data lebih aman.

---

## Install sebagai PWA

1. Buka [https://eduflow-two-pearl.vercel.app](https://eduflow-two-pearl.vercel.app) di browser
2. Klik ikon **Install** di address bar (Chrome/Edge), atau pilih **Tambahkan ke layar utama** (Safari/Android)
3. EduFlow akan tersedia seperti aplikasi native di perangkatmu

---

## Database Schema

EduFlow menggunakan PostgreSQL via Supabase dengan tabel berikut:

| Tabel | Deskripsi |
|---|---|
| `users` | Profil pengguna |
| `subjects` | Data mata kuliah |
| `tasks` | Tugas dan checklist |
| `attendance` | Record presensi per pertemuan |
| `schedules` | Jadwal kuliah |
| `notes` | Catatan per mata kuliah |
| `notifications` | Notifikasi in-app |
| `settings` | Preferensi pengguna |
| `events` | Event kalender |
| `files` | File terlampir |

Semua tabel dilindungi dengan **Row Level Security (RLS)** — setiap pengguna hanya bisa mengakses datanya sendiri.

---

## Author

**Muhammad Bagas Risllah**  
Mahasiswa Teknik Informatika  
Universitas Maritim Raja Ali Haji (UMRAH)

---

## Link

- 🌐 **Live Demo:** [eduflow-two-pearl.vercel.app](https://eduflow-two-pearl.vercel.app/)
- 💻 **Repository:** [github.com/profgas-ai/Eduflow](https://github.com/profgas-ai/Eduflow)