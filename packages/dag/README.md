# @forge/dag

Directed Acyclic Graph for task dependency management in Forge.

## Installation

```bash
npm install @forge/dag
```

## Usage

```typescript
import { DependencyGraph } from '@forge/dag';

const dag = new DependencyGraph();

// Add dependencies: task 1 must complete before task 2
dag.addDependency(1, 2);  // 1 blocks 2
dag.addDependency(1, 3);  // 1 also blocks 3
dag.addDependency(2, 4);  // 2 blocks 4

// Query dependencies
dag.getBlockers(2);  // [1] - tasks blocking 2
dag.getBlocked(1);   // [2, 3] - tasks blocked by 1

// Find ready tasks (given completed tasks)
dag.getReadyTasks([]);     // [1] - nothing completed, only 1 is ready
dag.getReadyTasks([1]);    // [2, 3] - after completing 1
dag.getReadyTasks([1, 2]); // [3, 4] - after completing 1 and 2

// Topological sort (respects dependencies)
dag.topologicalSort();  // [1, 2, 3, 4] - valid execution order

// Cycle detection (automatic)
dag.addDependency(4, 1);  // throws: would create cycle!

// Remove dependencies
dag.removeDependency(1, 2);

// Preview what completing a task would unlock
dag.getUnblockedBy(1, []);  // [2, 3] - completing 1 unlocks 2 and 3
```

## API

### `DependencyGraph`

#### Constructor

```typescript
new DependencyGraph(edges?: Array<[number, number]>)
```

#### Methods

| Method | Description |
|--------|-------------|
| `addDependency(blockerId, blockedId)` | Add edge with cycle detection |
| `removeDependency(blockerId, blockedId)` | Remove edge, returns boolean |
| `hasDependency(blockerId, blockedId)` | Check if dependency exists |
| `getBlockers(taskId)` | Get all tasks blocking this one |
| `getBlocked(taskId)` | Get all tasks blocked by this one |
| `topologicalSort(taskIds?)` | Kahn's algorithm for ordering |
| `getReadyTasks(completedIds)` | Find tasks with all blockers complete |
| `getUnblockedBy(taskId, completedIds)` | Preview what completing a task unlocks |
| `getAllTasks()` | Get all task IDs in graph |
| `toEdges()` | Export as array of [blocker, blocked] |
| `clear()` | Remove all dependencies |

### Standalone Functions

```typescript
import { hasCycle, createGraph, type Graph } from '@forge/dag';

// Check if adding an edge would create a cycle
const graph: Graph = new Map();
graph.set(1, new Set([2]));
hasCycle(graph, 2, 1);  // true - would create cycle

// Create empty graph
const dag = createGraph();
```

## Algorithm Details

### Cycle Detection
Uses DFS to check if the target node can reach the source before adding an edge. O(V + E) time complexity.

### Topological Sort
Implements Kahn's algorithm with deterministic ordering (lower IDs processed first among nodes with equal in-degree).

### Data Structure
Maintains two adjacency lists for O(1) lookups:
- `blocksMap`: blocker → Set<blocked>
- `blockedByMap`: blocked → Set<blockers>

## License

MIT
