/**
 * @forge/dag - Directed Acyclic Graph for Task Dependencies
 *
 * Manages task dependencies with cycle detection, topological sorting,
 * and ready-task computation.
 */

/**
 * Graph representation: adjacency list where key is blocker, values are tasks it blocks
 */
export type Graph<T extends string | number = number> = Map<T, Set<T>>;

/**
 * Check if adding an edge from `from` to `to` would create a cycle.
 * Uses DFS to check if `to` can reach `from` (which would create a cycle).
 *
 * @param graph - The current dependency graph (blocker -> blocked)
 * @param from - The blocker task ID (source of new edge)
 * @param to - The blocked task ID (destination of new edge)
 * @returns true if adding this edge would create a cycle
 */
export function hasCycle<T extends string | number>(graph: Graph<T>, from: T, to: T): boolean {
  // If from === to, it's a self-loop (cycle)
  if (from === to) return true;

  // Check if we can reach `from` starting from `to`
  // If yes, adding edge from->to creates a cycle
  const visited = new Set<T>();
  const stack: T[] = [to];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === from) {
      return true; // Found a path from `to` back to `from`
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    // Get all tasks that `current` blocks
    const blocked = graph.get(current);
    if (blocked) {
      for (const next of blocked) {
        if (!visited.has(next)) {
          stack.push(next);
        }
      }
    }
  }

  return false;
}

/**
 * Dependency Graph Manager
 *
 * Manages task dependencies with O(1) lookups for blockers and blocked tasks.
 * Ensures the graph remains acyclic.
 *
 * @typeParam T - The type of task IDs (number or string). Defaults to number.
 */
export class DependencyGraph<T extends string | number = number> {
  // blocker -> Set of tasks it blocks
  private blocksMap: Graph<T> = new Map();

  // blocked -> Set of tasks blocking it
  private blockedByMap: Graph<T> = new Map();

  /**
   * Create a new DependencyGraph, optionally from existing edges
   */
  constructor(edges?: Array<[T, T]>) {
    if (edges) {
      for (const [blocker, blocked] of edges) {
        this.addDependency(blocker, blocked);
      }
    }
  }

  /**
   * Get the internal graph representation (blocker -> blocked)
   */
  get graph(): Graph<T> {
    return this.blocksMap;
  }

  /**
   * Add a dependency: blockerId must complete before blockedId can start.
   *
   * @param blockerId - The task that blocks
   * @param blockedId - The task that is blocked
   * @throws Error if adding this dependency would create a cycle
   */
  addDependency(blockerId: T, blockedId: T): void {
    // Check for cycle before adding
    if (hasCycle(this.blocksMap, blockerId, blockedId)) {
      throw new Error(
        `Cannot add dependency: ${blockerId} -> ${blockedId} would create a cycle`
      );
    }

    // Add to blocksMap (blocker -> blocked)
    if (!this.blocksMap.has(blockerId)) {
      this.blocksMap.set(blockerId, new Set());
    }
    this.blocksMap.get(blockerId)!.add(blockedId);

    // Add to blockedByMap (blocked -> blocker)
    if (!this.blockedByMap.has(blockedId)) {
      this.blockedByMap.set(blockedId, new Set());
    }
    this.blockedByMap.get(blockedId)!.add(blockerId);
  }

  /**
   * Remove a dependency between two tasks.
   *
   * @param blockerId - The task that was blocking
   * @param blockedId - The task that was blocked
   * @returns true if the dependency existed and was removed
   */
  removeDependency(blockerId: T, blockedId: T): boolean {
    const blocks = this.blocksMap.get(blockerId);
    const blockedBy = this.blockedByMap.get(blockedId);

    if (!blocks?.has(blockedId)) {
      return false;
    }

    blocks.delete(blockedId);
    blockedBy?.delete(blockerId);

    // Clean up empty sets
    if (blocks.size === 0) {
      this.blocksMap.delete(blockerId);
    }
    if (blockedBy?.size === 0) {
      this.blockedByMap.delete(blockedId);
    }

    return true;
  }

  /**
   * Get all tasks that are blocking a given task.
   *
   * @param taskId - The task to check
   * @returns Array of task IDs that block this task
   */
  getBlockers(taskId: T): T[] {
    const blockers = this.blockedByMap.get(taskId);
    return blockers ? Array.from(blockers) : [];
  }

  /**
   * Get all tasks that are blocked by a given task.
   *
   * @param taskId - The task to check
   * @returns Array of task IDs that this task blocks
   */
  getBlocked(taskId: T): T[] {
    const blocked = this.blocksMap.get(taskId);
    return blocked ? Array.from(blocked) : [];
  }

  /**
   * Check if a dependency exists.
   *
   * @param blockerId - The potential blocker
   * @param blockedId - The potentially blocked task
   * @returns true if blockerId blocks blockedId
   */
  hasDependency(blockerId: T, blockedId: T): boolean {
    return this.blocksMap.get(blockerId)?.has(blockedId) ?? false;
  }

  /**
   * Get all task IDs in the graph.
   */
  getAllTasks(): T[] {
    const tasks = new Set<T>();
    for (const [blocker, blocked] of this.blocksMap) {
      tasks.add(blocker);
      for (const b of blocked) {
        tasks.add(b);
      }
    }
    return Array.from(tasks);
  }

