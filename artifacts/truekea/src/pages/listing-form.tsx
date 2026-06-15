import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useCreateListing, 
  useUpdateListing, 
  useGetListing, 
  getGetListingQueryKey,
  ListingInputCondition
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoUploader } from "@/components/photo-uploader";
import { CATEGORIES, CONDITION_LABELS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(100, "El título es demasiado largo"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres").max(1000, "La descripción es demasiado larga"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  category: z.string().min(1, "Debes seleccionar una categoría"),
  condition: z.enum(["new", "like_new", "good", "fair"]).optional(),
  location: z.string().min(1, "La ubicación es requerida"),
  photos: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ListingForm() {
  const [, newParams] = useRoute("/listings/new");
  const [, editParams] = useRoute("/listings/:id/edit");
  
  const isEditing = !!editParams?.id;
  const listingId = isEditing ? parseInt(editParams!.id, 10) : 0;
  
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existingListing, isLoading: loadingListing } = useGetListing(listingId, {
    query: { 
      enabled: isEditing && !!listingId,
      queryKey: getGetListingQueryKey(listingId)
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      category: "",
      condition: undefined,
      location: "",
      photos: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isEditing && existingListing) {
      if (existingListing.sellerId !== user?.id) {
        toast.error("No tienes permiso para editar este anuncio");
        setLocation("/");
        return;
      }

      form.reset({
        title: existingListing.title,
        description: existingListing.description,
        price: existingListing.price,
        category: existingListing.category,
        condition: existingListing.condition as any,
        location: existingListing.location || "",
        photos: existingListing.photos || [],
      });
    }
  }, [isEditing, existingListing, user, form, setLocation]);

  const createListing = useCreateListing({
    mutation: {
      onSuccess: (data) => {
        toast.success("Anuncio publicado exitosamente");
        setLocation(`/listings/${data.id}`);
      },
      onError: (error) => {
        toast.error("Error al publicar el anuncio: " + (error as any).message);
      }
    }
  });

  const updateListing = useUpdateListing({
    mutation: {
      onSuccess: (data) => {
        toast.success("Anuncio actualizado exitosamente");
        queryClient.setQueryData(getGetListingQueryKey(listingId), data);
        setLocation(`/listings/${data.id}`);
      },
      onError: (error) => {
        toast.error("Error al actualizar el anuncio");
      }
    }
  });

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateListing.mutate({ 
        id: listingId, 
        data: values 
      });
    } else {
      createListing.mutate({ 
        data: values 
      });
    }
  };

  if (authLoading || (isEditing && loadingListing)) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-black mb-8 text-primary">
          {isEditing ? "Editar Anuncio" : "Publicar un Anuncio"}
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card border shadow-sm rounded-xl p-6 md:p-8">
            <FormField
              control={form.control}
              name="photos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fotos del producto</FormLabel>
                  <FormControl>
                    <PhotoUploader 
                      value={field.value} 
                      onChange={field.onChange} 
                      maxPhotos={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Añade hasta 5 fotos claras. La primera será la portada de tu anuncio.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Bicicleta de montaña usada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la condición" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación / Barrio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Palermo, CABA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe el producto, su estado, detalles importantes y si el precio es negociable..." 
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setLocation(isEditing ? `/listings/${listingId}` : "/")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createListing.isPending || updateListing.isPending}>
                {(createListing.isPending || updateListing.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Publicar Anuncio"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
