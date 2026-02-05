import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraph, hasCycle, createGraph, type Graph } from '../src/index.js';

describe('hasCycle', () => {
  it('detects self-loops', () => {
    const graph: Graph = new Map();
    expect(hasCycle(graph, 1, 1)).toBe(true);
  });

  it('detects direct cycles', () => {
    const graph: Graph = new Map();
    graph.set(1, new Set([2])); // 1 -> 2
    // Adding 2 -> 1 would create 1 -> 2 -> 1
    expect(hasCycle(graph, 2, 1)).toBe(true);
  });

  it('detects indirect cycles', () => {
    const graph: Graph = new Map();
    graph.set(1, new Set([2])); // 1 -> 2
    graph.set(2, new Set([3])); // 2 -> 3
    // Adding 3 -> 1 would create 1 -> 2 -> 3 -> 1
    expect(hasCycle(graph, 3, 1)).toBe(true);
  });

  it('allows valid edges', () => {
    const graph: Graph = new Map();
    graph.set(1, new Set([2])); // 1 -> 2
    // Adding 1 -> 3 is fine
    expect(hasCycle(graph, 1, 3)).toBe(false);
    // Adding 3 -> 2 is fine
    expect(hasCycle(graph, 3, 2)).toBe(false);
  });

  it('handles empty graph', () => {
    const graph: Graph = new Map();
    expect(hasCycle(graph, 1, 2)).toBe(false);
  });

  it('detects complex cycles', () => {
    const graph: Graph = new Map();
    // Create: 1 -> 2 -> 3 -> 4 -> 5
    graph.set(1, new Set([2]));
    graph.set(2, new Set([3]));
    graph.set(3, new Set([4]));
    graph.set(4, new Set([5]));
    // Adding 5 -> 1 creates cycle
    expect(hasCycle(graph, 5, 1)).toBe(true);
    // Adding 5 -> 2 creates cycle through 2 -> 3 -> 4 -> 5 -> 2
    expect(hasCycle(graph, 5, 2)).toBe(true);
    // Adding 5 -> 6 is fine
    expect(hasCycle(graph, 5, 6)).toBe(false);
  });
});

