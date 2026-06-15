import { Link } from "wouter";
import { Listing } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { MapPin } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const photoUrl = listing.photos?.[0]
    ? `/api/storage/objects/${listing.photos[0].replace(/^\/objects\//, "")}`
    : "https://placehold.co/600x400/eeeeee/999999?text=Sin+Imagen";

  return (
    <Link href={`/listings/${listing.id}`} data-testid={`link-listing-${listing.id}`}>
      <Card className="overflow-hidden cursor-pointer hover-elevate transition-all group h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={photoUrl}
            alt={listing.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2">
            <Badge className={STATUS_COLORS[listing.status]} variant="secondary">
              {STATUS_LABELS[listing.status]}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <div className="mt-auto">
            <p className="text-2xl font-bold text-primary">
              ${listing.price.toLocaleString("es-AR")}
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex items-center justify-between border-t mt-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.sellerAvatar || ""} />
              <AvatarFallback>{listing.sellerName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[100px]">{listing.sellerName || "Usuario"}</span>
          </div>
          {listing.location && (
            <div className="flex items-center gap-1 text-xs truncate max-w-[100px]">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
