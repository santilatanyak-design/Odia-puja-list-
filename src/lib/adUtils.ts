/**
 * Smart Affiliate Ad Utilities: Robust matching, normalization, and debugging.
 */

export interface NormalizedMatchResult {
  found: boolean;
  before: string;
  match: string;
  after: string;
}

/**
 * Normalizes text by removing HTML tags, non-breaking/zero-width spaces,
 * standardizing unicode NFC representation, and collapsing whitespace.
 */
export function normalizeTextForSearch(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ') // Zero-width & NBSP
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”।॥\n\r\t]/g, ' ') // Strip punctuation
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Robustly finds trigger text within a given string, handling HTML, punctuation,
 * case variations, and Unicode differences.
 */
export function findTriggerInText(
  sourceText: string,
  triggerText: string
): NormalizedMatchResult {
  if (!sourceText || !triggerText || !triggerText.trim()) {
    return { found: false, before: sourceText || '', match: '', after: '' };
  }

  const raw = sourceText.normalize('NFC');
  const target = triggerText.trim().normalize('NFC');

  // 1. Direct Case-Insensitive Index Search
  const lowerRaw = raw.toLowerCase();
  const lowerTarget = target.toLowerCase();
  const directIdx = lowerRaw.indexOf(lowerTarget);

  if (directIdx !== -1) {
    return {
      found: true,
      before: raw.slice(0, directIdx),
      match: raw.slice(directIdx, directIdx + target.length),
      after: raw.slice(directIdx + target.length),
    };
  }

  // 2. Token-level normalized fuzzy search (in case punctuation is attached)
  const normalizedTarget = normalizeTextForSearch(target);
  if (!normalizedTarget) {
    return { found: false, before: raw, match: '', after: '' };
  }

  // Search words in the raw string
  const words = raw.split(/(\s+)/);
  let accumulated = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const normWord = normalizeTextForSearch(word);
    if (normWord && (normWord === normalizedTarget || normWord.includes(normalizedTarget) || normalizedTarget.includes(normWord))) {
      // Found the matching word slice
      const before = accumulated;
      const match = word;
      const after = words.slice(i + 1).join('');
      return {
        found: true,
        before,
        match,
        after,
      };
    }
    accumulated += word;
  }

  return { found: false, before: raw, match: '', after: '' };
}

/**
 * Diagnostic logger for Affiliate Ad data
 */
export function logAffiliateDebug(
  context: string,
  data: {
    storyOrDistrictId?: string;
    triggerText?: string;
    timerSeconds?: number;
    imageUrl?: string;
    link?: string;
    productTitle?: string;
    elementFoundInDom?: boolean;
    reason?: string;
  }
) {
  const isFound = data.elementFoundInDom;
  console.groupCollapsed(
    `%c[Affiliate Ad Debug] %c${context} %c${isFound ? '✅ Element Found' : '⚠️ Fallback Active'}`,
    'color: #d97706; font-weight: bold;',
    'color: #1e293b; font-weight: bold;',
    isFound ? 'color: #16a34a; font-weight: bold;' : 'color: #dc2626; font-weight: bold;'
  );
  console.log('📌 Story/District ID:', data.storyOrDistrictId || 'N/A');
  console.log('🎯 Trigger Keyword (adTriggerText):', data.triggerText ? `"${data.triggerText}"` : 'None provided');
  console.log('⏱️ Timer Seconds (adTimerSeconds):', data.timerSeconds || 5);
  console.log('🖼️ Product Image URL (adImageUrl):', data.imageUrl || 'MISSING');
  console.log('🔗 Affiliate Link (adLink):', data.link || 'MISSING');
  console.log('📦 Product Title (productTitle):', data.productTitle || 'None');
  console.log('🔍 Element #ad-trigger-word in DOM:', isFound ? 'FOUND in DOM' : 'NOT FOUND in DOM');
  if (data.reason) {
    console.log('ℹ️ Status / Action:', data.reason);
  }
  console.groupEnd();
}
