import { CONFIG } from '../config/config.js';
import { getData, persist } from './storage.js';

export class AuthService {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.listeners = [];
  }

  async init() {
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
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
    const data = getData();
    data.user.email = email;
    data.user.name = email.split('@')[0];
    persist();
    this.currentUser = { email, id: 'local' };
    this._notify();
    return this.currentUser;
  }

  async register(email, password, name) {
    if (this.supabase) {
      const { data, error } = await this.supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      return data.user;
    }
    const data = getData();
    data.user.email = email;
    data.user.name = name || email.split('@')[0];
    persist();
    return { email, id: 'local' };
  }

  async logout() {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    this.currentUser = null;
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
    const data = getData();
    data.user.avatar = URL.createObjectURL(file);
    persist();
    return data.user.avatar;
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
