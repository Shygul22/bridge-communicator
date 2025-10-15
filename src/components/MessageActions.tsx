import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, Edit, Trash2, Pin, Forward } from "lucide-react";

interface MessageActionsProps {
  isOwnMessage: boolean;
  isPinned: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onForward: () => void;
}

export const MessageActions = ({
  isOwnMessage,
  isPinned,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onForward,
}: MessageActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </DropdownMenuItem>
        {isOwnMessage && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onPin}>
          <Pin className="mr-2 h-4 w-4" />
          {isPinned ? "Unpin" : "Pin"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onForward}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </DropdownMenuItem>
        {isOwnMessage && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
