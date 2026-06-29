# EduFlow

Aplikasi manajemen mata kuliah untuk mahasiswa — mengelola jadwal, tugas, presensi, catatan, dan kalender akademik.

## Fitur

- **Dashboard** — Statistik, grafik progres, jadwal hari ini, deadline mingguan, presensi cepat, kalkulator IPK.
- **Mata Kuliah** — CRUD mata kuliah + jadwal per semester + duplikasi semester.
- **Tugas** — CRUD tugas + sub-task checklist + filter/sortir prioritas & status.
- **Presensi** — Rekap kehadiran per mata kuliah dengan indikator alpha.
- **Kalender** — Tampilan kalender dengan event, deadline, UTS, UAS.
- **Catatan** — CRUD catatan + markdown preview + filter per mata kuliah + export per-note (md).
- **Pengaturan** — Profil, tema, ekspor/impor data, hapus data.

## Arsitektur

```
EduFlow/
├── index.html             # Dashboard
├── login.html             # Login/Register
├── subjects.html          # Mata Kuliah
├── tasks.html             # Tugas
├── attendance.html        # Presensi
├── calendar.html          # Kalender
├── notes.html             # Catatan
├── settings.html          # Pengaturan
├── manifest.json          # PWA manifest
├── service-worker.js      # Service Worker
├── assets/
│   ├── css/               # Modular CSS
│   ├── icons/             # Ikon aplikasi
│   └── js/
│       ├── app.js         # Entry point
│       ├── config/        # Konfigurasi
│       ├── utils/         # Helper, validator, formatter
│       ├── services/      # Auth, database, storage, notification, supabase
│       ├── components/    # UI components (card, chart, modal, dll)
│       ├── modules/       # Per-page logic
│       └── data/          # Dummy data
└── docs/                  # Dokumentasi
```

## Teknologi

- HTML + CSS (Material Design 3) + Vanilla JS (ES Modules)
- Supabase (Auth + Database)
- Chart.js (grafik)
- IndexedDB + localStorage (offline fallback)
- PWA (manifest + service worker)

## Deployment

App di-deploy ke Vercel. Setiap push ke branch `main` di GitHub akan auto-deploy.

## Pengembangan

Jalankan dengan live server (VS Code Live Server / http-server):

```bash
npx http-server . -p 5500 --cors
```

Buka `http://localhost:5500/EduFlow/index.html`.
