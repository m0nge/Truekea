import { useGetListing, useUpdateListingStatus, getGetListingQueryKey, useStartOrGetConversation, useDeleteListing } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useRoute, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { STATUS_COLORS, STATUS_LABELS, CONDITION_LABELS } from "@/lib/constants";
import { MapPin, Loader2, Calendar, MessageSquare, Edit, AlertTriangle, ShieldCheck, Tag } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ListingDetail() {
  const [, params] = useRoute("/listings/:id");
  const listingId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useGetListing(listingId, {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) }
  });

  const updateStatus = useUpdateListingStatus({
    mutation: {
      onSuccess: (data) => {
        toast.success("Estado actualizado");
        queryClient.setQueryData(getGetListingQueryKey(listingId), data);
      }
    }
  });

  const deleteListing = useDeleteListing({
    mutation: {
      onSuccess: () => {
        toast.success("Anuncio eliminado");
        setLocation("/my-listings");
      }
    }
  });

  const startConversation = useStartOrGetConversation({
    mutation: {
      onSuccess: (conversation) => {
        setLocation(`/messages/${conversation.id}`);
      }
    }
  });

  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Anuncio no encontrado</h2>
          <Button className="mt-4" onClick={() => setLocation("/")}>Volver al inicio</Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const photos = listing.photos && listing.photos.length > 0 
    ? listing.photos.map(p => `/api/storage/objects/${p.replace(/^\/objects\//, "")}`)
    : ["https://placehold.co/800x600/eeeeee/999999?text=Sin+Imagen"];

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      setLocation(`/login?returnTo=/listings/${listing.id}`);
      return;
    }
    startConversation.mutate({ data: { listingId: listing.id } });
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-4">
          <div className="aspect-4/3 md:aspect-video rounded-xl overflow-hidden bg-muted relative">
            <img 
              src={photos[mainPhotoIndex]} 
              alt={listing.title}
              className="w-full h-full object-contain bg-black/5"
            />
            <div className="absolute top-4 right-4">
              <Badge className={STATUS_COLORS[listing.status]} variant="secondary">
                {STATUS_LABELS[listing.status]}
              </Badge>
            </div>
          </div>
          
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainPhotoIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                    mainPhotoIndex === idx ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={photo} alt={`${listing.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="bg-card border rounded-xl p-6 shadow-sm mt-8">
            <h2 className="text-xl font-bold mb-4">Descripción</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{listing.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-24">
            <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>
            <p className="text-4xl font-black text-primary mb-6">
              ${listing.price.toLocaleString("es-AR")}
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Categoría:</span>
                <span className="text-muted-foreground">{listing.category}</span>
              </div>
              
              {listing.condition && (
                <div className="flex items-center gap-3 text-sm">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Condición:</span>
                  <span className="text-muted-foreground">{CONDITION_LABELS[listing.condition]}</span>
                </div>
              )}

              {listing.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ubicación:</span>
                  <span className="text-muted-foreground">{listing.location}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Publicado:</span>
                <span className="text-muted-foreground">
                  {format(new Date(listing.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={listing.sellerAvatar || ""} />
                <AvatarFallback>{listing.sellerName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Vendedor</p>
                <p className="font-bold">{listing.sellerName}</p>
              </div>
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/listings/${listing.id}/edit`}>
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente tu anuncio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteListing.mutate({ id: listing.id })}
                          disabled={deleteListing.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteListing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Cambiar estado:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      size="sm" 
                      variant={listing.status === 'active' ? "default" : "outline"}
                      onClick={() => updateStatus.mutate({ id: listing.id, data: { status: 'active' } })}
                      disabled={listing.status === 'active' || updateStatus.isPending}
                    >
                      Activo
                    </Button>
                    <Button 
                      size="sm" 
                      variant={listing.status === 'pending' ? "default" : "outline"}
                      onClick={() => updateStatus.mutate({ id: listing.id, data: { status: 'pending' } })}
                      disabled={listing.status === 'pending' || updateStatus.isPending}
                    >
                      Pendiente
                    </Button>
                    <Button 
                      size="sm" 
                      variant={listing.status === 'sold' ? "default" : "outline"}
                      onClick={() => updateStatus.mutate({ id: listing.id, data: { status: 'sold' } })}
                      disabled={listing.status === 'sold' || updateStatus.isPending}
                    >
                      Vendido
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleContactSeller}
                disabled={startConversation.isPending || listing.status === 'sold'}
              >
                {startConversation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Contactar al vendedor
                  </>
                )}
              </Button>
            )}
            
            {listing.status === 'sold' && !isOwner && (
              <div className="mt-4 p-3 bg-muted rounded-md flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                <p>Este artículo ya ha sido vendido. El vendedor no aceptará nuevos mensajes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
