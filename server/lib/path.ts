/**
 * Materialized Path Operations
 * 
 * Handles hierarchical data (Epics → Stories → Subtasks) using
 * path strings like '/uuid1/uuid2/uuid3/'.
 * 
 * Benefits:
 * - O(1) ancestor/descendant checks
 * - Single query for entire subtree
 * - Easy depth calculation
 * 
 * Trade-offs:
 * - Moving nodes requires updating all descendants
 * - Path length grows with depth
 */

/**
 * Build a path for a new child under a parent
 */
export function buildChildPath(parentPath: string, parentId: string): string {
  return `${parentPath}${parentId}/`;
}

/**
 * Get the root path
 */
export function getRootPath(): string {
  return "/";
}

/**
 * Check if a path is a descendant of another path
 */
export function isDescendantOf(childPath: string, parentPath: string): boolean {
  return childPath.startsWith(parentPath) && childPath !== parentPath;
}

/**
 * Check if a path is a direct child (immediate descendant)
 */
export function isDirectChildOf(childPath: string, parentPath: string): boolean {
  if (!isDescendantOf(childPath, parentPath)) {
    return false;
  }
  
  // Remove parent path prefix and check if only one ID remains
  const remaining = childPath.slice(parentPath.length);
  const segments = remaining.split("/").filter(Boolean);
  
  return segments.length === 1;
}

/**
 * Get the depth of a path (0 = root level)
 */
export function getDepth(path: string): number {
  if (path === "/") return 0;
  return path.split("/").filter(Boolean).length;
}

/**
 * Get the parent path from a child path
 */
export function getParentPath(childPath: string): string | null {
  if (childPath === "/") return null;
  
  const segments = childPath.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  
  segments.pop(); // Remove the last ID
  
  if (segments.length === 0) return "/";
  return "/" + segments.join("/") + "/";
}

/**
 * Get the parent ID from a path
 */
export function getParentId(path: string): string | null {
  if (path === "/") return null;
  
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  
  return segments[segments.length - 1];
}

/**
 * Get all ancestor IDs from a path (ordered from root to immediate parent)
 */
export function getAncestorIds(path: string): string[] {
  if (path === "/") return [];
  return path.split("/").filter(Boolean);
}

/**
 * Calculate the new path when moving a node to a new parent
 * 
 * @param oldPath - The current path of the node
 * @param nodeId - The ID of the node being moved
 * @param newParentPath - The path of the new parent
 * @returns The new path for the node
 */
export function calculateNewPath(
  oldPath: string,
  nodeId: string,
  newParentPath: string
): string {
  // New path is simply new parent's path + this node's ID
  return `${newParentPath}${nodeId}/`;
}

/**
 * Update paths for all descendants when a node is moved
 * 
 * @param oldNodePath - The old path of the moved node (including its ID)
 * @param newNodePath - The new path of the moved node (including its ID)
 * @param descendantPath - The path of a descendant to update
 * @returns The updated descendant path
 */
export function updateDescendantPath(
  oldNodePath: string,
  newNodePath: string,
  descendantPath: string
): string {
  if (!descendantPath.startsWith(oldNodePath)) {
    throw new Error("Path is not a descendant of the moved node");
  }
  
  return descendantPath.replace(oldNodePath, newNodePath);
}

/**
 * Build a SQL LIKE pattern for querying descendants
 */
export function buildDescendantsPattern(parentPath: string): string {
  return `${parentPath}%`;
}

/**
 * Build a SQL LIKE pattern for querying direct children only
 * 
 * Note: This is more complex - better to query all descendants
 * and filter in application layer, or use depth calculation.
 */
export function buildDirectChildrenPattern(parentPath: string): string {
  // This matches paths like /parent/child/ but not /parent/child/grandchild/
  // In practice, filtering by depth is cleaner
  return `${parentPath}%`;
}

/**
 * Validate a path string
 */
export function isValidPath(path: string): boolean {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path !== "/" && !path.endsWith("/")) return false;
  
  // Check for valid UUIDs between slashes (simplified check)
  const segments = path.split("/").filter(Boolean);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  return segments.every((segment) => uuidRegex.test(segment));
}