describe('DependencyGraph', () => {
  let dag: DependencyGraph;

  beforeEach(() => {
    dag = new DependencyGraph();
  });

  describe('addDependency', () => {
    it('adds a simple dependency', () => {
      dag.addDependency(1, 2); // 1 blocks 2
      expect(dag.hasDependency(1, 2)).toBe(true);
      expect(dag.hasDependency(2, 1)).toBe(false);
    });

    it('adds multiple dependencies', () => {
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);
      dag.addDependency(2, 4);

      expect(dag.getBlocked(1)).toEqual(expect.arrayContaining([2, 3]));
      expect(dag.getBlocked(2)).toEqual([4]);
    });

    it('throws on self-dependency', () => {
      expect(() => dag.addDependency(1, 1)).toThrow(/cycle/);
    });

    it('throws on direct cycle', () => {
      dag.addDependency(1, 2);
      expect(() => dag.addDependency(2, 1)).toThrow(/cycle/);
    });

    it('throws on indirect cycle', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);
      dag.addDependency(3, 4);
      expect(() => dag.addDependency(4, 1)).toThrow(/cycle/);
    });

    it('allows diamond dependencies (not a cycle)', () => {
      // 1 -> 2 -> 4
      // 1 -> 3 -> 4
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);
      dag.addDependency(2, 4);
      expect(() => dag.addDependency(3, 4)).not.toThrow();
      expect(dag.getBlockers(4)).toEqual(expect.arrayContaining([2, 3]));
    });
  });

  describe('removeDependency', () => {
    it('removes an existing dependency', () => {
      dag.addDependency(1, 2);
      const result = dag.removeDependency(1, 2);

      expect(result).toBe(true);
      expect(dag.hasDependency(1, 2)).toBe(false);
    });

    it('returns false for non-existent dependency', () => {
      const result = dag.removeDependency(1, 2);
      expect(result).toBe(false);
    });

    it('allows previously cyclic edge after removal', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);
      // Can't add 3 -> 1 yet
      expect(() => dag.addDependency(3, 1)).toThrow(/cycle/);

      // Remove 1 -> 2
      dag.removeDependency(1, 2);

      // Now 3 -> 1 is valid
      expect(() => dag.addDependency(3, 1)).not.toThrow();
    });
  });

  describe('getBlockers', () => {
    it('returns empty array for task with no blockers', () => {
      dag.addDependency(1, 2);
      expect(dag.getBlockers(1)).toEqual([]);
    });

    it('returns all blockers', () => {
      dag.addDependency(1, 3);
      dag.addDependency(2, 3);
      const blockers = dag.getBlockers(3);
      expect(blockers).toHaveLength(2);
      expect(blockers).toEqual(expect.arrayContaining([1, 2]));
    });

    it('returns empty array for unknown task', () => {
      expect(dag.getBlockers(999)).toEqual([]);
    });
  });

  describe('getBlocked', () => {
    it('returns empty array for task that blocks nothing', () => {
      dag.addDependency(1, 2);
      expect(dag.getBlocked(2)).toEqual([]);
    });

    it('returns all blocked tasks', () => {
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);
      dag.addDependency(1, 4);
      const blocked = dag.getBlocked(1);
      expect(blocked).toHaveLength(3);
      expect(blocked).toEqual(expect.arrayContaining([2, 3, 4]));
    });

    it('returns empty array for unknown task', () => {
      expect(dag.getBlocked(999)).toEqual([]);
    });
  });

  describe('topologicalSort', () => {
    it('sorts linear chain', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);
      dag.addDependency(3, 4);

      const sorted = dag.topologicalSort();
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(2));
      expect(sorted.indexOf(2)).toBeLessThan(sorted.indexOf(3));
      expect(sorted.indexOf(3)).toBeLessThan(sorted.indexOf(4));
    });

    it('sorts diamond pattern', () => {
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);
      dag.addDependency(2, 4);
      dag.addDependency(3, 4);

      const sorted = dag.topologicalSort();
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(2));
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(3));
      expect(sorted.indexOf(2)).toBeLessThan(sorted.indexOf(4));
      expect(sorted.indexOf(3)).toBeLessThan(sorted.indexOf(4));
    });

    it('handles subset of tasks', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);
      dag.addDependency(3, 4);
      dag.addDependency(5, 6);

      const sorted = dag.topologicalSort([1, 2, 3]);
      expect(sorted).toEqual([1, 2, 3]);
    });

    it('returns empty array for empty input', () => {
      expect(dag.topologicalSort([])).toEqual([]);
    });

    it('handles tasks with no dependencies', () => {
      dag.addDependency(1, 3);
      dag.addDependency(2, 3);

      const sorted = dag.topologicalSort();
      expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(3));
      expect(sorted.indexOf(2)).toBeLessThan(sorted.indexOf(3));
    });

    it('produces deterministic output', () => {
      dag.addDependency(5, 10);
      dag.addDependency(3, 10);
      dag.addDependency(1, 10);

      // Run multiple times, should be same
      const sorted1 = dag.topologicalSort();
      const sorted2 = dag.topologicalSort();
      expect(sorted1).toEqual(sorted2);
      // Lower IDs should come first among nodes with same dependencies
      expect(sorted1.slice(0, 3)).toEqual([1, 3, 5]);
    });
  });

  describe('getReadyTasks', () => {
    it('returns tasks with no blockers', () => {
      dag.addDependency(1, 3);
      dag.addDependency(2, 4);

      const ready = dag.getReadyTasks([]);
      expect(ready).toEqual(expect.arrayContaining([1, 2]));
      expect(ready).not.toContain(3);
      expect(ready).not.toContain(4);
    });

    it('returns tasks whose blockers are complete', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);

      expect(dag.getReadyTasks([])).toEqual([1]);
      expect(dag.getReadyTasks([1])).toEqual([2]);
      expect(dag.getReadyTasks([1, 2])).toEqual([3]);
    });

    it('handles multiple blockers', () => {
      dag.addDependency(1, 3);
      dag.addDependency(2, 3);

      // Task 3 needs both 1 and 2 complete
      expect(dag.getReadyTasks([1])).toEqual(expect.arrayContaining([2]));
      expect(dag.getReadyTasks([1])).not.toContain(3);
      expect(dag.getReadyTasks([1, 2])).toEqual(expect.arrayContaining([3]));
    });

    it('excludes completed tasks from results', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);

      expect(dag.getReadyTasks([1, 2])).not.toContain(1);
      expect(dag.getReadyTasks([1, 2])).not.toContain(2);
    });

    it('handles empty graph', () => {
      expect(dag.getReadyTasks([])).toEqual([]);
    });
  });

  describe('getUnblockedBy', () => {
    it('returns tasks that become ready', () => {
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);

      const unblocked = dag.getUnblockedBy(1, []);
      expect(unblocked).toEqual(expect.arrayContaining([2, 3]));
    });

    it('considers other blockers', () => {
      dag.addDependency(1, 3);
      dag.addDependency(2, 3);

      // If we complete 1, task 3 is still blocked by 2
      expect(dag.getUnblockedBy(1, [])).toEqual([]);

      // If 2 is already complete and we complete 1, then 3 is ready
      expect(dag.getUnblockedBy(1, [2])).toEqual([3]);
    });

    it('returns empty for task that blocks nothing', () => {
      dag.addDependency(1, 2);
      expect(dag.getUnblockedBy(2, [])).toEqual([]);
    });
  });

  describe('utility methods', () => {
    it('getAllTasks returns all tasks', () => {
      dag.addDependency(1, 2);
      dag.addDependency(3, 4);
      dag.addDependency(2, 5);

      const tasks = dag.getAllTasks();
      expect(tasks).toHaveLength(5);
      expect(tasks).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]));
    });

    it('size returns edge count', () => {
      expect(dag.size).toBe(0);
      dag.addDependency(1, 2);
      expect(dag.size).toBe(1);
      dag.addDependency(1, 3);
      expect(dag.size).toBe(2);
      dag.removeDependency(1, 2);
      expect(dag.size).toBe(1);
    });

    it('clear removes all dependencies', () => {
      dag.addDependency(1, 2);
      dag.addDependency(2, 3);
      dag.clear();

      expect(dag.size).toBe(0);
      expect(dag.getAllTasks()).toEqual([]);
    });

    it('toEdges exports all edges', () => {
      dag.addDependency(1, 2);
      dag.addDependency(1, 3);
      dag.addDependency(2, 4);

      const edges = dag.toEdges();
      expect(edges).toHaveLength(3);
      expect(edges).toEqual(expect.arrayContaining([
        [1, 2],
        [1, 3],
        [2, 4],
      ]));
    });

    it('fromEdges creates graph', () => {
      const edges: [number, number][] = [[1, 2], [2, 3], [1, 3]];
      const newDag = DependencyGraph.fromEdges(edges);

      expect(newDag.size).toBe(3);
      expect(newDag.hasDependency(1, 2)).toBe(true);
      expect(newDag.hasDependency(2, 3)).toBe(true);
      expect(newDag.hasDependency(1, 3)).toBe(true);
    });

    it('constructor accepts edges', () => {
      const dag = new DependencyGraph([[1, 2], [2, 3]]);
      expect(dag.hasDependency(1, 2)).toBe(true);
      expect(dag.hasDependency(2, 3)).toBe(true);
    });
  });

  describe('createGraph helper', () => {
    it('creates empty graph', () => {
      const graph = createGraph();
      expect(graph.size).toBe(0);
    });
  });
});

