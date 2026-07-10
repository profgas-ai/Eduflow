export function required(value, fieldName = 'Field') {
  if (value === null || value === undefined) return `${fieldName} wajib diisi`;
  if (typeof value === 'string' && !value.trim()) return `${fieldName} wajib diisi`;
  return null;
}

export function email(value) {
  if (!value) return null;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(value)) return 'Format email tidak valid';
  return null;
}

export function minLength(value, min, fieldName = 'Field') {
  if (value && value.length < min) return `${fieldName} minimal ${min} karakter`;
  return null;
}

export function maxLength(value, max, fieldName = 'Field') {
  if (value && value.length > max) return `${fieldName} maksimal ${max} karakter`;
  return null;
}

export function number(value, fieldName = 'Field') {
  if (value && isNaN(Number(value))) return `${fieldName} harus berupa angka`;
  return null;
}

export function min(value, min, fieldName = 'Field') {
  if (value !== null && value !== undefined && value !== '' && Number(value) < min) return `${fieldName} minimal ${min}`;
  return null;
}

export function max(value, max, fieldName = 'Field') {
  if (value !== null && value !== undefined && value !== '' && Number(value) > max) return `${fieldName} maksimal ${max}`;
  return null;
}

export function url(value) {
  if (!value) return null;
  try {
    new URL(value);
    return null;
  } catch {
    return 'URL tidak valid';
  }
}

export function alphaNumeric(value, fieldName = 'Field') {
  if (value && !/^[a-zA-Z0-9\s]+$/.test(value)) return `${fieldName} hanya boleh huruf dan angka`;
  return null;
}

export function noLeadingTrailingSpace(value, fieldName = 'Field') {
  if (value && (value.startsWith(' ') || value.endsWith(' '))) return `${fieldName} tidak boleh diawali/diakhiri spasi`;
  return null;
}

export function unique(value, list, fieldName = 'Field') {
  if (list && list.some(item => item.toLowerCase() === value.toLowerCase())) return `${fieldName} sudah ada`;
  return null;
}

export function validateForm(rules, data = {}) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      let fn = validator;
      let args = [];
      if (Array.isArray(validator)) {
        fn = validator[0];
        args = validator.slice(1);
      }
      const value = data[field];
      const error = fn(value, ...args, field);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
