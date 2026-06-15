import { useState, useCallback, useRef } from "react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ value = [], onChange, maxPhotos = 5 }: PhotoUploaderProps) {
  const handleUploadComplete = useCallback((result: any) => {
    if (result.successful && result.successful.length > 0) {
      const newUrls = result.successful.map((file: any) => file.response?.body?.objectPath).filter(Boolean);
      if (newUrls.length > 0) {
        onChange([...value, ...newUrls].slice(0, maxPhotos));
      }
    }
  }, [value, onChange, maxPhotos]);

  const removePhoto = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((path, idx) => {
            const displayUrl = `/api/storage/objects/${path.replace(/^\/objects\//, "")}`;
            return (
              <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                <img src={displayUrl} alt={`Foto ${idx + 1}`} className="object-cover w-full h-full" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={() => removePhoto(idx)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {value.length < maxPhotos && (
        <ObjectUploader
          onGetUploadParameters={async (file) => {
            const res = await fetch("/api/storage/uploads/request-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                size: file.size,
                contentType: file.type,
              }),
            });
            const { uploadURL } = await res.json();
            return {
              method: "PUT",
              url: uploadURL,
              headers: { "Content-Type": file.type },
            };
          }}
          onComplete={handleUploadComplete}
        >
          <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer text-center bg-muted/20">
            <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium">Arrastra fotos aquí o haz clic para seleccionar</p>
            <p className="text-xs text-muted-foreground mt-1">
              Máximo {maxPhotos} fotos. Formatos: JPG, PNG, WebP.
            </p>
          </div>
        </ObjectUploader>
      )}
    </div>
  );
}
