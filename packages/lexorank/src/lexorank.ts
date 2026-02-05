/**
 * LexoRank - Fractional Indexing for O(1) list reordering
 * 
 * Uses base-62 characters (0-9, A-Z, a-z) for compact, sortable strings.
 * This allows inserting items between any two existing items without
 * renumbering the entire list.
 */

// Base-62 character set for maximum density while remaining URL-safe
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = CHARS.length; // 62

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

  // Find the first position where they differ
  let pos = 0;
  while (pos < a.length && pos < b.length && a[pos] === b[pos]) {
    pos++;
  }

  // Get the characters at the differing position
  const aChar = charAt(a, pos);
  const bChar = charAt(b, pos);
  const aIdx = charIndex(aChar);
  const bIdx = charIndex(bChar);

  // If there's room between the characters, use the midpoint
  if (bIdx - aIdx > 1) {
    const midIdx = Math.floor((aIdx + bIdx) / 2);
    return a.slice(0, pos) + indexChar(midIdx);
  }

  // Characters are adjacent (e.g., 'a' and 'b')
  // We need to go deeper into 'a' to find space
  
  // Strategy: append midpoint character to 'a'
  // But first, we need to find the longest common prefix that still leaves room
  
  // If a has more characters, we need to find a suffix position
  if (pos < a.length) {
    // Look for a position in 'a' where we can increment
    let i = a.length - 1;
    while (i > pos) {
      const cIdx = charIndex(a[i]);
      if (cIdx < BASE - 1) {
        // We can increment here and potentially truncate
        // But we need to ensure we're still < b
        const candidate = a.slice(0, i) + indexChar(cIdx + 1);
        if (candidate < b) {
          return candidate;
        }
      }
      i--;
    }
    // No room found, append midpoint
    return a + MID_CHAR;
  }

  // a is shorter than or equal length to the common prefix
  // Just append midpoint
  return a.slice(0, pos + 1) + MID_CHAR;
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

  // Strategy: try to decrement the last character
  // If it would result in a '0' suffix, we can often truncate
  
  const lastIdx = charIndex(rank[rank.length - 1]);
  
  if (lastIdx > 1) {
    // Decrement the last character (leaving room above '0')
    return rank.slice(0, -1) + indexChar(lastIdx - 1);
  }
  
  if (lastIdx === 1) {
    // Would become '0', but we want to leave room
    // Append midpoint to the decremented version
    return rank.slice(0, -1) + FIRST_CHAR + MID_CHAR;
  }
  
  // Last char is '0', find rightmost non-'0' character
  let i = rank.length - 1;
  while (i >= 0 && charIndex(rank[i]) === 0) {
    i--;
  }
  
  if (i >= 0) {
    // Decrement this character and append midpoint
    return rank.slice(0, i) + indexChar(charIndex(rank[i]) - 1) + MID_CHAR;
  }
  
  // All characters are '0' (which shouldn't normally happen)
  // Go to a smaller prefix
  return FIRST_CHAR + MID_CHAR;
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
