import { useCallback, useRef } from "react";
import { ObjectUploader } from "@workspace/object-storage-web";
import { X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UppyFile, UploadResult } from "@uppy/core";

interface PhotoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ value = [], onChange, maxPhotos = 5 }: PhotoUploaderProps) {
  const objectPathMapRef = useRef<Map<string, string>>(new Map());

  const handleGetUploadParameters = useCallback(async (file: UppyFile<Record<string, unknown>, Record<string, unknown>>) => {
    const res = await fetch("/api/storage/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    if (!res.ok) throw new Error("Error al solicitar URL de subida");
    const { uploadURL, objectPath } = await res.json();
    objectPathMapRef.current.set(file.id, objectPath as string);
    return {
      method: "PUT" as const,
      url: uploadURL as string,
      headers: { "Content-Type": file.type ?? "application/octet-stream" },
    };
  }, []);

  const handleUploadComplete = useCallback((result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const newPaths = result.successful
        .map((file) => objectPathMapRef.current.get(file.id))
        .filter((p): p is string => !!p);
      if (newPaths.length > 0) {
        onChange([...value, ...newPaths].slice(0, maxPhotos));
      }
      result.successful.forEach((file) => objectPathMapRef.current.delete(file.id));
    }
  }, [value, onChange, maxPhotos]);

  const removePhoto = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const getDisplayUrl = (path: string) => {
    const clean = path.replace(/^\/objects\//, "");
    return `/api/storage/objects/${clean}`;
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((path, idx) => (
            <div key={idx} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
              <img
                src={getDisplayUrl(path)}
                alt={`Foto ${idx + 1}`}
                className="object-cover w-full h-full"
              />
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
          ))}
        </div>
      )}

      {value.length < maxPhotos && (
        <ObjectUploader
          maxNumberOfFiles={maxPhotos - value.length}
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
        >
          <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer text-center bg-muted/20 w-full">
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
