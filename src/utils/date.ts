/**
 * Date & Time Utilities for Massas da Vovó
 * Ensures valid, exact timestamps (DD/MM/AAAA às HH:mm:ss or HH:mm) with robust parsing
 */

export const parseToDate = (value?: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        const d = value.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    if (typeof value._seconds === 'number') {
      const d = new Date(value._seconds * 1000);
      if (!isNaN(d.getTime())) return d;
    }
    if (value.createdAt) {
      const d = parseToDate(value.createdAt);
      if (d) return d;
    }
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null' || trimmed.startsWith('--/--')) {
      return null;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export const formatExactDateTime = (value?: any): string => {
  const d = parseToDate(value);
  if (!d) return '--/--/---- às --:--';

  try {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
  } catch {
    return '--/--/---- às --:--';
  }
};

export const formatShortDateTime = (value?: any): string => {
  const d = parseToDate(value);
  if (!d) return '--/-- --:--';

  try {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month} às ${hours}:${minutes}`;
  } catch {
    return '--/-- --:--';
  }
};

export const formatTimeOnly = (value?: any): string => {
  const d = parseToDate(value);
  if (!d) return '--:--';

  try {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return '--:--';
  }
};

export const formatDateOnly = (value?: any): string => {
  const d = parseToDate(value);
  if (!d) return '--/--/----';

  try {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return '--/--/----';
  }
};
