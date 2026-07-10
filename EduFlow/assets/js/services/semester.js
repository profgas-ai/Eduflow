import { getData, saveData } from './storage.js';

export function archiveSemester(semester) {
  const data = getData();
  const semData = {
    subjects: (data.subjects || []).filter(s => s.semester === semester),
    tasks: (data.tasks || []).filter(t => {
      const subj = data.subjects.find(s => s.id === t.subjectId);
      return subj && subj.semester === semester;
    }),
    attendanceRecords: (data.attendanceRecords || []).filter(a => {
      const subj = data.subjects.find(s => s.id === a.subjectId);
      return subj && subj.semester === semester;
    }),
    notes: (data.notes || []).filter(n => {
      if (!n.subjectId) return false;
      const subj = data.subjects.find(s => s.id === n.subjectId);
      return subj && subj.semester === semester;
    }),
    gradeRecords: (data.gradeRecords || []).filter(() => true),
  };
  const key = `eduflow_semester_${semester}_${getSemesterSuffix()}`;
  localStorage.setItem(key, JSON.stringify(semData));
  return semData;
}

export function loadArchivedSemester(semester) {
  const key = `eduflow_semester_${semester}_${getSemesterSuffix()}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getSemesterSuffix() {
  const data = getData();
  return data.user?.email || 'default';
}

export function getArchivedSemesters() {
  const suffix = getSemesterSuffix();
  const sems = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`eduflow_semester_`) && key.endsWith(suffix)) {
      const sem = parseInt(key.split('_')[2]);
      if (!isNaN(sem)) sems.push(sem);
    }
  }
  return [...new Set(sems)].sort((a, b) => b - a);
}

export function hasArchivedData(semester) {
  const arch = loadArchivedSemester(semester);
  if (!arch) return false;
  return (arch.subjects?.length || 0) > 0 || (arch.tasks?.length || 0) > 0;
}
