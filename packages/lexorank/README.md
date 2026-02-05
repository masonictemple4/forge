# @forge/lexorank

LexoRank implementation for O(1) list reordering. Perfect for drag-and-drop interfaces in Kanban boards, task lists, and any sortable collections.

## What is LexoRank?

LexoRank (Lexicographical Ranking) is a ranking system that uses strings instead of numbers. It allows you to insert items between any two existing items without renumbering the entire list.

```
Item A: "M"     →  Item A: "M"
Item B: "N"     →  Item C: "Mn"  ← inserted!
                   Item B: "N"
```

String comparison naturally maintains order, and you can always find a string between any two distinct strings.

## Installation

```bash
npm install @forge/lexorank
# or
pnpm add @forge/lexorank
```

## Usage

### Basic Operations

```typescript
import { initial, after, before, between } from '@forge/lexorank';

// Create first rank in an empty list
const first = initial(); // 'V'

// Add item after
const second = after(first); // 'W'

// Add item before
const zeroth = before(first); // 'U'

// Insert between two items
const middle = between(first, second); // 'Vo' or similar
```

### Bulk Initialization

```typescript
import { initialBatch } from '@forge/lexorank';

// Create 5 evenly-spaced ranks for a new list
const ranks = initialBatch(5);
// ['C', 'K', 'S', 'a', 'i'] or similar
```

### Rebalancing

After many insertions at the same position, ranks can grow long. Rebalance periodically:

```typescript
import { needsRebalancing, rebalance } from '@forge/lexorank';

// Check if any rank is too long
if (items.some(item => needsRebalancing(item.rank))) {
  const newRanks = rebalance(items.map(i => i.rank));
  // Update items with new ranks (requires updating all items)
}
```

## API Reference

### `initial(): string`
Generate the initial rank for an empty list.

### `after(rank: string): string`
Generate a rank that sorts after the given rank.

### `before(rank: string): string`
Generate a rank that sorts before the given rank.

### `between(a: string, b: string): string`
Generate a rank between two existing ranks.
- Pass `''` for `a` to get a rank before `b`
- Pass `''` for `b` to get a rank after `a`
- Throws if `a >= b` when both are non-empty

### `initialBatch(count: number): string[]`
Generate multiple evenly-spaced ranks for bulk initialization.

### `needsRebalancing(rank: string): boolean`
Check if a rank has grown too long (> 50 characters).

### `rebalance(ranks: string[]): string[]`
Generate new, shorter ranks for a list. Returns evenly-spaced values.

### `betweenBatch(a: string, b: string, count: number): string[]`
Generate N evenly-spaced ranks between two bounds. Useful for bulk insertions.

### `isValid(rank: string): boolean`
Check if a string contains only valid rank characters.

### `compare(a: string, b: string): number`
Compare two ranks. Returns negative if a < b, positive if a > b, zero if equal.

### `createComparator<T>(getRank: (item: T) => string): (a: T, b: T) => number`
Create a sort comparator function for use with `Array.sort()`.

```typescript
const tasks = [{ rank: 'Z' }, { rank: 'A' }];
tasks.sort(createComparator(t => t.rank));
// [{ rank: 'A' }, { rank: 'Z' }]
```

### `getCharset(): string`
Get the character set used for ranking.

### `getMaxLength(): number`
Get the recommended maximum rank length before rebalancing.

## Character Set

Uses an extended base-66 set: `-`, `.`, `/`, `0-9`, `A-Z`, `_`, `a-z`. This provides:
- URL-safe strings
- Case-sensitive sorting
- High density (66 options per character)
- Headroom below `0` for edge cases

## Why Not Use Numbers?

Floating point numbers have precision limits. After enough halvings, you run out of precision:

```javascript
// Float approach fails:
0.5 → 0.25 → 0.125 → ... → 0.00000000000000001 → 0 (precision lost!)

// LexoRank never fails:
"V" → "M" → "I" → "E" → "C" → "Ao" → "Am" → ... (infinite precision!)
```

## Performance

- **Insert**: O(1) amortized (O(n) worst case for very long ranks)
- **Compare**: O(k) where k is string length
- **Space**: O(k) per rank

Typical ranks stay under 10 characters even after hundreds of operations.

## License

MIT
