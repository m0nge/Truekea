import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import Home from "@/pages/home";
import Login from "@/pages/login";
import ListingDetail from "@/pages/listing-detail";
import ListingForm from "@/pages/listing-form";
import MyListings from "@/pages/my-listings";
import Messages from "@/pages/messages";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/listings/new" component={ListingForm} />
      <Route path="/listings/:id/edit" component={ListingForm} />
      <Route path="/listings/:id" component={ListingDetail} />
      <Route path="/my-listings" component={MyListings} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:id" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
