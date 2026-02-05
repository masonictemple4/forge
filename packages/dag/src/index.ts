/**
 * @forge/dag - Directed Acyclic Graph for Task Dependencies
 *
 * Manages task dependencies with cycle detection, topological sorting,
 * and ready-task computation.
 */

/**
 * Graph representation: adjacency list where key is blocker, values are tasks it blocks
 */
export type Graph = Map<number, Set<number>>;

/**
 * Check if adding an edge from `from` to `to` would create a cycle.
 * Uses DFS to check if `to` can reach `from` (which would create a cycle).
 *
 * @param graph - The current dependency graph (blocker -> blocked)
 * @param from - The blocker task ID (source of new edge)
 * @param to - The blocked task ID (destination of new edge)
 * @returns true if adding this edge would create a cycle
 */
export function hasCycle(graph: Graph, from: number, to: number): boolean {
  // If from === to, it's a self-loop (cycle)
  if (from === to) return true;

  // Check if we can reach `from` starting from `to`
  // If yes, adding edge from->to creates a cycle
  const visited = new Set<number>();
  const stack = [to];

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
 */
export class DependencyGraph {
  // blocker -> Set of tasks it blocks
  private blocksMap: Graph = new Map();

  // blocked -> Set of tasks blocking it
  private blockedByMap: Graph = new Map();

  /**
   * Create a new DependencyGraph, optionally from existing edges
   */
  constructor(edges?: Array<[number, number]>) {
    if (edges) {
      for (const [blocker, blocked] of edges) {
        this.addDependency(blocker, blocked);
      }
    }
  }

  /**
   * Get the internal graph representation (blocker -> blocked)
   */
  get graph(): Graph {
    return this.blocksMap;
  }

  /**
   * Add a dependency: blockerId must complete before blockedId can start.
   *
   * @param blockerId - The task that blocks
   * @param blockedId - The task that is blocked
   * @throws Error if adding this dependency would create a cycle
   */
  addDependency(blockerId: number, blockedId: number): void {
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
  removeDependency(blockerId: number, blockedId: number): boolean {
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
  getBlockers(taskId: number): number[] {
    const blockers = this.blockedByMap.get(taskId);
    return blockers ? Array.from(blockers) : [];
  }

  /**
   * Get all tasks that are blocked by a given task.
   *
   * @param taskId - The task to check
   * @returns Array of task IDs that this task blocks
   */
  getBlocked(taskId: number): number[] {
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
  hasDependency(blockerId: number, blockedId: number): boolean {
    return this.blocksMap.get(blockerId)?.has(blockedId) ?? false;
  }

  /**
   * Get all task IDs in the graph.
   */
  getAllTasks(): number[] {
    const tasks = new Set<number>();
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
  topologicalSort(taskIds?: number[]): number[] {
    const tasks = new Set(taskIds ?? this.getAllTasks());

    if (tasks.size === 0) {
      return [];
    }

    // Build in-degree map for the subgraph
    const inDegree = new Map<number, number>();
    const subgraphEdges = new Map<number, Set<number>>();

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
    const queue: number[] = [];
    const result: number[] = [];

    // Start with tasks that have no blockers in the subgraph
    for (const [task, degree] of inDegree) {
      if (degree === 0) {
        queue.push(task);
      }
    }

    // Sort queue for deterministic output
    queue.sort((a, b) => a - b);

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const blocked = subgraphEdges.get(current);
      if (blocked) {
        const nextTasks: number[] = [];
        for (const b of blocked) {
          const newDegree = (inDegree.get(b) ?? 0) - 1;
          inDegree.set(b, newDegree);
          if (newDegree === 0) {
            nextTasks.push(b);
          }
        }
        // Sort for deterministic output
        nextTasks.sort((a, b) => a - b);
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
  getReadyTasks(completedIds: number[]): number[] {
    const completed = new Set(completedIds);
    const ready: number[] = [];

    // Get all tasks that have blockers
    const tasksWithBlockers = new Set(this.blockedByMap.keys());

    // Also get all tasks that block others but might not have blockers themselves
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

    return ready.sort((a, b) => a - b);
  }

  /**
   * Get tasks that would become ready if a specific task is completed.
   *
   * @param taskId - The task that might be completed
   * @param currentlyCompleted - Tasks already completed
   * @returns Array of task IDs that would become ready
   */
  getUnblockedBy(taskId: number, currentlyCompleted: number[] = []): number[] {
    const completed = new Set(currentlyCompleted);
    const blocked = this.blocksMap.get(taskId);

    if (!blocked) {
      return [];
    }

    const willBeReady: number[] = [];

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

    return willBeReady.sort((a, b) => a - b);
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
  toEdges(): Array<[number, number]> {
    const edges: Array<[number, number]> = [];
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
  static fromEdges(edges: Array<[number, number]>): DependencyGraph {
    return new DependencyGraph(edges);
  }
}

// Export standalone functions that work with the class
export function createGraph(): DependencyGraph {
  return new DependencyGraph();
}