  /**
   * Perform topological sort on a subset of tasks using Kahn's algorithm.
   * Returns tasks in dependency order (blockers before blocked).
   *
   * @param taskIds - The task IDs to sort (if empty, sorts all tasks in graph)
   * @returns Sorted array of task IDs
   * @throws Error if the subgraph contains a cycle (shouldn't happen if using addDependency)
   */
  topologicalSort(taskIds?: T[]): T[] {
    const tasks = new Set(taskIds ?? this.getAllTasks());

    if (tasks.size === 0) {
      return [];
    }

    // Build in-degree map for the subgraph
    const inDegree = new Map<T, number>();
    const subgraphEdges = new Map<T, Set<T>>();

    // Initialize
    for (const task of tasks) {
      inDegree.set(task, 0);
      subgraphEdges.set(task, new Set());
    }

    // Count in-degrees for edges within the subgraph
    for (const task of tasks) {
      const blocked = this.blocksMap.get(task);
      if (blocked) {
        for (const b of blocked) {
          if (tasks.has(b)) {
            subgraphEdges.get(task)!.add(b);
            inDegree.set(b, (inDegree.get(b) ?? 0) + 1);
          }
        }
      }
    }

    // Kahn's algorithm
    const queue: T[] = [];
    const result: T[] = [];

    // Start with tasks that have no blockers in the subgraph
    for (const [task, degree] of inDegree) {
      if (degree === 0) {
        queue.push(task);
      }
    }

    // Sort queue for deterministic output
    queue.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const blocked = subgraphEdges.get(current);
      if (blocked) {
        const nextTasks: T[] = [];
        for (const b of blocked) {
          const newDegree = (inDegree.get(b) ?? 0) - 1;
          inDegree.set(b, newDegree);
          if (newDegree === 0) {
            nextTasks.push(b);
          }
        }
        // Sort for deterministic output
        nextTasks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        queue.push(...nextTasks);
      }
    }

    // Check for cycle (shouldn't happen with our addDependency protection)
    if (result.length !== tasks.size) {
      throw new Error('Cycle detected in task dependencies');
    }

    return result;
  }

  /**
   * Find tasks that are ready to work on (all blockers are complete).
   *
   * @param completedIds - Array of task IDs that are already completed
   * @returns Array of task IDs that have all their blockers completed
   */
  getReadyTasks(completedIds: T[]): T[] {
    const completed = new Set(completedIds);
    const ready: T[] = [];

    // Get all tasks that have blockers
    const allTasks = this.getAllTasks();

    for (const taskId of allTasks) {
      // Skip if already completed
      if (completed.has(taskId)) {
        continue;
      }

      // Get blockers for this task
      const blockers = this.blockedByMap.get(taskId);

      if (!blockers || blockers.size === 0) {
        // No blockers - this task is ready
        ready.push(taskId);
      } else {
        // Check if all blockers are completed
        let allBlockersComplete = true;
        for (const blocker of blockers) {
          if (!completed.has(blocker)) {
            allBlockersComplete = false;
            break;
          }
        }
        if (allBlockersComplete) {
          ready.push(taskId);
        }
      }
    }

    return ready.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * Get tasks that would become ready if a specific task is completed.
   *
   * @param taskId - The task that might be completed
   * @param currentlyCompleted - Tasks already completed
   * @returns Array of task IDs that would become ready
   */
  getUnblockedBy(taskId: T, currentlyCompleted: T[] = []): T[] {
    const completed = new Set(currentlyCompleted);
    const blocked = this.blocksMap.get(taskId);

    if (!blocked) {
      return [];
    }

    const willBeReady: T[] = [];

    for (const blockedTask of blocked) {
      if (completed.has(blockedTask)) {
        continue;
      }

      const blockers = this.blockedByMap.get(blockedTask);
      if (!blockers) {
        continue;
      }

      // Check if all OTHER blockers are complete
      let allOtherBlockersComplete = true;
      for (const blocker of blockers) {
        if (blocker !== taskId && !completed.has(blocker)) {
          allOtherBlockersComplete = false;
          break;
        }
      }

      if (allOtherBlockersComplete) {
        willBeReady.push(blockedTask);
      }
    }

    return willBeReady.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * Clear all dependencies.
   */
  clear(): void {
    this.blocksMap.clear();
    this.blockedByMap.clear();
  }

  /**
   * Get the total number of dependencies.
   */
  get size(): number {
    let count = 0;
    for (const blocked of this.blocksMap.values()) {
      count += blocked.size;
    }
    return count;
  }

  /**
   * Export the graph as an array of edges.
   */
  toEdges(): Array<[T, T]> {
    const edges: Array<[T, T]> = [];
    for (const [blocker, blocked] of this.blocksMap) {
      for (const b of blocked) {
        edges.push([blocker, b]);
      }
    }
    return edges;
  }

  /**
   * Create a DependencyGraph from an array of edges.
   */
  static fromEdges<T extends string | number = number>(edges: Array<[T, T]>): DependencyGraph<T> {
    return new DependencyGraph<T>(edges);
  }
}

// Export standalone functions that work with the class
export function createGraph<T extends string | number = number>(): DependencyGraph<T> {
  return new DependencyGraph<T>();
}
