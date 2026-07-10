import { getData, saveData, persist } from './storage.js';
import { deepClone } from '../utils/helper.js';

class UndoManager {
  constructor() {
    this.stack = [];
    this.maxSize = 20;
  }

  push(snapshot, label) {
    this.stack.push({ data: deepClone(snapshot), label, timestamp: Date.now() });
    if (this.stack.length > this.maxSize) this.stack.shift();
  }

  pop() {
    return this.stack.pop() || null;
  }

  peek() {
    return this.stack[this.stack.length - 1] || null;
  }

  undo(label) {
    const entry = this.pop();
    if (!entry) return null;
    const data = getData();
    saveData(entry.data);
    persist();
    return entry;
  }

  clear() {
    this.stack = [];
  }
}

export const undoManager = new UndoManager();
