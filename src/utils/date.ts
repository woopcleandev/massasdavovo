/**
 * Date & Time Utilities for Massas da Vovó
 * Ensures valid, exact timestamps (DD/MM/AAAA às HH:mm:ss or HH:mm) with robust parsing
 */

export const formatExactDateTime = (value?: string | number | Date | null): string => {
  if (!value) return '--/--/---- às --:--';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
  } catch {
    return String(value);
  }
};

export const formatShortDateTime = (value?: string | number | Date | null): string => {
  if (!value) return '--/-- --:--';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month} às ${hours}:${minutes}`;
  } catch {
    return String(value);
  }
};

export const formatTimeOnly = (value?: string | number | Date | null): string => {
  if (!value) return '--:--';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  } catch {
    return String(value);
  }
};

export const formatDateOnly = (value?: string | number | Date | null): string => {
  if (!value) return '--/--/----';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(value);
  }
};
