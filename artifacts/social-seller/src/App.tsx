import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Captions from "@/pages/captions";
import CaptionsGenerate from "@/pages/captions-generate";
import Broadcasts from "@/pages/broadcasts";
import BroadcastsGenerate from "@/pages/broadcasts-generate";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";

import PortalDashboard from "@/pages/portal-dashboard";
import PortalOrders from "@/pages/portal-orders";
import PortalOrderDetail from "@/pages/portal-order-detail";
import PortalWishlist from "@/pages/portal-wishlist";
import PortalLoyalty from "@/pages/portal-loyalty";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/captions" component={Captions} />
      <Route path="/captions/generate" component={CaptionsGenerate} />
      <Route path="/broadcasts" component={Broadcasts} />
      <Route path="/broadcasts/generate" component={BroadcastsGenerate} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />

      <Route path="/portal" component={PortalDashboard} />
      <Route path="/portal/orders" component={PortalOrders} />
      <Route path="/portal/orders/:id" component={PortalOrderDetail} />
      <Route path="/portal/wishlist" component={PortalWishlist} />
      <Route path="/portal/loyalty" component={PortalLoyalty} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
