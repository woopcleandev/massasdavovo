/**
 * Date & Time Utilities for Massas da Vovó
 * Ensures valid, exact timestamps (DD/MM/AAAA às HH:mm:ss or HH:mm) with robust parsing
 */

const parseToDate = (value?: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    if ('seconds' in value && typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return !isNaN(d.getTime()) ? d : null;
    }
    if ('_seconds' in value && typeof value._seconds === 'number') {
      const d = new Date(value._seconds * 1000);
      return !isNaN(d.getTime()) ? d : null;
    }
  }
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
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
