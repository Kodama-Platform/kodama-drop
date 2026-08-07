import { FileText, Image as ImageIcon, LinkIcon, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/features/talk/types";

const ICONS = {
  image: ImageIcon,
  file: FileText,
  audio: Music,
  link: LinkIcon,
} as const;

/** Compact attachment chip — metadata only in v1. */
export function AttachmentPreview({
  attachment,
  className,
}: {
  attachment: Attachment;
  className?: string;
}) {
  const Icon = ICONS[attachment.kind];
  return (
    <span className={cn("talk-attachment", className)} data-testid="attachment-preview">
      <Icon className="talk-attachment-icon h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      <span className="max-w-[16ch] truncate">{attachment.name}</span>
      {attachment.sizeLabel && (
        <span className="font-mono text-[0.68rem] text-muted-foreground/70">
          {attachment.sizeLabel}
        </span>
      )}
    </span>
  );
}
