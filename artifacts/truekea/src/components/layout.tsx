import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, MessageSquare, PlusCircle, User, LogOut, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home">
              <span className="text-2xl font-black text-primary tracking-tight">Truekea</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              data-testid="button-theme-toggle"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <>
                    <Link href="/listings/new" data-testid="link-new-listing">
                      <Button className="hidden md:flex gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Vender
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild data-testid="button-user-menu">
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "Usuario"} />
                            <AvatarFallback>{user.firstName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/listings/new" className="cursor-pointer w-full flex items-center md:hidden" data-testid="menu-new-listing">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Vender</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/my-listings" className="cursor-pointer w-full flex items-center" data-testid="menu-my-listings">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Mis Anuncios</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/messages" className="cursor-pointer w-full flex items-center" data-testid="menu-messages">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Mensajes</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={logout} data-testid="menu-logout">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button onClick={login} data-testid="button-login">
                    Iniciar Sesión
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
