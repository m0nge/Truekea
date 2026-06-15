import { useState } from "react";
import { useGetListings } from "@workspace/api-client-react";
import { CATEGORIES } from "@/lib/constants";
import { Layout } from "@/components/layout";
import { ListingCard } from "@/components/listing-card";
import { StatsBanner } from "@/components/stats-banner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  
  // Debounce search string locally for UX
  const { data: listings, isLoading } = useGetListings({
    search: search.length > 2 ? search : undefined,
    category: category !== "all" ? category : undefined,
    status: "active"
  });

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 text-center max-w-2xl mx-auto pt-4 pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-primary">
            El mercado de tu barrio
          </h1>
          <p className="text-lg text-muted-foreground">
            Compra y vende entre vecinos. Rápido, local y confiable.
          </p>
        </div>

        <StatsBanner />

        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card p-4 rounded-xl shadow-sm border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar productos..." 
              className="pl-10 h-12 text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 text-base" data-testid="select-category">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <SelectValue placeholder="Todas las categorías" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
            <p className="text-xl font-medium text-muted-foreground">No se encontraron productos.</p>
            <p className="text-sm mt-2 text-muted-foreground">Intenta con otros términos de búsqueda o elimina los filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
