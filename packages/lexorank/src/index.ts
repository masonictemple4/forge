/**
 * @forge/lexorank - Fractional Indexing for O(1) list reordering
 * 
 * LexoRank allows you to insert items between any two existing items
 * in a sorted list without renumbering. Perfect for drag-and-drop
 * reordering in Kanban boards, task lists, etc.
 * 
 * @example
 * ```typescript
 * import { initial, between, after, before } from '@forge/lexorank';
 * 
 * // Start a new list
 * const first = initial(); // 'V'
 * 
 * // Add item after
 * const second = after(first); // 'W'
 * 
 * // Insert between
 * const middle = between(first, second); // 'Vo' or similar
 * 
 * // Items sort correctly: first < middle < second
 * ```
 */

export {
  between,
  initial,
  after,
  before,
  initialBatch,
  needsRebalancing,
  rebalance,
  isValid,
  compare,
} from './lexorank.js';
