import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "./client";

const API_BASE = "/api";

// ============================================================================
// Types
// ============================================================================

export interface ApiColumn {
  id: string;
  title: string;
  color: string | null;
  rank: string;
  wipLimit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnInput {
  title: string;
  color?: string;
  wipLimit?: number;
}

export interface UpdateColumnInput {
  title?: string;
  color?: string;
  wipLimit?: number | null;
}

export interface ReorderColumnInput {
  columnId: string;
  beforeId: string | null;
  afterId: string | null;
}

// ============================================================================
// Fetch functions
// ============================================================================

async function fetchColumns(): Promise<ApiColumn[]> {
  const res = await fetch(`${API_BASE}/columns`);
  if (!res.ok) throw new Error("Failed to fetch columns");
  return res.json();
}

async function fetchColumn(id: string): Promise<ApiColumn> {
  const res = await fetch(`${API_BASE}/columns/${id}`);
  if (!res.ok) throw new Error("Column not found");
  return res.json();
}

async function createColumn(input: CreateColumnInput): Promise<ApiColumn> {
  const res = await fetch(`${API_BASE}/columns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create column");
  return res.json();
}

async function updateColumn(id: string, input: UpdateColumnInput): Promise<ApiColumn> {
  const res = await fetch(`${API_BASE}/columns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to update column");
  return res.json();
}

async function reorderColumn(input: ReorderColumnInput): Promise<ApiColumn> {
  const res = await fetch(`${API_BASE}/columns/${input.columnId}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      beforeId: input.beforeId,
      afterId: input.afterId,
    }),
  });
  if (!res.ok) throw new Error("Failed to reorder column");
  return res.json();
}

async function deleteColumn(id: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${API_BASE}/columns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete column");
  return res.json();
}

// ============================================================================
// Query hooks
// ============================================================================

export function useColumns() {
  return useQuery({
    queryKey: queryKeys.columns(),
    queryFn: fetchColumns,
  });
}

export function useColumn(id: string) {
  return useQuery({
    queryKey: queryKeys.column(id),
    queryFn: () => fetchColumn(id),
    enabled: !!id,
  });
}

// ============================================================================
// Mutation hooks with optimistic updates
// ============================================================================

/**
 * Create column mutation with optimistic UI
 */
export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createColumn,
    
    onMutate: async (newColumn) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.columns() });
      const previousColumns = queryClient.getQueryData<ApiColumn[]>(queryKeys.columns());
      
      const optimisticColumn: ApiColumn = {
        id: `temp-${Date.now()}`,
        title: newColumn.title,
        color: newColumn.color ?? null,
        rank: "zzz",
        wipLimit: newColumn.wipLimit?.toString() ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      queryClient.setQueryData<ApiColumn[]>(queryKeys.columns(), (old) => 
        old ? [...old, optimisticColumn] : [optimisticColumn]
      );
      
      return { previousColumns, optimisticColumn };
    },
    
    onError: (err, newColumn, context) => {
      if (context?.previousColumns) {
        queryClient.setQueryData(queryKeys.columns(), context.previousColumns);
      }
    },
    
    onSuccess: (createdColumn, variables, context) => {
      queryClient.setQueryData<ApiColumn[]>(queryKeys.columns(), (old) => {
        if (!old) return [createdColumn];
        return old.map((c) => 
          c.id === context?.optimisticColumn.id ? createdColumn : c
        );
      });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.columns() });
    },
  });
}

/**
 * Update column mutation with optimistic UI (for renaming, color changes, etc.)
 */
export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateColumnInput & { id: string }) => 
      updateColumn(id, input),
    
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.columns() });
      
      const previousColumns = queryClient.getQueryData<ApiColumn[]>(queryKeys.columns());
      
      // Optimistically update
      queryClient.setQueryData<ApiColumn[]>(queryKeys.columns(), (old) =>
        old?.map((column) =>
          column.id === id
            ? { 
                ...column, 
                ...updates, 
                wipLimit: updates.wipLimit?.toString() ?? column.wipLimit,
                updatedAt: new Date().toISOString() 
              }
            : column
        )
      );
      
      return { previousColumns };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousColumns) {
        queryClient.setQueryData(queryKeys.columns(), context.previousColumns);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.columns() });
    },
  });
}

/**
 * Reorder column mutation with optimistic UI
 */
export function useReorderColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderColumn,
    
    onMutate: async ({ columnId, beforeId, afterId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.columns() });
      
      const previousColumns = queryClient.getQueryData<ApiColumn[]>(queryKeys.columns());
      
      if (previousColumns) {
        // Find indices
        const columnIndex = previousColumns.findIndex(c => c.id === columnId);
        const beforeIndex = beforeId ? previousColumns.findIndex(c => c.id === beforeId) : -1;
        const afterIndex = afterId ? previousColumns.findIndex(c => c.id === afterId) : -1;
        
        if (columnIndex !== -1) {
          const newColumns = [...previousColumns];
          const [removed] = newColumns.splice(columnIndex, 1);
          
          // Calculate target position
          let targetIndex: number;
          if (afterIndex !== -1) {
            // Insert after the afterId column
            targetIndex = afterIndex < columnIndex ? afterIndex + 1 : afterIndex;
          } else if (beforeIndex !== -1) {
            // Insert before the beforeId column
            targetIndex = beforeIndex < columnIndex ? beforeIndex : beforeIndex - 1;
          } else {
            // Move to end
            targetIndex = newColumns.length;
          }
          
          newColumns.splice(targetIndex, 0, removed);
          
          queryClient.setQueryData<ApiColumn[]>(queryKeys.columns(), newColumns);
        }
      }
      
      return { previousColumns };
    },
    
    onError: (err, variables, context) => {
      if (context?.previousColumns) {
        queryClient.setQueryData(queryKeys.columns(), context.previousColumns);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.columns() });
    },
  });
}

/**
 * Delete column mutation with optimistic UI
 */
export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteColumn,
    
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.columns() });
      
      const previousColumns = queryClient.getQueryData<ApiColumn[]>(queryKeys.columns());
      
      queryClient.setQueryData<ApiColumn[]>(queryKeys.columns(), (old) =>
        old?.filter((column) => column.id !== columnId)
      );
      
      return { previousColumns };
    },
    
    onError: (err, columnId, context) => {
      if (context?.previousColumns) {
        queryClient.setQueryData(queryKeys.columns(), context.previousColumns);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.columns() });
    },
  });
}
