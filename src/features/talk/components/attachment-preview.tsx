import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, LinkIcon, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/features/talk/types";

const ICONS = {
  image: ImageIcon,
  file: FileText,
  audio: Music,
  link: LinkIcon,
} as const;

/**
 * An attachment as it appears along the trail. Images become a small framed
 * keepsake thumbnail (tap to view larger); everything else stays a quiet chip.
 */
export function AttachmentPreview({
  attachment,
  className,
}: {
  attachment: Attachment;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (attachment.kind === "image" && attachment.previewUrl) {
    return (
      <>
        <figure className={cn("talk-keepsake", className)}>
          <button
            type="button"
            className="block w-full"
            onClick={() => setOpen(true)}
            aria-label={`View ${attachment.name}`}
            data-testid="attachment-image"
          >
            <img src={attachment.previewUrl} alt={attachment.name} loading="lazy" />
          </button>
          <figcaption className="talk-keepsake-cap" title={attachment.name}>
            {attachment.name}
          </figcaption>
        </figure>
        {open && <Lightbox src={attachment.previewUrl} alt={attachment.name} onClose={() => setOpen(false)} />}
      </>
    );
  }

  const Icon = ICONS[attachment.kind];
  return (
    <span className={cn("talk-attachment", className)} data-testid="attachment-preview">
      <Icon className="talk-attachment-icon h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
      <span className="max-w-[16ch] truncate">{attachment.name}</span>
      {attachment.sizeLabel && (
        <span className="font-mono text-[0.68rem] text-muted-foreground/70">{attachment.sizeLabel}</span>
      )}
    </span>
  );
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="talk-lightbox" role="dialog" aria-modal="true" onClick={onClose} data-testid="attachment-lightbox">
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
