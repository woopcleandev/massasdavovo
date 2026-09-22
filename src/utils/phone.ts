/**
 * Phone number normalization utilities for Brazil (DDD + 8 or 9 digits)
 */

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  // Remove country code 55 if present and length >= 12 (e.g. 5566996523006 -> 66996523006)
  if (digits.startsWith('55') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits;
}

export function formatWhatsappDisplay(phone: string): string {
  const digits = normalizePhoneNumber(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function arePhonesEqual(phone1: string, phone2: string): boolean {
  const p1 = normalizePhoneNumber(phone1);
  const p2 = normalizePhoneNumber(phone2);
  if (!p1 || !p2) return false;
  if (p1 === p2) return true;
  // If one has 9 digits without DDD and other has DDD
  if (p1.length >= 8 && p2.length >= 8) {
    if (p1.endsWith(p2) || p2.endsWith(p1)) return true;
  }
  return false;
}
