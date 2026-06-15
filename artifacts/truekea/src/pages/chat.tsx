import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetMessages, useSendMessage, getGetMessagesQueryKey, useGetConversations } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, ChevronLeft, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Chat() {
  const [, params] = useRoute("/messages/:id");
  const conversationId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fallback to find conversation details since we don't have a getConversation hook
  const { data: conversations } = useGetConversations({
    query: { enabled: isAuthenticated && !!conversationId }
  });
  
  const conversation = conversations?.find(c => c.id === conversationId);

  const { data: messages, isLoading: messagesLoading } = useGetMessages(conversationId, {
    query: { 
      enabled: isAuthenticated && !!conversationId,
      refetchInterval: 3000 // Poll every 3 seconds for real-time feel
    }
  });

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        setContent("");
        // Auto scroll to bottom
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    }
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    // Scroll to bottom on initial load of messages
    if (messages && messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages?.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !conversationId) return;
    
    sendMessage.mutate({
      id: conversationId,
      data: { content: content.trim() }
    });
  };

  if (authLoading || (messagesLoading && !messages)) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!conversation) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Conversación no encontrada</h2>
          <Button className="mt-4" onClick={() => setLocation("/messages")}>Volver a Mensajes</Button>
        </div>
      </Layout>
    );
  }

  const isSelling = conversation.sellerId === user?.id;
  const otherPartyName = isSelling ? conversation.buyerName : conversation.sellerName;
  const otherPartyAvatar = isSelling ? conversation.buyerAvatar : conversation.sellerAvatar;
  const photoUrl = conversation.listingPhoto 
    ? `/api/storage/objects/${conversation.listingPhoto.replace(/^\/objects\//, "")}` 
    : "https://placehold.co/100x100/eeeeee/999999?text=IMG";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] flex flex-col">
        {/* Header - Listing Context */}
        <Card className="p-3 mb-4 rounded-xl shadow-sm flex items-center gap-4 shrink-0 bg-card border">
          <Link href="/messages" className="md:hidden p-2 -ml-2 text-muted-foreground">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          
          <Link href={`/listings/${conversation.listingId}`} className="h-12 w-12 rounded-md overflow-hidden bg-muted border flex-shrink-0 cursor-pointer block">
            <img src={photoUrl} alt={conversation.listingTitle} className="w-full h-full object-cover" />
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={`/listings/${conversation.listingId}`} className="font-semibold text-base truncate hover:text-primary transition-colors block cursor-pointer">
              {conversation.listingTitle}
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>${conversation.listingPrice?.toLocaleString("es-AR")}</span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={otherPartyAvatar || ""} />
                  <AvatarFallback>{otherPartyName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="truncate">{otherPartyName}</span>
              </div>
            </div>
          </div>
          
          <Link href="/messages" className="hidden md:flex">
            <Button variant="outline" size="sm">Ver todos</Button>
          </Link>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 overflow-hidden flex flex-col bg-card/50 shadow-sm border rounded-xl">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <p>No hay mensajes en esta conversación.</p>
                <p>¡Escribe el primer mensaje para saludar!</p>
              </div>
            ) : (
              messages?.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                  >
                    <div 
                      className={`px-4 py-2.5 rounded-2xl ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted text-foreground rounded-tl-sm border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                      {format(new Date(msg.createdAt), "HH:mm", { locale: es })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-3 bg-background border-t">
            {conversation.listingStatus === 'sold' && !isSelling ? (
              <div className="p-3 bg-muted rounded-md flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <p>El artículo ha sido vendido. El chat está cerrado.</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                  autoComplete="off"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!content.trim() || sendMessage.isPending}
                  className="shrink-0 h-10 w-10 rounded-full"
                >
                  {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
