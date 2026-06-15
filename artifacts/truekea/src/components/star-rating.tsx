import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            "transition-transform",
            interactive && "hover:scale-110 cursor-pointer",
            !interactive && "cursor-default pointer-events-none"
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingSummary({
  avgRating,
  totalReviews,
  size = "sm",
}: {
  avgRating: number | null | undefined;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
}) {
  if (!avgRating || totalReviews === 0) {
    return (
      <span className="text-xs text-muted-foreground">Sin valoraciones</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={Math.round(avgRating)} size={size} />
      <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        ({totalReviews} {totalReviews === 1 ? "valoración" : "valoraciones"})
      </span>
    </div>
  );
}
