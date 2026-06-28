export const STORE_KEY = 'eduflow_data_v2';

export const DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

export const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export const ID_LOCALE = 'id-ID';

export const GREETINGS = {
  morning: 'SELAMAT PAGI',
  afternoon: 'SELAMAT SIANG',
  evening: 'SELAMAT SORE',
  night: 'SELAMAT MALAM',
};

export const DEFAULTS = {
  user: {
    name: 'Pengguna',
    email: '',
    semester: 1,
    studyProgram: '',
    university: '',
    avatar: '',
    theme: 'system',
    language: 'id',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  subject: {
    id: null,
    code: '',
    name: '',
    sks: 3,
    semester: 1,
    category: '',
    lecturer: '',
    lecturerEmail: '',
    lecturerPhone: '',
    room: '',
    day: '',
    startTime: '',
    endTime: '',
    linkLms: '',
    linkMeet: '',
    linkWa: '',
    notes: '',
    color: '#4f46e5',
    icon: '',
    active: true,
    totalSessions: 0,
    present: 0,
    currentMeeting: 0,
    totalMeetings: 16,
    createdAt: null,
    updatedAt: null,
  },
  task: {
    id: null,
    subjectId: '',
    title: '',
    description: '',
    deadline: '',
    deadlineTime: '',
    priority: 'medium',
    status: 'pending',
    category: '',
    progress: 0,
    checklist: [],
    attachments: [],
    references: [],
    notes: '',
    reminder: false,
    createdAt: null,
    completedAt: null,
  },
  attendance: {
    id: null,
    subjectId: '',
    meeting: 1,
    date: '',
    status: 'hadir',
    notes: '',
    createdAt: null,
  },
  schedule: {
    id: null,
    subjectId: '',
    day: '',
    startTime: '',
    endTime: '',
    room: '',
    lecturer: '',
    linkMeet: '',
  },
  note: {
    id: null,
    subjectId: '',
    title: '',
    content: '',
    checklist: [],
    pinned: false,
    tags: [],
    createdAt: null,
    updatedAt: null,
  },
  notification: {
    id: null,
    type: '',
    title: '',
    message: '',
    read: false,
    createdAt: null,
  },
  file: {
    id: null,
    subjectId: '',
    name: '',
    type: '',
    size: 0,
    url: '',
    uploadedAt: null,
  },
};