describe('real-world scenarios', () => {
  it('project management: epic -> story -> subtask', () => {
    const dag = new DependencyGraph();

    // Epic 1 blocks Stories 10, 11
    dag.addDependency(1, 10);
    dag.addDependency(1, 11);

    // Story 10 blocks Subtasks 100, 101
    dag.addDependency(10, 100);
    dag.addDependency(10, 101);

    // Story 11 blocks Subtask 110
    dag.addDependency(11, 110);

    // Initially only epic 1 is ready
    expect(dag.getReadyTasks([])).toEqual([1]);

    // Complete epic 1 -> stories become ready
    expect(dag.getReadyTasks([1])).toEqual([10, 11]);

    // Complete story 10 -> its subtasks become ready
    expect(dag.getReadyTasks([1, 10])).toEqual(expect.arrayContaining([11, 100, 101]));

    // Topological order respects hierarchy
    const sorted = dag.topologicalSort();
    expect(sorted.indexOf(1)).toBeLessThan(sorted.indexOf(10));
    expect(sorted.indexOf(10)).toBeLessThan(sorted.indexOf(100));
  });

  it('parallel work streams with dependencies', () => {
    const dag = new DependencyGraph();

    // Design track: 1 -> 2 -> 3
    dag.addDependency(1, 2);
    dag.addDependency(2, 3);

    // Development track: 4 -> 5 -> 6
    dag.addDependency(4, 5);
    dag.addDependency(5, 6);

    // Integration requires both: 3 -> 7, 6 -> 7
    dag.addDependency(3, 7);
    dag.addDependency(6, 7);

    // Initially, can work on 1 and 4 in parallel
    expect(dag.getReadyTasks([])).toEqual([1, 4]);

    // Complete design, development continues, integration waits
    expect(dag.getReadyTasks([1, 2, 3, 4])).toEqual([5]);
    expect(dag.getReadyTasks([1, 2, 3, 4, 5])).toEqual([6]);

    // Both tracks done -> integration ready
    expect(dag.getReadyTasks([1, 2, 3, 4, 5, 6])).toEqual([7]);
  });

  it('handles complex dependency web', () => {
    const dag = new DependencyGraph();

    // Multiple interconnected tasks
    dag.addDependency(1, 4);
    dag.addDependency(2, 4);
    dag.addDependency(2, 5);
    dag.addDependency(3, 5);
    dag.addDependency(4, 6);
    dag.addDependency(5, 6);

    // Verify no cycles were created
    expect(() => dag.topologicalSort()).not.toThrow();

    // Check dependencies are correct
    expect(dag.getBlockers(4)).toEqual(expect.arrayContaining([1, 2]));
    expect(dag.getBlockers(6)).toEqual(expect.arrayContaining([4, 5]));

    // Topological sort produces valid order
    const sorted = dag.topologicalSort();
    for (const [blocker, blocked] of dag.toEdges()) {
      expect(sorted.indexOf(blocker)).toBeLessThan(sorted.indexOf(blocked));
    }
  });
});
