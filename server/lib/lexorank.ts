/**
 * LexoRank - Fractional Indexing for O(1) Reordering
 * 
 * Instead of maintaining integer positions (which require O(N) updates when
 * reordering), we use string-based ranks that allow insertion between any
 * two values without updating other records.
 * 
 * Example: To insert between "a" and "b", we generate "an" (midpoint).
 * 
 * This implementation uses a base-26 alphabet for simplicity.
 * Production systems might use base-36 or larger for more granularity.
 */

// Character set for ranking (lowercase letters for simplicity)
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const MIN_CHAR = ALPHABET[0]; // 'a'
const MAX_CHAR = ALPHABET[ALPHABET.length - 1]; // 'z'
const MID_CHAR = ALPHABET[Math.floor(ALPHABET.length / 2)]; // 'm'

/**
 * Generate a rank for a new item at the end of a list
 */
export function generateRank(): string {
  // Start in the middle to allow insertions before and after
  return MID_CHAR;
}

/**
 * Generate a rank between two existing ranks
 * 
 * @param before - The rank of the item before (null if inserting at start)
 * @param after - The rank of the item after (null if inserting at end)
 * @returns A new rank string that sorts between before and after
 */
export function generateRankBetween(
  before: string | null,
  after: string | null
): string {
  // Inserting at the very beginning
  if (!before) {
    if (!after) {
      return MID_CHAR;
    }
    return decrementRank(after);
  }
  
  // Inserting at the very end
  if (!after) {
    return incrementRank(before);
  }
  
  // Inserting between two ranks
  return midpoint(before, after);
}

/**
 * Generate a rank that comes before the given rank
 */
function decrementRank(rank: string): string {
  // Try to find a midpoint between 'a' and the first char
  const firstChar = rank[0];
  const firstIndex = ALPHABET.indexOf(firstChar);
  
  if (firstIndex > 0) {
    // Can decrement the first character
    const midIndex = Math.floor(firstIndex / 2);
    return ALPHABET[midIndex] + (midIndex === 0 ? MID_CHAR : "");
  }
  
  // First char is 'a', prepend 'a' and use midpoint for rest
  return MIN_CHAR + midpoint(MIN_CHAR, rank.slice(1) || MAX_CHAR);
}

/**
 * Generate a rank that comes after the given rank
 */
function incrementRank(rank: string): string {
  const lastChar = rank[rank.length - 1];
  const lastIndex = ALPHABET.indexOf(lastChar);
  
  if (lastIndex < ALPHABET.length - 1) {
    // Can increment within current depth
    const midIndex = Math.floor((lastIndex + ALPHABET.length) / 2);
    return rank.slice(0, -1) + ALPHABET[midIndex];
  }
  
  // Last char is 'z', need to extend
  return rank + MID_CHAR;
}

/**
 * Find the midpoint between two rank strings
 */
function midpoint(before: string, after: string): string {
  // Pad strings to same length
  const maxLen = Math.max(before.length, after.length);
  const a = before.padEnd(maxLen, MIN_CHAR);
  const b = after.padEnd(maxLen, MAX_CHAR);
  
  // Convert to numbers, find midpoint, convert back
  let result = "";
  let carry = 0;
  
  for (let i = 0; i < maxLen; i++) {
    const aIndex = ALPHABET.indexOf(a[i]);
    const bIndex = ALPHABET.indexOf(b[i]);
    
    // Simple midpoint calculation
    const mid = Math.floor((aIndex + bIndex) / 2);
    result += ALPHABET[mid];
    
    // If we've diverged from 'before', we can stop
    if (mid > aIndex) {
      break;
    }
  }
  
  // If result equals before, we need more precision
  if (result === before) {
    result += MID_CHAR;
  }
  
  return result;
}

/**
 * Compare two ranks (for sorting)
 */
export function compareRanks(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Validate that a rank string is well-formed
 */
export function isValidRank(rank: string): boolean {
  if (!rank || rank.length === 0) return false;
  return [...rank].every((char) => ALPHABET.includes(char));
}
