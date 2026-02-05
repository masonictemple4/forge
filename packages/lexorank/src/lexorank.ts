/**
 * LexoRank - Fractional Indexing for O(1) list reordering
 * 
 * Uses an extended character set for compact, sortable strings.
 * This allows inserting items between any two existing items without
 * renumbering the entire list.
 */

// Extended character set: includes characters before '0' for headroom
// ASCII order: '-' (45) < '0' (48) < '9' (57) < 'A' (65) < 'Z' (90) < 'a' (97) < 'z' (122)
// We use: - . / 0-9 A-Z _ a-z (sorted by ASCII)
const CHARS = '-./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
const BASE = CHARS.length; // 66

// Precompute char to index map for O(1) lookups
const CHAR_TO_INDEX = new Map<string, number>();
for (let i = 0; i < CHARS.length; i++) {
  CHAR_TO_INDEX.set(CHARS[i], i);
}

// Default midpoint character (roughly middle of charset)
const MID_CHAR = CHARS[Math.floor(BASE / 2)]; // 'V'
const FIRST_CHAR = CHARS[0]; // '0'
const LAST_CHAR = CHARS[BASE - 1]; // 'z'

// Maximum rank length before suggesting rebalancing
const MAX_LENGTH = 50;

/**
 * Get the index of a character in our base-62 charset
 */
function charIndex(c: string): number {
  const idx = CHAR_TO_INDEX.get(c);
  if (idx === undefined) {
    throw new Error(`Invalid character in rank: ${c}`);
  }
  return idx;
}

/**
 * Get the character at a given index in our charset
 */
function indexChar(i: number): string {
  if (i < 0 || i >= BASE) {
    throw new Error(`Index out of range: ${i}`);
  }
  return CHARS[i];
}

/**
 * Get character at position, treating beyond-string as '0' (lowest)
 */
function charAt(s: string, pos: number): string {
  return pos < s.length ? s[pos] : FIRST_CHAR;
}

/**
 * Generate a rank string between two existing ranks.
 * 
 * @param a - Lower bound (empty string means "before everything")
 * @param b - Upper bound (empty string means "after everything")
 * @returns A string that sorts between a and b
 * @throws Error if a >= b when both are non-empty
 */
export function between(a: string, b: string): string {
  // Handle empty string cases
  if (a === '' && b === '') {
    return initial();
  }
  if (a === '') {
    return before(b);
  }
  if (b === '') {
    return after(a);
  }

  // Validate a < b
  if (a >= b) {
    throw new Error(`Invalid range: a (${a}) must be less than b (${b})`);
  }

  return midpoint(a, b);
}

/**
 * Find the lexicographic midpoint between two strings.
 * Assumes a < b.
 */
function midpoint(a: string, b: string): string {
  // Pad to same length for easier comparison
  const maxLen = Math.max(a.length, b.length);
  
  // Find first differing position
  let pos = 0;
  while (pos < maxLen) {
    const aIdx = pos < a.length ? charIndex(a[pos]) : 0;
    const bIdx = pos < b.length ? charIndex(b[pos]) : BASE - 1;
    
    if (aIdx !== bIdx) {
      // Found difference
      if (bIdx - aIdx > 1) {
        // Room between - take midpoint
        const midIdx = Math.floor((aIdx + bIdx) / 2);
        return a.slice(0, pos) + indexChar(midIdx);
      }
      
      // Adjacent characters - need to go deeper
      // Take the lower char and find space in next position
      const prefix = a.slice(0, pos) + indexChar(aIdx);
      
      // Get the suffix starting positions
      const aSuffix = pos + 1 < a.length ? charIndex(a[pos + 1]) : 0;
      const bSuffix = BASE - 1; // Since we're taking aIdx, we have full range above aSuffix
      
      if (bSuffix - aSuffix > 1) {
        const midSuffix = Math.floor((aSuffix + bSuffix) / 2);
        return prefix + indexChar(midSuffix);
      }
      
      // Still adjacent, recurse deeper
      const aRest = pos + 1 < a.length ? a.slice(pos + 1) : FIRST_CHAR;
      const bRest = LAST_CHAR;
      
      return prefix + midpoint(aRest, bRest);
    }
    pos++;
  }
  
  // Strings are equal (shouldn't happen if a < b)
  throw new Error(`Cannot find midpoint: strings are equal`);
}

