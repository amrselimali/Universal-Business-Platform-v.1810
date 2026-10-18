/**
 * Arabic text normalization utility for Universal Business Platform
 * Unifies:
 * - (أ, إ, آ, ٱ) -> ا
 * - ة -> ه
 * - ى -> ي
 * - Removes Arabic diacritics (harakat/tashkeel)
 * - Removes tatweel / kashida (ـ)
 */

export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return '';

  return (
    text
      .toString()
      // Remove diacritics (tashkeel)
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove tatweel
      .replace(/\u0640/g, '')
      // Normalize Alef variants
      .replace(/[أإآٱ]/g, 'ا')
      // Normalize Ta Marbuta to Ha
      .replace(/ة/g, 'ه')
      // Normalize Ya / Alef Maksura
      .replace(/ى/g, 'ي')
      // Normalize Persian/Urdu Yeh and Kaf if any
      .replace(/ي/g, 'ي')
      .replace(/ك/g, 'ك')
      .trim()
      .toLowerCase()
  );
}

/**
 * Checks if search text matches the target string using normalized Arabic comparison.
 */
export function matchesArabicSearch(target: string | null | undefined, query: string | null | undefined): boolean {
  if (!query) return true;
  if (!target) return false;

  const normalizedTarget = normalizeArabic(target);
  const normalizedQuery = normalizeArabic(query);

  return normalizedTarget.includes(normalizedQuery);
}
