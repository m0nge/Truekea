import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <Card className="w-full max-w-md border-2 border-primary/10 shadow-xl relative z-10">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl font-black text-primary">T</span>
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">Bienvenido a Truekea</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              El mercado donde tus cosas viejas encuentran nuevos dueños. Conéctate con tu comunidad hoy.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Button 
                onClick={login} 
                className="w-full h-12 text-lg font-semibold"
                data-testid="button-login-action"
              >
                Ingresar para empezar
              </Button>
            )}
            <p className="text-sm text-muted-foreground mt-6 text-center max-w-[280px]">
              Al ingresar, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
