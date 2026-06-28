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
  if (value && Number(value) < min) return `${fieldName} minimal ${min}`;
  return null;
}

export function max(value, max, fieldName = 'Field') {
  if (value && Number(value) > max) return `${fieldName} maksimal ${max}`;
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

export function validateForm(rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator(value => value, field);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
