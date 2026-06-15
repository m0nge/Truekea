import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetConversations } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Loader2, MessageSquareOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Messages() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  
  const { data: conversations, isLoading: conversationsLoading } = useGetConversations({
    query: { enabled: isAuthenticated }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || conversationsLoading) {
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-primary mb-2">Mensajes</h1>
        <p className="text-muted-foreground mb-8">Tus conversaciones sobre compras y ventas.</p>

        {!conversations || conversations.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border-2 border-dashed flex flex-col items-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <MessageSquareOff className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bandeja de entrada vacía</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Aún no tienes conversaciones. Contacta a vendedores o espera a que compradores interesados te escriban.
            </p>
            <Link href="/">
              <Button>Explorar productos</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => {
              const isSelling = conv.sellerId === user?.id;
              const otherPartyName = isSelling ? conv.buyerName : conv.sellerName;
              const otherPartyAvatar = isSelling ? conv.buyerAvatar : conv.sellerAvatar;
              const photoUrl = conv.listingPhoto 
                ? `/api/storage/objects/${conv.listingPhoto.replace(/^\/objects\//, "")}` 
                : "https://placehold.co/100x100/eeeeee/999999?text=IMG";

              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover-elevate cursor-pointer transition-colors group">
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border">
                      <img src={photoUrl} alt={conv.listingTitle} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {conv.listingTitle}
                        </h3>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: es })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={isSelling ? "border-primary text-primary" : "border-blue-500 text-blue-500"}>
                          {isSelling ? "Viendo" : "Comprando"}
                        </Badge>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={otherPartyAvatar || ""} />
                            <AvatarFallback>{otherPartyName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          {otherPartyName}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage || "Aún no hay mensajes. ¡Di hola!"}
                      </p>
                    </div>
                    
                    {conv.unreadCount !== undefined && conv.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0 self-center sm:self-auto">
                        {conv.unreadCount}
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Button } from "@/components/ui/button";
