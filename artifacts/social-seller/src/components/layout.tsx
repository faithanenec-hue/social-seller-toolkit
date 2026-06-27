import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { useRole, isSellerOrAdmin } from "@/hooks/useRole";
import {
  LayoutDashboard,
  MessageSquareText,
  Megaphone,
  ShoppingBag,
  Store,
  Heart,
  Gift,
  Menu,
  LogOut,
  UserCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isPortal = location.startsWith("/portal");

  const { user } = useUser();
  const { signOut } = useClerk();
  const { role } = useRole();
  const isSeller = isSellerOrAdmin(role);

  const [mode, setMode] = useState<"seller" | "portal">(isPortal ? "portal" : "seller");

  const toggleMode = (checked: boolean) => {
    const newMode = checked ? "portal" : "seller";
    setMode(newMode);
    if (newMode === "portal") {
      setLocation("/portal");
    } else {
      setLocation("/");
    }
  };

  const sellerNav = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Captions", path: "/captions", icon: MessageSquareText },
    { name: "Broadcasts", path: "/broadcasts", icon: Megaphone },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
  ];

  const portalNav = [
    { name: "Dashboard", path: "/portal", icon: LayoutDashboard },
    { name: "My Orders", path: "/portal/orders", icon: ShoppingBag },
    { name: "Wishlist", path: "/portal/wishlist", icon: Heart },
    { name: "Loyalty", path: "/portal/loyalty", icon: Gift },
  ];

  const currentNav = !user ? [] : (!isSeller || mode === "portal") ? portalNav : sellerNav;

  const RoleBadge = () => {
    if (role === "admin") return <Badge className="text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-100">Admin</Badge>;
    if (role === "seller") return <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">Seller</Badge>;
    return <Badge variant="outline" className="text-xs text-muted-foreground">Customer</Badge>;
  };

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {currentNav.map((item) => (
        <Link key={item.path} href={item.path}>
          <div
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              location === item.path || (item.path !== "/" && item.path !== "/portal" && location.startsWith(item.path))
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </div>
        </Link>
      ))}
    </>
  );

  const UserFooter = () => (
    <div className="mt-auto pt-4 border-t space-y-2">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/50">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <UserCircle2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}
            </p>
            <RoleBadge />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {user?.emailAddresses?.[0]?.emailAddress}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => signOut({ redirectUrl: `${basePath || "/"}/` })}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );

  const ModeToggle = ({ id }: { id: string }) => (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-1.5">
        {mode === "portal" ? <Users className="h-3.5 w-3.5 text-muted-foreground" /> : <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {mode === "portal" ? "Customer Portal" : "Seller Mode"}
        </Label>
      </div>
      <Switch checked={mode === "portal"} onCheckedChange={toggleMode} id={id} />
    </div>
  );

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <nav className="flex-1 space-y-2">
        <NavLinks onNavigate={onNavigate} />
      </nav>

      {user ? (
        <div className="space-y-3">
          {isSeller && (
            <ModeToggle id={`mode-toggle-${onNavigate ? "mobile" : "desktop"}`} />
          )}
          <UserFooter />
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { setLocation("/sign-in"); onNavigate?.(); }}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="w-full"
            onClick={() => { setLocation("/sign-up"); onNavigate?.(); }}
          >
            Sign Up
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Store className="h-6 w-6" />
          Toolkit
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] p-6 flex flex-col">
            <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
              <Store className="h-8 w-8" />
              SocialSeller
            </div>
            <SidebarContent onNavigate={() => {}} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r px-4 py-6 shadow-sm z-10">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8 px-2">
          <Store className="h-8 w-8 text-secondary" />
          <span>Social<span className="text-foreground">Seller</span></span>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
