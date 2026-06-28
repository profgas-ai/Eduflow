# EduFlow

Manajemen mata kuliah, tugas, presensi, jadwal, dan catatan — PWA berbasis Supabase.

> Repo private — source code tidak publik. Website dapat diakses di https://eduflow-two-pearl.vercel.app

## Fitur

- **Auth Multi-User** — Register/login via Supabase, data terisolasi per user
- **Dashboard** — Greeting dinamis, jam realtime, quick stats, grafik (Chart.js), jadwal hari ini, tugas terdekat
- **Mata Kuliah** — CRUD lengkap (dosen, ruang, jadwal, link LMS/Meet/WA, SKS, semester)
- **Tugas** — Filter, sorting, search, prioritas, status, tenggat
- **Presensi** — Catat kehadiran per pertemuan, ubah/edit/hapus riwayat, persentase + grafik, warning < 75%
- **Kalender Akademik** — Bulanan, detail harian, event (deadline, quiz, UTS, UAS, libur)
- **Catatan** — Markdown, pinned, filter per mata kuliah, tags
- **Pengaturan** — Profil, upload avatar, tema (Light/Dark/System), export/import/hapus data, logout
- **PWA** — Manifest, service worker, installable

## Teknologi

| Teknologi | Kegunaan |
|-----------|----------|
| HTML + CSS (Material Design 3) + JS ES Modules | Frontend |
| Supabase | Auth + Database + Storage |
| Chart.js | Grafik |
| localStorage | Cache offline (terpisah per user) |

## Struktur Folder

```
EduFlow/
├── index.html / login.html / subjects.html / tasks.html
├── attendance.html / calendar.html / notes.html / settings.html
├── manifest.json / service-worker.js
├── assets/
│   ├── css/ (main, components, dashboard, subjects, tasks, attendance, calendar, responsive)
│   ├── js/
│   │   ├── app.js                 # Entry point
│   │   ├── config/config.js       # Konfigurasi (Supabase URL, key, dll)
│   │   ├── services/              # auth.js, database.js, storage.js, notification.js
│   │   ├── modules/               # dashboard.js, subjects.js, tasks.js, attendance.js, calendar.js, notes.js, settings.js
│   │   ├── components/            # sidebar.js, navbar.js, modal.js, toast.js, card.js, chart.js
│   │   ├── utils/                 # helper.js, validator.js, formatter.js, constants.js
│   │   └── data/dummyData.js
│   ├── icons/ / images/
├── database/schema.sql
└── docs/
```



## ERD

```
users (1) ──── (N) subjects, tasks, attendance, schedules, notes, notifications, settings, files, events
subjects (1) ── (N) tasks, attendance, schedules, notes, files, events
```

## Roadmap

### v2.0
- [x] ES Modules, struktur folder
- [x] CRUD mata kuliah, tugas, presensi, catatan
- [x] Dashboard + grafik (Chart.js)
- [x] Kalender akademik
- [x] Dark mode, responsive, PWA
- [x] Auth Supabase (multi-user)
- [x] Export/Import JSON

### Planned
- [ ] Upload file (PDF, gambar)
- [ ] Push notification / reminder
- [ ] Schedule timeline view
- [ ] Export PDF
- [ ] GPA calculator
- [ ] Real-time sync (Supabase Realtime)
- [ ] Offline-first (IndexedDB)

## Lisensi

MIT
