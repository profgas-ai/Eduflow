import { CONFIG } from '../config/config.js';
import { getData, persist } from './storage.js';
import { getSupabaseClient } from './supabase.js';

function _hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h' + Math.abs(hash).toString(36);
}

export class AuthService {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.listeners = [];
  }

  async init() {
    this.supabase = await getSupabaseClient();
    if (this.supabase) {
      try {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
          this.currentUser = session.user;
        }
        this.supabase.auth.onAuthStateChange((event, session) => {
          this.currentUser = session?.user || null;
          this._notify();
        });
      } catch (e) {
        console.warn('Supabase Auth init failed:', e.message);
      }
    }
    if (!this.currentUser) {
      const cached = localStorage.getItem('eduflow_user');
      if (cached) {
        try { this.currentUser = JSON.parse(cached); } catch {}
      }
    }
  }

  get user() {
    return this.currentUser;
  }

  get isAuthenticated() {
    return !!this.currentUser;
  }

  async login(email, password) {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this.currentUser = data.user;
      this._notify();
      return data.user;
    }
    const stored = JSON.parse(localStorage.getItem('eduflow_credentials') || '{}');
    const entry = stored[email];
    if (!entry) throw new Error('Email tidak terdaftar');
    const hash = typeof entry === 'string' ? entry : entry.hash;
    const name = typeof entry === 'string' ? undefined : entry.name;
    if (hash !== _hashPassword(password)) throw new Error('Password salah');
    const data = getData();
    data.user.email = email;
    data.user.name = name || email.split('@')[0];
    persist();
    this.currentUser = { email, id: 'local', name: data.user.name };
    localStorage.setItem('eduflow_user', JSON.stringify(this.currentUser));
    this._notify();
    return this.currentUser;
  }

  async register(email, password, name) {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      this.currentUser = data.user;
      return data.user;
    }
    const creds = JSON.parse(localStorage.getItem('eduflow_credentials') || '{}');
    creds[email] = { hash: _hashPassword(password), name: name || email.split('@')[0] };
    localStorage.setItem('eduflow_credentials', JSON.stringify(creds));
    const data = getData();
    data.user.email = email;
    data.user.name = name || email.split('@')[0];
    persist();
    const user = { email, id: 'local', name: data.user.name };
    this.currentUser = user;
    localStorage.setItem('eduflow_user', JSON.stringify(user));
    return user;
  }

  async logout() {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.currentUser = null;
    localStorage.removeItem('eduflow_user');
    this._notify();
  }

  async resetPassword(email) {
    if (this.supabase) {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    }
    return true;
  }

  async updateProfile(updates) {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.updateUser({ data: updates });
      if (error) throw error;
    }
    const data = getData();
    Object.assign(data.user, updates);
    persist();
    return data.user;
  }

  async uploadAvatar(file) {
    if (this.supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${this.currentUser.id}_${Date.now()}.${fileExt}`;
      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      await this.updateProfile({ avatar: publicUrl });
      return publicUrl;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = getData();
        data.user.avatar = reader.result;
        persist();
        resolve(reader.result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  _notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const auth = new AuthService();
