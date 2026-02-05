/**
 * Types for the Kanban board components
 */

export interface Task {
  id: number;
  title: string;
  description?: string;
  columnId: string;
  rank: string; // LexoRank for ordering
  blockedBy?: number[]; // Task IDs that block this task
  blocks?: number[]; // Task IDs this task blocks
  labels?: string[];
  assignee?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  rank: string; // LexoRank for column ordering
  color?: string;
  limit?: number; // WIP limit
}

export interface BoardState {
  columns: Column[];
  tasks: Map<number, Task>; // Quick lookup by ID
}

export type DragType = 'task' | 'column';

export interface DragData {
  type: DragType;
  task?: Task;
  column?: Column;
  sourceColumnId?: string;
  sourceIndex?: number;
}
