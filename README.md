# EduFlow - Smart Course Management System

Aplikasi manajemen mata kuliah modern untuk mahasiswa. Dirancang untuk membantu mengelola jadwal kuliah, tugas, presensi, catatan, dan progress akademik dalam satu platform yang clean, minimalis, dan responsif.

## Fitur

- **Dashboard Informatif** — Real-time clock, greeting dinamis, academic momentum, grafik produktivitas, jadwal hari ini, tugas terdekat
- **Mata Kuliah** — CRUD lengkap dengan data detail (dosen, ruangan, jadwal, link LMS/Meet/WA, progress pertemuan)
- **Tugas** — CRUD lengkap dengan prioritas, kategori, progress, filter, sorting, search, checklist
- **Presensi** — Tracking kehadiran per mata kuliah, persentase otomatis, grafik, warning minimum 75%
- **Kalender Akademik** — Tampilan bulanan, deadline, quiz, UTS/UAS, libur, event kampus, klik tanggal untuk detail
- **Catatan** — Markdown, pinned notes, filter per mata kuliah, search, tags
- **Pengaturan** — Profil, tema (Light/Dark/System), export/import data, upload avatar
- **Autentikasi** — Login, Register, Forgot Password, Remember Me (Supabase Auth ready)
- **PWA Ready** — Installable, offline mode, splash screen
- **Global Search** — Cari tugas, mata kuliah, catatan, jadwal
- **Filter & Sorting** — Filter berdasarkan semester, prioritas, status, kategori
- **Export/Import** — Backup & restore data JSON
- **Dark Mode** — Light, Dark, System (preferensi tersimpan)
- **Responsive** — Desktop, Laptop, Tablet, Android, iPhone
- **Accessibility** — Keyboard navigation, ARIA labels, focus indicator, high contrast

## Teknologi

| Teknologi | Kegunaan |
|-----------|----------|
| **HTML5** | Struktur halaman |
| **CSS3** | Styling dengan Material Design 3 |
| **Vanilla JavaScript (ES Modules)** | Logic aplikasi |
| **Chart.js** | Grafik dan visualisasi data |
| **Supabase** | Backend (Auth, Database, Storage, Realtime) |
| **localStorage** | Penyimpanan offline fallback |
| **PWA** | Manifest, Service Worker, Installable |

## Struktur Folder

```
EduFlow/
├── index.html              # Dashboard utama
├── login.html              # Halaman autentikasi
├── subjects.html           # Manajemen mata kuliah
├── tasks.html              # Manajemen tugas
├── attendance.html         # Presensi
├── calendar.html           # Kalender akademik
├── notes.html              # Catatan
├── settings.html           # Pengaturan
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker
├── assets/
│   ├── css/
│   │   ├── main.css        # Variabel, reset, base
│   │   ├── components.css  # Button, card, badge, dll
│   │   ├── dashboard.css   # Dashboard spesifik
│   │   ├── subjects.css    # Subjects spesifik
│   │   ├── tasks.css       # Tasks spesifik
│   │   ├── attendance.css  # Attendance spesifik
│   │   ├── calendar.css    # Calendar spesifik
│   │   └── responsive.css  # Layout & responsive
│   ├── js/
│   │   ├── app.js          # Entry point
│   │   ├── config/
│   │   │   └── config.js   # Konfigurasi aplikasi
│   │   ├── services/
│   │   │   ├── auth.js     # Autentikasi (Supabase)
│   │   │   ├── database.js # Database abstraction
│   │   │   ├── storage.js  # localStorage management
│   │   │   └── notification.js # Push notification
│   │   ├── modules/
│   │   │   ├── dashboard.js
│   │   │   ├── subjects.js
│   │   │   ├── tasks.js
│   │   │   ├── attendance.js
│   │   │   ├── calendar.js
│   │   │   ├── notes.js
│   │   │   └── settings.js
│   │   ├── components/
│   │   │   ├── sidebar.js
│   │   │   ├── navbar.js
│   │   │   ├── modal.js
│   │   │   ├── toast.js
│   │   │   ├── dialog.js
│   │   │   ├── card.js
│   │   │   └── chart.js
│   │   ├── utils/
│   │   │   ├── helper.js
│   │   │   ├── validator.js
│   │   │   ├── formatter.js
│   │   │   └── constants.js
│   │   └── data/
│   │       └── dummyData.js
│   ├── icons/              # PWA icons
│   └── images/             # Gambar
├── database/
│   └── schema.sql          # Supabase schema
└── docs/
    └── README.md           # Dokumentasi
```

