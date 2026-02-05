import { describe, it, expect } from 'vitest';
import {
  between,
  initial,
  after,
  before,
  initialBatch,
  needsRebalancing,
  rebalance,
  isValid,
  compare,
} from '../src/lexorank.js';

describe('initial', () => {
  it('generates a non-empty rank', () => {
    const rank = initial();
    expect(rank).toBeTruthy();
    expect(rank.length).toBeGreaterThan(0);
  });

  it('generates a valid rank', () => {
    expect(isValid(initial())).toBe(true);
  });
});

describe('after', () => {
  it('generates a rank greater than the input', () => {
    const first = initial();
    const second = after(first);
    expect(second > first).toBe(true);
  });

  it('works on empty string', () => {
    const rank = after('');
    expect(rank).toBe(initial());
  });

  it('increments last character when possible', () => {
    const rank = after('V');
    expect(rank > 'V').toBe(true);
  });

  it('handles max character correctly', () => {
    const rank = after('z');
    expect(rank > 'z').toBe(true);
    expect(isValid(rank)).toBe(true);
  });

  it('handles string of max characters', () => {
    const rank = after('zzz');
    expect(rank > 'zzz').toBe(true);
    expect(isValid(rank)).toBe(true);
  });

  it('can chain multiple times', () => {
    let rank = initial();
    const ranks = [rank];
    for (let i = 0; i < 10; i++) {
      rank = after(rank);
      ranks.push(rank);
    }
    // Verify strictly increasing
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
  });
});

describe('before', () => {
  it('generates a rank less than the input', () => {
    const first = initial();
    const zeroth = before(first);
    expect(zeroth < first).toBe(true);
  });

  it('works on empty string', () => {
    const rank = before('');
    expect(rank).toBe(initial());
  });

  it('handles min character correctly', () => {
    const rank = before('0');
    expect(rank < '0').toBe(true);
    expect(isValid(rank)).toBe(true);
  });

  it('handles string of min characters', () => {
    const rank = before('000');
    expect(rank < '000').toBe(true);
    expect(isValid(rank)).toBe(true);
  });

  it('can chain multiple times', () => {
    let rank = initial();
    const ranks = [rank];
    for (let i = 0; i < 10; i++) {
      rank = before(rank);
      ranks.unshift(rank);
    }
    // Verify strictly increasing
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
  });
});

