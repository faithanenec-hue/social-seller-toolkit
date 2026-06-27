import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

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
import NotFound from "@/pages/not-found";

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
        fallbackRedirectUrl={`${basePath}/portal`}
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

function PortalGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <PortalSignInPrompt />
      </Show>
    </>
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
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/captions" component={Captions} />
            <Route path="/captions/generate" component={CaptionsGenerate} />
            <Route path="/broadcasts" component={Broadcasts} />
            <Route path="/broadcasts/generate" component={BroadcastsGenerate} />
            <Route path="/orders" component={Orders} />
            <Route path="/orders/:id" component={OrderDetail} />
            <Route path="/portal">
              <PortalGuard><PortalDashboard /></PortalGuard>
            </Route>
            <Route path="/portal/orders">
              <PortalGuard><PortalOrders /></PortalGuard>
            </Route>
            <Route path="/portal/orders/:id">
              {(params) => <PortalGuard><PortalOrderDetail /></PortalGuard>}
            </Route>
            <Route path="/portal/wishlist">
              <PortalGuard><PortalWishlist /></PortalGuard>
            </Route>
            <Route path="/portal/loyalty">
              <PortalGuard><PortalLoyalty /></PortalGuard>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
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
            subtitle: "Sign in to your customer account",
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
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
        <Toaster />
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
