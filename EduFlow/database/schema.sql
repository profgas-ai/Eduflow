-- ============================================
-- EduFlow Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  semester INTEGER DEFAULT 1,
  study_program VARCHAR(255),
  university VARCHAR(255),
  avatar TEXT,
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'id',
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sks INTEGER DEFAULT 3,
  semester INTEGER DEFAULT 1,
  category VARCHAR(100),
  lecturer VARCHAR(255),
  lecturer_email VARCHAR(255),
  lecturer_phone VARCHAR(50),
  room VARCHAR(100),
  day VARCHAR(20),
  start_time TIME,
  end_time TIME,
  link_lms TEXT,
  link_meet TEXT,
  link_wa TEXT,
  notes TEXT,
  color VARCHAR(20) DEFAULT '#4f46e5',
  icon VARCHAR(50),
  active BOOLEAN DEFAULT true,
  total_sessions INTEGER DEFAULT 0,
  present INTEGER DEFAULT 0,
  current_meeting INTEGER DEFAULT 0,
  total_meetings INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  deadline_time TIME,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  category VARCHAR(100),
  progress INTEGER DEFAULT 0,
  checklist JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  refs TEXT[],
  notes TEXT,
  reminder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  meeting INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'hadir',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULES TABLE
-- ============================================
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  day VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  room VARCHAR(100),
  lecturer VARCHAR(255),
  link_meet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  checklist JSONB DEFAULT '[]',
  pinned BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  semester_active INTEGER DEFAULT 1,
  attendance_target INTEGER DEFAULT 75,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_before_deadline INTEGER DEFAULT 24,
  language VARCHAR(10) DEFAULT 'id',
  theme VARCHAR(20) DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FILES TABLE
-- ============================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  size BIGINT,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_subjects_user ON subjects(user_id);
CREATE INDEX idx_subjects_semester ON subjects(semester);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_subject ON tasks(subject_id);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_subject ON attendance(subject_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_subject ON notes(subject_id);
CREATE INDEX idx_notes_pinned ON notes(pinned);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_files_subject ON files(subject_id);

-- ============================================
-- USER DATA TABLE (cross-device sync blob)
-- ============================================
CREATE TABLE user_data (
  user_email VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User data upsert own" ON user_data
  FOR ALL USING (auth.jwt() ->> 'email' = user_email);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users access own data" ON users
  FOR ALL USING (id = auth.uid());

CREATE POLICY "Subjects access own" ON subjects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Tasks access own" ON tasks
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Attendance access own" ON attendance
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Schedules access own" ON schedules
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Notes access own" ON notes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Notifications access own" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Settings access own" ON settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Files access own" ON files
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Events access own" ON events
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
