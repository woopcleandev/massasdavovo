/**
 * Universal Currency & Number Formatting for Massas da Vovó
 * 100% resilient against null, undefined, NaN or corrupted string values
 */

export const formatPrice = (value?: number | string | null): string => {
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (isNaN(num) || !isFinite(num)) {
    return 'R$ 0,00';
  }
  try {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } catch {
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }
};