/**
 * Generate the initial rank for an empty list.
 * Uses the middle of the range for maximum flexibility.
 */
export function initial(): string {
  return MID_CHAR;
}

/**
 * Generate a rank after the given rank.
 * 
 * @param rank - The rank to come after
 * @returns A string that sorts after rank
 */
export function after(rank: string): string {
  if (rank === '') {
    return initial();
  }

  // Strategy: try to increment the last character
  // If it's at max, append midpoint
  
  const lastIdx = charIndex(rank[rank.length - 1]);
  
  if (lastIdx < BASE - 1) {
    // Increment the last character
    return rank.slice(0, -1) + indexChar(lastIdx + 1);
  }
  
  // Last char is 'z', need to go up a level or append
  // Find rightmost character that isn't 'z'
  let i = rank.length - 1;
  while (i >= 0 && charIndex(rank[i]) === BASE - 1) {
    i--;
  }
  
  if (i >= 0) {
    // Increment this character and truncate
    return rank.slice(0, i) + indexChar(charIndex(rank[i]) + 1);
  }
  
  // All characters are 'z', append midpoint
  return rank + MID_CHAR;
}

/**
 * Generate a rank before the given rank.
 * 
 * @param rank - The rank to come before
 * @returns A string that sorts before rank
 */
export function before(rank: string): string {
  if (rank === '') {
    return initial();
  }

  // Strategy: find space to the left of rank
  // We generate a string between FIRST_CHAR (minimum) and rank
  
  const firstIdx = charIndex(rank[0]);
  
  if (firstIdx > 1) {
    // Room to decrement first character
    return indexChar(firstIdx - 1);
  }
  
  if (firstIdx === 1) {
    // Would go to minimum char, add suffix for room
    return FIRST_CHAR + MID_CHAR;
  }
  
  // First char is already minimum, need to go deeper
  // Find the midpoint between rank and a string of all minimums
  if (rank.length === 1) {
    // rank is just the minimum char, prefix doesn't work
    // Return minimum + midpoint
    return FIRST_CHAR + MID_CHAR;
  }
  
  // Find position where we can decrement
  for (let i = 1; i < rank.length; i++) {
    const idx = charIndex(rank[i]);
    if (idx > 1) {
      // Found room - decrement this position
      return rank.slice(0, i) + indexChar(idx - 1);
    } else if (idx === 1) {
      // Would go to 0, add midpoint after
      return rank.slice(0, i) + FIRST_CHAR + MID_CHAR;
    }
    // idx === 0, continue to next position
  }
  
  // All characters are minimum, append midpoint
  return rank + MID_CHAR;
}

/**
 * Generate multiple evenly-spaced initial ranks.
 * Useful for bulk-inserting items into an empty list.
 * 
 * @param count - Number of ranks to generate
 * @returns Array of ranks in sorted order
 */
export function initialBatch(count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return [initial()];
  
  const ranks: string[] = [];
  const step = Math.floor(BASE / (count + 1));
  
  for (let i = 1; i <= count; i++) {
    const idx = Math.min(step * i, BASE - 1);
    ranks.push(indexChar(idx));
  }
  
  return ranks;
}

/**
 * Check if a rank needs rebalancing (has grown too long).
 * 
 * @param rank - The rank to check
 * @returns true if the rank exceeds the recommended max length
 */
export function needsRebalancing(rank: string): boolean {
  return rank.length > MAX_LENGTH;
}

/**
 * Rebalance a list of ranks to use shorter, evenly-spaced values.
 * Call this when ranks have grown too long due to many insertions.
 * 
 * @param ranks - Current ranks in sorted order
 * @returns New ranks array with shorter, evenly-spaced values
 */
export function rebalance(ranks: string[]): string[] {
  if (ranks.length === 0) return [];
  if (ranks.length === 1) return [initial()];
  
  return initialBatch(ranks.length);
}

/**
 * Validate that a rank string contains only valid characters.
 * 
 * @param rank - The rank to validate
 * @returns true if valid
 */
export function isValid(rank: string): boolean {
  if (rank === '') return true;
  for (const c of rank) {
    if (!CHAR_TO_INDEX.has(c)) {
      return false;
    }
  }
  return true;
}

/**
 * Compare two ranks.
 * 
 * @returns negative if a < b, positive if a > b, zero if equal
 */
export function compare(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