## Cara Install

### Prerequisites
- Web browser modern (Chrome, Firefox, Edge, Safari)
- Code editor (VS Code recommended)
- Live Server extension (untuk development)

### Local Development

```bash
# Clone repository
git clone https://github.com/username/eduflow.git

# Masuk ke direktori
cd eduflow

# Buka dengan Live Server
# VS Code: Klik kanan index.html > Open with Live Server
```

### Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy ke Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=EduFlow
```

### Deploy ke GitHub Pages

```bash
# Push ke repository
git push origin main

# Settings > Pages > Source: main branch /docs folder
# Atau gunakan GitHub Actions
```

### Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Jalankan SQL dari `database/schema.sql` di SQL Editor
4. Copy URL dan Anon Key ke `assets/js/config/config.js` atau environment variable

## Environment Variables

Buat file `.env` di root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## ERD

```
users (1) ──── (N) subjects
users (1) ──── (N) tasks
users (1) ──── (N) attendance
users (1) ──── (N) schedules
users (1) ──── (N) notes
users (1) ──── (N) notifications
users (1) ──── (1) settings
users (1) ──── (N) files
users (1) ──── (N) events
subjects (1) ── (N) tasks
subjects (1) ── (N) attendance
subjects (1) ── (N) schedules
subjects (1) ── (N) notes
subjects (1) ── (N) files
subjects (1) ── (N) events
```

## Flow Aplikasi

```
Login/Register
    ↓
Dashboard ──→ Quick Stats ──→ Academic Momentum
    │              ↓
    ├── Mata Kuliah ──→ CRUD ──→ Progress Tracking
    ├── Tugas ──→ CRUD ──→ Filter ──→ Search
    ├── Presensi ──→ Mark Hadir/Absen ──→ Grafik
    ├── Kalender ──→ Bulanan ──→ Detail Harian
    ├── Catatan ──→ Markdown ──→ Pinned ──→ Filter
    └── Pengaturan ──→ Profil ──→ Tema ──→ Export/Import
```

## Roadmap

### v2.0 (Saat Ini)
- [x] Refactor ke ES Modules
- [x] Struktur folder rapi
- [x] Dashboard informatif dengan grafik
- [x] CRUD Mata Kuliah lengkap
- [x] CRUD Tugas dengan filter
- [x] Presensi dengan grafik
- [x] Kalender akademik
- [x] Catatan dengan markdown
- [x] Pengaturan profil & tema
- [x] Dark mode (Light/Dark/System)
- [x] Autentikasi (Supabase ready)
- [x] PWA (manifest + service worker)
- [x] Responsive design
- [x] Export/Import data
- [x] Database schema SQL
- [x] Dokumentasi

### v2.1 (Coming Soon)
- [ ] Global search
- [ ] Upload file (PDF, gambar, dll)
- [ ] Push notification
- [ ] Reminder deadline
- [ ] Schedule timeline view
- [ ] Export PDF & Excel
- [ ] Semester GPA calculator

### v2.2 (Future)
- [ ] Supabase realtime sync
- [ ] Kolaborasi grup
- [ ] Integration Google Calendar
- [ ] AI-powered study suggestions
- [ ] Offline-first with IndexedDB
- [ ] Mobile app (Capacitor)

## Screenshot

> Screenshot akan ditambahkan setelah deployment.

## Kontribusi

Silakan buka issue atau pull request untuk perbaikan dan penambahan fitur.

## Lisensi

MIT License - Silakan gunakan, modifikasi, dan distribusikan sesuai kebutuhan.