describe('between', () => {
  it('generates a rank between two values', () => {
    const a = 'A';
    const b = 'Z';
    const mid = between(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
  });

  it('handles empty first argument', () => {
    const b = 'M';
    const rank = between('', b);
    expect(rank < b).toBe(true);
  });

  it('handles empty second argument', () => {
    const a = 'M';
    const rank = between(a, '');
    expect(rank > a).toBe(true);
  });

  it('handles both empty arguments', () => {
    const rank = between('', '');
    expect(rank).toBe(initial());
  });

  it('throws when a >= b', () => {
    expect(() => between('Z', 'A')).toThrow();
    expect(() => between('M', 'M')).toThrow();
  });

  it('handles adjacent characters', () => {
    const a = 'A';
    const b = 'B';
    const mid = between(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
    expect(isValid(mid)).toBe(true);
  });

  it('handles complex adjacent strings', () => {
    const a = 'Vzzz';
    const b = 'W';
    const mid = between(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
    expect(isValid(mid)).toBe(true);
  });

  it('can find midpoint between initial and after', () => {
    const a = initial();
    const b = after(a);
    const mid = between(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
  });

  it('can repeatedly split without collisions', () => {
    let a = 'A';
    let b = 'B';
    const mids = [];
    
    for (let i = 0; i < 20; i++) {
      const mid = between(a, b);
      mids.push(mid);
      expect(mid > a).toBe(true);
      expect(mid < b).toBe(true);
      b = mid; // Keep subdividing lower half
    }
    
    // All midpoints should be unique
    const uniqueMids = new Set(mids);
    expect(uniqueMids.size).toBe(mids.length);
  });
});

describe('initialBatch', () => {
  it('returns empty array for count <= 0', () => {
    expect(initialBatch(0)).toEqual([]);
    expect(initialBatch(-1)).toEqual([]);
  });

  it('returns single initial for count = 1', () => {
    const ranks = initialBatch(1);
    expect(ranks.length).toBe(1);
    expect(ranks[0]).toBe(initial());
  });

  it('returns evenly spaced ranks', () => {
    const ranks = initialBatch(5);
    expect(ranks.length).toBe(5);
    
    // Should be sorted
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
  });

  it('all ranks are valid', () => {
    const ranks = initialBatch(10);
    for (const rank of ranks) {
      expect(isValid(rank)).toBe(true);
    }
  });
});

describe('needsRebalancing', () => {
  it('returns false for short ranks', () => {
    expect(needsRebalancing('V')).toBe(false);
    expect(needsRebalancing('VVVVV')).toBe(false);
  });

  it('returns true for very long ranks', () => {
    const longRank = 'V'.repeat(51);
    expect(needsRebalancing(longRank)).toBe(true);
  });
});

describe('rebalance', () => {
  it('handles empty array', () => {
    expect(rebalance([])).toEqual([]);
  });

  it('handles single item', () => {
    const result = rebalance(['Vzzzzzzz']);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(initial());
  });

  it('rebalances multiple items to shorter ranks', () => {
    const longRanks = ['AAAAAA', 'MMMMMM', 'ZZZZZZ'];
    const result = rebalance(longRanks);
    
    expect(result.length).toBe(3);
    
    // All should be shorter (single char in this case)
    for (const rank of result) {
      expect(rank.length).toBeLessThanOrEqual(1);
    }
    
    // Should maintain order
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true);
    }
  });
});

describe('isValid', () => {
  it('accepts empty string', () => {
    expect(isValid('')).toBe(true);
  });

  it('accepts valid characters', () => {
    expect(isValid('0123456789')).toBe(true);
    expect(isValid('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe(true);
    expect(isValid('abcdefghijklmnopqrstuvwxyz')).toBe(true);
    expect(isValid('aA0zZ9')).toBe(true);
    expect(isValid('-./0_')).toBe(true); // Extended charset chars
  });

  it('rejects invalid characters', () => {
    expect(isValid('!')).toBe(false);
    expect(isValid(' ')).toBe(false);
    expect(isValid('@')).toBe(false);
    expect(isValid('hello#world')).toBe(false);
  });
});

describe('compare', () => {
  it('returns negative when a < b', () => {
    expect(compare('A', 'B')).toBeLessThan(0);
    expect(compare('AA', 'AB')).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compare('B', 'A')).toBeGreaterThan(0);
    expect(compare('AB', 'AA')).toBeGreaterThan(0);
  });

  it('returns zero when equal', () => {
    expect(compare('A', 'A')).toBe(0);
    expect(compare('VVV', 'VVV')).toBe(0);
  });
});

describe('integration: simulated kanban board', () => {
  it('handles typical drag-and-drop scenarios', () => {
    // Start with 3 items
    const [task1, task2, task3] = initialBatch(3);
    
    // Verify order
    expect(task1 < task2).toBe(true);
    expect(task2 < task3).toBe(true);
    
    // Move task3 between task1 and task2
    const newRank = between(task1, task2);
    expect(newRank > task1).toBe(true);
    expect(newRank < task2).toBe(true);
    
    // Move something to the beginning
    const newFirst = before(task1);
    expect(newFirst < task1).toBe(true);
    
    // Move something to the end
    const newLast = after(task3);
    expect(newLast > task3).toBe(true);
  });

  it('handles many insertions at same position', () => {
    // Simulate repeatedly inserting at the same position
    let ranks = [initial()];
    
    for (let i = 0; i < 50; i++) {
      // Always insert at beginning
      const newRank = before(ranks[0]);
      ranks.unshift(newRank);
      
      // Verify still sorted
      for (let j = 1; j < ranks.length; j++) {
        expect(ranks[j] > ranks[j - 1]).toBe(true);
      }
    }
    
    // Check if rebalancing is needed
    const needsIt = ranks.some(needsRebalancing);
    console.log(`After 50 prepends, longest rank: ${Math.max(...ranks.map(r => r.length))}`);
    
    if (needsIt) {
      ranks = rebalance(ranks);
      // Verify still sorted after rebalancing
      for (let j = 1; j < ranks.length; j++) {
        expect(ranks[j] > ranks[j - 1]).toBe(true);
      }
    }
  });
});

describe('stress test', () => {
  it('handles 1000 random insertions', () => {
    const ranks: string[] = [initial()];
    
    for (let i = 0; i < 1000; i++) {
      const operation = Math.random();
      
      if (operation < 0.33) {
        // Insert at beginning
        ranks.unshift(before(ranks[0]));
      } else if (operation < 0.66) {
        // Insert at end
        ranks.push(after(ranks[ranks.length - 1]));
      } else {
        // Insert between two random adjacent items
        if (ranks.length >= 2) {
          const idx = Math.floor(Math.random() * (ranks.length - 1));
          const newRank = between(ranks[idx], ranks[idx + 1]);
          ranks.splice(idx + 1, 0, newRank);
        }
      }
    }
    
    // Verify all ranks are valid and sorted
    for (const rank of ranks) {
      expect(isValid(rank)).toBe(true);
    }
    
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i] > ranks[i - 1]).toBe(true);
    }
    
    console.log(`After 1000 random operations:`);
    console.log(`  Total items: ${ranks.length}`);
    console.log(`  Longest rank: ${Math.max(...ranks.map(r => r.length))}`);
    console.log(`  Shortest rank: ${Math.min(...ranks.map(r => r.length))}`);
  });
});
