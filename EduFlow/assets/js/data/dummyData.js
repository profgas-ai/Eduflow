import { generateId } from '../utils/helper.js';

export function createDummyData() {
  const now = new Date().toISOString();
  const subjects = [
    { id: generateId(), code: 'CS-302', name: 'Algoritma Lanjut', sks: 3, semester: 5, category: 'Wajib', lecturer: 'Prof. Dr. Budi Santoso', lecturerEmail: 'budi@univ.ac.id', lecturerPhone: '081234567890', room: 'Lab Komputasi A', day: 'Senin', startTime: '08:00', endTime: '10:30', linkLms: 'https://lms.univ.ac.id/cs302', linkMeet: '', linkWa: '', notes: '', color: '#4f46e5', icon: '', active: true, totalSessions: 14, present: 12, currentMeeting: 15, totalMeetings: 16, createdAt: now, updatedAt: now },
    { id: generateId(), code: 'IT-204', name: 'Sistem Basis Data', sks: 4, semester: 5, category: 'Wajib', lecturer: 'Dr. Sari Wulandari', lecturerEmail: 'sari@univ.ac.id', lecturerPhone: '081234567891', room: 'Ruang 301', day: 'Selasa', startTime: '09:00', endTime: '12:00', linkLms: '', linkMeet: 'https://meet.google.com/db2024', linkWa: '', notes: '', color: '#006c49', icon: '', active: true, totalSessions: 10, present: 10, currentMeeting: 11, totalMeetings: 16, createdAt: now, updatedAt: now },
    { id: generateId(), code: 'UI-101', name: 'Interaksi Manusia Komputer', sks: 2, semester: 5, category: 'Wajib', lecturer: 'Dian Permata Sari', lecturerEmail: 'dian@univ.ac.id', lecturerPhone: '081234567892', room: 'Ruang 205', day: 'Rabu', startTime: '13:00', endTime: '14:40', linkLms: '', linkMeet: '', linkWa: '', notes: '', color: '#a44100', icon: '', active: true, totalSessions: 12, present: 8, currentMeeting: 13, totalMeetings: 16, createdAt: now, updatedAt: now },
    { id: generateId(), code: 'CS-401', name: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5, category: 'Wajib', lecturer: 'Prof. Dr. Agus Pratama', lecturerEmail: 'agus@univ.ac.id', lecturerPhone: '081234567893', room: 'Ruang 102', day: 'Kamis', startTime: '10:00', endTime: '12:30', linkLms: 'https://lms.univ.ac.id/cs401', linkMeet: '', linkWa: '', notes: '', color: '#0e7490', icon: '', active: true, totalSessions: 11, present: 9, currentMeeting: 12, totalMeetings: 16, createdAt: now, updatedAt: now },
  ];

  const tasks = [
    { id: generateId(), subjectId: subjects[0].id, title: 'Kerjakan Problem Set 8', description: 'Materi tentang Dynamic Programming', deadline: new Date(Date.now() + 86400000 * 2).toISOString(), deadlineTime: '23:59', priority: 'high', status: 'pending', category: 'Tugas', progress: 0, checklist: [], attachments: [], references: [], notes: '', reminder: true, createdAt: now, completedAt: null },
    { id: generateId(), subjectId: subjects[1].id, title: 'Buat ERD Final', description: 'Entity Relationship Diagram untuk project database', deadline: new Date(Date.now() + 86400000 * 5).toISOString(), deadlineTime: '23:59', priority: 'medium', status: 'in_progress', category: 'Project', progress: 40, checklist: ['Buat draft ERD', 'Review dengan dosen', 'Finalisasi'], attachments: [], references: [], notes: '', reminder: true, createdAt: now, completedAt: null },
    { id: generateId(), subjectId: subjects[2].id, title: 'Membaca Paper HCI', description: 'Paper tentang usability testing', deadline: new Date(Date.now() + 86400000 * 7).toISOString(), deadlineTime: '23:59', priority: 'low', status: 'pending', category: 'Membaca', progress: 0, checklist: [], attachments: [], references: [], notes: '', reminder: false, createdAt: now, completedAt: null },
    { id: generateId(), subjectId: subjects[3].id, title: 'Dokumentasi SRS', description: 'Software Requirements Specification', deadline: new Date(Date.now() + 86400000 * 3).toISOString(), deadlineTime: '23:59', priority: 'high', status: 'pending', category: 'Dokumen', progress: 10, checklist: ['Pendahuluan', 'Deskripsi sistem', 'Requirements'], attachments: [], references: [], notes: '', reminder: true, createdAt: now, completedAt: null },
  ];

  const schedules = [
    { id: generateId(), subjectId: subjects[0].id, day: 'Senin', startTime: '08:00', endTime: '10:30', room: 'Lab Komputasi A', lecturer: 'Prof. Dr. Budi Santoso', linkMeet: '' },
    { id: generateId(), subjectId: subjects[1].id, day: 'Selasa', startTime: '09:00', endTime: '12:00', room: 'Ruang 301', lecturer: 'Dr. Sari Wulandari', linkMeet: 'https://meet.google.com/db2024' },
    { id: generateId(), subjectId: subjects[2].id, day: 'Rabu', startTime: '13:00', endTime: '14:40', room: 'Ruang 205', lecturer: 'Dian Permata Sari', linkMeet: '' },
    { id: generateId(), subjectId: subjects[3].id, day: 'Kamis', startTime: '10:00', endTime: '12:30', room: 'Ruang 102', lecturer: 'Prof. Dr. Agus Pratama', linkMeet: '' },
  ];

  const attendanceRecords = [];
  subjects.forEach(s => {
    for (let i = 1; i <= s.totalSessions; i++) {
      attendanceRecords.push({
        id: generateId(),
        subjectId: s.id,
        meeting: i,
        date: new Date(Date.now() - (s.totalSessions - i) * 86400000 * 7).toISOString(),
        status: i <= s.present ? 'hadir' : (i % 5 === 0 ? 'izin' : 'alpha'),
        notes: '',
        createdAt: now,
      });
    }
  });

  const notes = [
    { id: generateId(), subjectId: subjects[0].id, title: 'Rangkuman Dynamic Programming', content: '# Dynamic Programming\n\n## Optimal Substructure\n\nDP digunakan ketika masalah dapat dipecah menjadi submasalah yang lebih kecil.', checklist: [], pinned: true, tags: ['dp', 'algoritma'], createdAt: now, updatedAt: now },
    { id: generateId(), subjectId: subjects[1].id, title: 'Catatan Normalisasi DB', content: '## 1NF, 2NF, 3NF\n\n### 1NF\n- Setiap kolom berisi nilai atomik', checklist: [], pinned: false, tags: ['database', 'normalisasi'], createdAt: now, updatedAt: now },
  ];

  const notifications = [
    { id: generateId(), type: 'deadline', title: 'Deadline Tugas', message: 'Problem Set 8 Algoritma Lanjut deadline 2 hari lagi', read: false, createdAt: now },
    { id: generateId(), type: 'class', title: 'Kelas Hari Ini', message: 'Sistem Basis Data dimulai pukul 09:00', read: false, createdAt: now },
  ];

  const events = [
    { id: generateId(), subjectId: '', title: 'UTS Semester 5', type: 'uts', date: new Date(Date.now() + 86400000 * 30).toISOString(), description: 'Ujian Tengah Semester' },
    { id: generateId(), subjectId: '', title: 'Libur Nasional', type: 'holiday', date: new Date(Date.now() + 86400000 * 14).toISOString(), description: '' },
  ];

  return {
    user: {
      name: 'Rizky Pratama',
      email: 'rizky@univ.ac.id',
      semester: 5,
      studyProgram: 'Informatika',
      university: 'Universitas Nusantara',
      avatar: '',
      theme: 'system',
      language: 'id',
      timezone: 'Asia/Jakarta',
    },
    subjects,
    tasks,
    schedules,
    attendanceRecords,
    notes,
    notifications,
    events,
    files: [],
    settings: {
      semesterActive: 5,
      attendanceTarget: 75,
      reminderEnabled: true,
      reminderBeforeDeadline: 24,
      language: 'id',
      theme: 'system',
    },
  };
}
