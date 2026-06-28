import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRole, isSellerOrAdmin } from "@/hooks/useRole";
import { useUser } from "@clerk/react";

import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Captions from "@/pages/captions";
import CaptionsGenerate from "@/pages/captions-generate";
import Broadcasts from "@/pages/broadcasts";
import BroadcastsGenerate from "@/pages/broadcasts-generate";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import SellerAccess from "@/pages/seller-access";
import AdminPanel from "@/pages/admin";
import Products from "@/pages/products";

import PortalDashboard from "@/pages/portal-dashboard";
import PortalOrders from "@/pages/portal-orders";
import PortalOrderDetail from "@/pages/portal-order-detail";
import PortalWishlist from "@/pages/portal-wishlist";
import PortalLoyalty from "@/pages/portal-loyalty";
import PortalShop from "@/pages/portal-shop";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/contexts/cart";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "hsl(262, 83%, 58%)",
    colorForeground: "hsl(260, 50%, 15%)",
    colorMutedForeground: "hsl(260, 20%, 40%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorBackground: "hsl(30, 50%, 98%)",
    colorInput: "hsl(260, 10%, 93%)",
    colorInputForeground: "hsl(260, 50%, 15%)",
    colorNeutral: "hsl(260, 10%, 60%)",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-violet-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-violet-950 font-bold",
    headerSubtitle: "text-violet-700/70",
    socialButtonsBlockButtonText: "text-violet-950 font-medium",
    formFieldLabel: "text-violet-900 font-medium",
    footerActionLink: "text-violet-600 font-semibold hover:text-violet-700",
    footerActionText: "text-violet-700/60",
    dividerText: "text-violet-700/50",
    identityPreviewEditButton: "text-violet-600",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-red-700",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border-violet-200 hover:border-violet-300 bg-white hover:bg-violet-50/50",
    formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white font-semibold",
    formFieldInput: "border-violet-200 focus:border-violet-400 bg-white text-violet-950",
    footerAction: "bg-violet-50/50",
    dividerLine: "bg-violet-200",
    alert: "bg-red-50 border-red-200",
    otpCodeFieldInput: "border-violet-300 bg-white",
    formFieldRow: "",
    main: "",
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-orange-50 px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/portal`}
      />
    </div>
  );
}

function HomeRedirect() {
  const { role, isLoaded, isSignedIn } = useRole();

  if (!isLoaded) return null;

  if (isSignedIn && !isSellerOrAdmin(role)) {
    return <Redirect to="/portal" />;
  }

  return (
    <Layout>
      <SellerGuardContent>
        <Dashboard />
      </SellerGuardContent>
    </Layout>
  );
}

function SellerGuardContent({ children }: { children: React.ReactNode }) {
  const { role, isLoaded, isSignedIn } = useRole();
  const [, setLocation] = useLocation();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <SellerSignInPrompt />;
  }

  if (!isSellerOrAdmin(role)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}

function SellerRoute({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <SellerGuardContent>{children}</SellerGuardContent>
    </Layout>
  );
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useRole();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <Layout>
        <PortalSignInPrompt />
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function SellerSignInPrompt() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Seller sign-in required</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Sign in to your seller account to access the dashboard, captions, broadcasts, and orders.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setLocation("/sign-in")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => setLocation("/sign-up")}
          className="px-6 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Create Account
        </button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Customer?{" "}
        <button onClick={() => setLocation("/portal")} className="text-primary hover:underline font-medium">
          Go to Customer Portal
        </button>
      </p>
    </div>
  );
}

function AccessDeniedPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Seller access required</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Your account doesn't have seller access yet. Use an invite code to unlock the seller dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setLocation("/seller-access")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Claim Seller Access
        </button>
        <button
          onClick={() => setLocation("/portal")}
          className="px-6 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Customer Portal
        </button>
      </div>
    </div>
  );
}

function PortalSignInPrompt() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to your portal</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Access your orders, wishlist, and loyalty rewards by signing into your customer account.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setLocation("/sign-in")}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => setLocation("/sign-up")}
          className="px-6 py-2.5 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function ClerkAuthTokenSetup() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/seller-access" component={SellerAccess} />
      <Route path="/admin">
        <SellerRoute><AdminPanel /></SellerRoute>
      </Route>

      <Route path="/" component={HomeRedirect} />

      <Route path="/captions">
        <SellerRoute><Captions /></SellerRoute>
      </Route>
      <Route path="/captions/generate">
        <SellerRoute><CaptionsGenerate /></SellerRoute>
      </Route>
      <Route path="/broadcasts">
        <SellerRoute><Broadcasts /></SellerRoute>
      </Route>
      <Route path="/broadcasts/generate">
        <SellerRoute><BroadcastsGenerate /></SellerRoute>
      </Route>
      <Route path="/products">
        <SellerRoute><Products /></SellerRoute>
      </Route>
      <Route path="/orders">
        <SellerRoute><Orders /></SellerRoute>
      </Route>
      <Route path="/orders/:id">
        <SellerRoute><OrderDetail /></SellerRoute>
      </Route>

      <Route path="/portal">
        <PortalGuard><PortalDashboard /></PortalGuard>
      </Route>
      <Route path="/portal/orders">
        <PortalGuard><PortalOrders /></PortalGuard>
      </Route>
      <Route path="/portal/orders/:id">
        <PortalGuard><PortalOrderDetail /></PortalGuard>
      </Route>
      <Route path="/portal/wishlist">
        <PortalGuard><PortalWishlist /></PortalGuard>
      </Route>
      <Route path="/portal/loyalty">
        <PortalGuard><PortalLoyalty /></PortalGuard>
      </Route>
      <Route path="/portal/shop">
        <PortalGuard><PortalShop /></PortalGuard>
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Track orders, save favourites, earn rewards",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkAuthTokenSetup />
        <ClerkQueryClientCacheInvalidator />
        <CartProvider>
          <TooltipProvider>
            <AppRoutes />
          </TooltipProvider>
          <Toaster />
        </CartProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
