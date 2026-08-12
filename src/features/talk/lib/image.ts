import type { Attachment } from "@/features/talk/types";

const MAX_DIM = 1100;

/** Turn a picked image File into a lightweight, downscaled keepsake attachment. */
export async function fileToKeepsake(file: File): Promise<Attachment> {
  const previewUrl = await downscale(file);
  return {
    id: `att-${Math.random().toString(36).slice(2, 9)}`,
    name: file.name,
    kind: "image",
    previewUrl,
    sizeLabel: sizeLabelFor(previewUrl),
  };
}

function sizeLabelFor(dataUrl: string): string {
  const bytes = Math.ceil(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Downscale to keep localStorage small — keepsakes are thumbnails, not archives. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not open image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
