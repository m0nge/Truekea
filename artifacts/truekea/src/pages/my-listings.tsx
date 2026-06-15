import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetMyListings } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { Loader2, PackageOpen, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyListings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const { data: listings, isLoading: listingsLoading } = useGetMyListings({
    query: { enabled: isAuthenticated }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || listingsLoading) {
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">Mis Anuncios</h1>
          <p className="text-muted-foreground mt-1">Gestiona los productos que estás vendiendo</p>
        </div>
        <Link href="/listings/new">
          <Button className="hidden sm:flex gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo Anuncio
          </Button>
        </Link>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border-2 border-dashed flex flex-col items-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <PackageOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Aún no tienes anuncios</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Comienza a vender tus cosas en el mercado hoy mismo. Es rápido y sencillo.
          </p>
          <Link href="/listings/new">
            <Button>Publicar mi primer anuncio</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </Layout>
  );
}
