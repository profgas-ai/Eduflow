import { CONFIG } from '../config/config.js';
import { loadData, saveData, getData, persist } from './storage.js';

export class Database {
  constructor() {
    this.supabase = null;
    this.ready = false;
  }

  async init() {
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        this.ready = true;
        console.log('Supabase connected');
      } catch (e) {
        console.warn('Supabase init failed, using localStorage:', e.message);
      }
    }
  }

  isOnline() {
    return this.ready && this.supabase;
  }

  async query(table, options = {}) {
    if (this.isOnline()) {
      try {
        let query = this.supabase.from(table).select(options.select || '*');
        if (options.filter) {
          options.filter.forEach(f => {
            query = query.filter(f.column, f.operator, f.value);
          });
        }
        if (options.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
        }
        if (options.limit) {
          query = query.limit(options.limit);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn(`Query ${table} from Supabase failed, falling back to localStorage:`, e.message);
      }
    }
    return this._localQuery(table, options);
  }

  async insert(table, records) {
    if (this.isOnline()) {
      try {
        const { data, error } = await this.supabase.from(table).insert(records).select();
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn(`Insert into ${table} failed:`, e.message);
      }
    }
    return this._localInsertUpdate(table, records);
  }

  async update(table, match, values) {
    if (this.isOnline()) {
      try {
        const { data, error } = await this.supabase.from(table).update(values).match(match).select();
        if (error) throw error;
        return data;
      } catch (e) {
        console.warn(`Update ${table} failed:`, e.message);
      }
    }
    return this._localInsertUpdate(table, values, match);
  }

  async delete(table, match) {
    if (this.isOnline()) {
      try {
        const { error } = await this.supabase.from(table).delete().match(match);
        if (error) throw error;
      } catch (e) {
        console.warn(`Delete from ${table} failed:`, e.message);
      }
    }
    this._localDelete(table, match);
  }

  _localInsertUpdate(table, records, match = null) {
    const data = getData();
    const key = this._mapTable(table);
    if (!key) return null;
    data[key] = data[key] || [];
    if (Array.isArray(records)) {
      if (match && match.id) {
        const idx = data[key].findIndex(r => r.id === match.id);
        if (idx >= 0) {
          data[key][idx] = { ...data[key][idx], ...records[0] };
        } else {
          data[key].push(records[0]);
        }
      } else {
        data[key].push(...records);
      }
    } else if (match && match.id) {
      const idx = data[key].findIndex(r => r.id === match.id);
      if (idx >= 0) {
        data[key][idx] = { ...data[key][idx], ...records };
      } else {
        data[key].push(records);
      }
    } else {
      data[key].push(records);
    }
    persist();
    return [records].flat();
  }

  _localDelete(table, match) {
    if (!match || !match.id) return;
    const data = getData();
    const key = this._mapTable(table);
    if (!key) return;
    data[key] = (data[key] || []).filter(r => r.id !== match.id);
    persist();
  }

  _mapTable(table) {
    const map = {
      users: 'user',
      subjects: 'subjects',
      tasks: 'tasks',
      attendance: 'attendanceRecords',
      schedules: 'schedules',
      notes: 'notes',
      notifications: 'notifications',
      events: 'events',
      files: 'files',
    };
    return map[table];
  }

  _localQuery(table, options = {}) {
    const data = getData();
    const key = this._mapTable(table);
    if (!key) return [];
    let results = data[key];
    if (!results) return [];
    if (Array.isArray(results)) {
      if (options.filter) {
        options.filter.forEach(f => {
          results = results.filter(item => item[f.column] === f.value);
        });
      }
      if (options.order) {
        results = [...results].sort((a, b) => {
          const aVal = a[options.order.column];
          const bVal = b[options.order.column];
          if (aVal < bVal) return options.order.ascending ?? true ? -1 : 1;
          if (aVal > bVal) return options.order.ascending ?? true ? 1 : -1;
          return 0;
        });
      }
      if (options.limit) {
        results = results.slice(0, options.limit);
      }
    } else {
      return [results].filter(Boolean);
    }
    return results;
  }
}

export const db = new Database();
