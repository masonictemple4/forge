/**
 * DAG (Directed Acyclic Graph) Operations
 * 
 * Manages task dependencies with:
 * - Cycle detection using DFS
 * - Topological sorting for dependency resolution
 * - Auto-unblock detection when blockers complete
 */

import { db, dependencies, tasks } from "@db/index";
import { eq, and } from "drizzle-orm";

/**
 * Get all tasks that block a given task
 */
export async function getBlockers(taskId: string) {
  const result = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
    })
    .from(dependencies)
    .innerJoin(tasks, eq(dependencies.blockerId, tasks.id))
    .where(eq(dependencies.blockedId, taskId));
  
  return result;
}

/**
 * Get all tasks that a given task blocks
 */
export async function getBlocking(taskId: string) {
  const result = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
    })
    .from(dependencies)
    .innerJoin(tasks, eq(dependencies.blockedId, tasks.id))
    .where(eq(dependencies.blockerId, taskId));
  
  return result;
}

/**
 * Detect if adding an edge would create a cycle
 * 
 * Uses DFS: If we can reach `from` starting from `to`, adding
 * an edge from -> to would create a cycle.
 * 
 * @param from - The blocker task ID
 * @param to - The blocked task ID
 * @returns true if adding this edge would create a cycle
 */
export async function detectCycle(from: string, to: string): Promise<boolean> {
  // Build adjacency list from existing dependencies
  const allDeps = await db.select().from(dependencies);
  
  const graph = new Map<string, string[]>();
  
  for (const dep of allDeps) {
    if (!graph.has(dep.blockerId)) {
      graph.set(dep.blockerId, []);
    }
    graph.get(dep.blockerId)!.push(dep.blockedId);
  }
  
  // Add the proposed edge temporarily
  if (!graph.has(from)) {
    graph.set(from, []);
  }
  graph.get(from)!.push(to);
  
  // DFS to check if we can reach `from` starting from `to`
  const visited = new Set<string>();
  const stack = [to];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (current === from) {
      return true; // Cycle detected!
    }
    
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);
    
    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      stack.push(neighbor);
    }
  }
  
  return false;
}

/**
 * Get tasks that would be unblocked if a task is completed
 * 
 * A task is unblocked when ALL its blockers are in "done" status.
 */
export async function getUnblockable(completedTaskId: string) {
  // Get all tasks blocked by the completed task
  const blocked = await getBlocking(completedTaskId);
  
  const unblockable = [];
  
  for (const task of blocked) {
    // Check if all OTHER blockers are also done
    const otherBlockers = await db
      .select({
        id: tasks.id,
        status: tasks.status,
      })
      .from(dependencies)
      .innerJoin(tasks, eq(dependencies.blockerId, tasks.id))
      .where(
        and(
          eq(dependencies.blockedId, task.id),
          // Exclude the task we're completing
        )
      );
    
    // Filter out the completed task and check if all remaining blockers are done
    const remainingBlockers = otherBlockers.filter(
      (b) => b.id !== completedTaskId && b.status !== "done"
    );
    
    if (remainingBlockers.length === 0) {
      unblockable.push(task);
    }
  }
  
  return unblockable;
}

/**
 * Topological sort of tasks based on dependencies
 * 
 * Uses Kahn's algorithm for determining execution order.
 * Returns tasks in an order where blockers come before blocked tasks.
 */
export async function topologicalSort(taskIds: string[]): Promise<string[]> {
  // Build graph for the subset of tasks
  const allDeps = await db.select().from(dependencies);
  
  // Filter to only include edges within our task set
  const taskSet = new Set(taskIds);
  const relevantDeps = allDeps.filter(
    (d) => taskSet.has(d.blockerId) && taskSet.has(d.blockedId)
  );
  
  // Build in-degree map and adjacency list
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  
  // Initialize
  for (const id of taskIds) {
    inDegree.set(id, 0);
    graph.set(id, []);
  }
  
  // Build graph
  for (const dep of relevantDeps) {
    graph.get(dep.blockerId)!.push(dep.blockedId);
    inDegree.set(dep.blockedId, (inDegree.get(dep.blockedId) || 0) + 1);
  }
  
  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];
  
  // Start with nodes that have no dependencies
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    
    for (const neighbor of graph.get(current) || []) {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }
  
  // If result length != taskIds length, there's a cycle
  // (shouldn't happen if we validate on insert)
  if (result.length !== taskIds.length) {
    throw new Error("Cycle detected in task dependencies");
  }
  
  return result;
}
