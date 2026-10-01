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

/**
 * Helper to get refined category display label for product cards.
 * Prevents displaying generic composite strings like "Capelete e Tortéi",
 * dynamically resolving to "Capelete" or "Tortéi" according to the product title.
 */
export const getProductCategoryDisplayLabel = (
  productName: string,
  categoryId: string,
  rawCategoryName?: string
): string => {
  const catName = rawCategoryName || '';
  const nameLower = (productName || '').toLowerCase();
  const catLower = catName.toLowerCase();

  // Specifically handle Capelete and Tortéi composite category
  if (
    categoryId === 'capelete-tortei' ||
    categoryId === 'capelete_tortei' ||
    (catLower.includes('capelet') && catLower.includes('tort'))
  ) {
    if (nameLower.includes('torté') || nameLower.includes('tortei') || nameLower.includes('tort')) {
      return 'Tortéi';
    }
    if (nameLower.includes('capelet')) {
      return 'Capelete';
    }
    return 'Capelete';
  }

  // Handle composite categories with " e " or "/"
  if (catName.includes(' e ') || catName.includes(' / ')) {
    const parts = catName.split(/\s+e\s+|\s*\/\s*/i);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && nameLower.includes(trimmed.toLowerCase())) {
        return trimmed;
      }
    }
  }

  return catName || categoryId;
};
