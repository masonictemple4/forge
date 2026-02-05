/**
 * TaskDetailDialog - View task details with edit/delete actions
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import type { Task } from "./types";
import { TaskFormDialog, type TaskFormData } from "./TaskFormDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task, data: TaskFormData) => void;
  onDelete: (task: Task) => void;
  isEditLoading?: boolean;
  isDeleteLoading?: boolean;
}

const priorityConfig = {
  low: { label: "Low", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-700 dark:text-red-400" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
  todo: { label: "To Do", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  in_progress: { label: "In Progress", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  "in-progress": { label: "In Progress", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  review: { label: "Review", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  done: { label: "Done", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
};

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isEditLoading = false,
  isDeleteLoading = false,
}: TaskDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!task) return null;

  const handleEditSubmit = (data: TaskFormData) => {
    onEdit(task, data);
    setShowEditDialog(false);
    onOpenChange(false);
  };

  const handleDeleteConfirm = () => {
    onDelete(task);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const statusInfo = statusConfig[task.columnId] ?? { label: task.columnId, color: "bg-gray-500/10 text-gray-700" };

  return (
    <>
      <Dialog open={open && !showEditDialog && !showDeleteDialog} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{task.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Task details and actions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status & Priority Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {task.priority && (
                <Badge variant="secondary" className={priorityConfig[task.priority].color}>
                  {priorityConfig[task.priority].label} Priority
                </Badge>
              )}
            </div>

            {/* Description */}
            {task.description ? (
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided</p>
            )}

            <Separator />

            {/* Dependencies */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Blocked By</h4>
                {task.blockedBy && task.blockedBy.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {task.blockedBy.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs">
                        Task #{id}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Blocks</h4>
                {task.blocks && task.blocks.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {task.blocks.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs">
                        Task #{id}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Labels</h4>
                  <div className="flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Assignee & Due Date */}
            {(task.assignee || task.dueDate) && (
              <>
                <Separator />
                <div className="flex gap-6">
                  {task.assignee && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Assignee</h4>
                      <p className="text-sm">@{task.assignee}</p>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
                      <p className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleteLoading}
            >
              🗑️ Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              disabled={isEditLoading}
            >
              ✏️ Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <TaskFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={task}
        onSubmit={handleEditSubmit}
        isLoading={isEditLoading}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        taskTitle={task.title}
        isLoading={isDeleteLoading}
      />
    </>
  );
}
