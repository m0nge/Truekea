import { useState } from "react";
import { useCreateReview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/star-rating";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface ReviewFormProps {
  conversationId: number;
  sellerName: string | null | undefined;
  onSuccess: () => void;
}

export function ReviewForm({ conversationId, sellerName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const createReview = useCreateReview({
    mutation: {
      onSuccess: () => {
        toast.success("Valoración enviada. ¡Gracias por tu opinión!");
        queryClient.invalidateQueries({ queryKey: ["getConversationReview", conversationId] });
        onSuccess();
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || "Error al enviar la valoración";
        toast.error(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Selecciona una puntuación del 1 al 5");
      return;
    }
    createReview.mutate({
      data: {
        conversationId,
        rating,
        comment: comment.trim() || undefined,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
    >
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        <h3 className="font-semibold text-base">
          Valorar a {sellerName ?? "el vendedor"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Puntuación</p>
          <StarRating
            value={rating}
            interactive
            onChange={setRating}
            size="lg"
          />
          {rating > 0 && (
            <p className="text-xs text-muted-foreground">
              {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Comentario (opcional)</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos cómo fue tu experiencia con este vendedor..."
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={rating === 0 || createReview.isPending}
        >
          {createReview.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Enviar valoración
        </Button>
      </form>
    </motion.div>
  );
}
