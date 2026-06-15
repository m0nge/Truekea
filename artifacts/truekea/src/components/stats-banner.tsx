import { useGetMarketplaceStats } from "@workspace/api-client-react";
import { Package, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsBanner() {
  const { data: stats, isLoading } = useGetMarketplaceStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
          <Package className="h-6 w-6 md:h-8 md:w-8 text-primary mb-2" />
          <p className="text-2xl md:text-3xl font-black text-primary">{stats.totalActive}</p>
          <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Activos</p>
        </CardContent>
      </Card>
      
      <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30">
        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
          <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-500 mb-2" />
          <p className="text-2xl md:text-3xl font-black text-orange-600 dark:text-orange-400">{stats.totalPending}</p>
          <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Pendientes</p>
        </CardContent>
      </Card>
      
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30">
        <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
          <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-green-500 mb-2" />
          <p className="text-2xl md:text-3xl font-black text-green-600 dark:text-green-400">{stats.totalSold}</p>
          <p className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">Vendidos</p>
        </CardContent>
      </Card>
    </div>
  );
}
