import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquareText,
  Megaphone,
  ShoppingBag,
  Store,
  Heart,
  Gift,
  Menu,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isPortal = location.startsWith("/portal");

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

  const currentNav = mode === "seller" ? sellerNav : portalNav;

  const NavLinks = () => (
    <>
      {currentNav.map((item) => (
        <Link key={item.path} href={item.path}>
          <div
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
            <nav className="flex-1 space-y-2">
              <NavLinks />
            </nav>
            <div className="pt-4 border-t flex items-center gap-3">
              <Switch checked={mode === "portal"} onCheckedChange={toggleMode} id="mobile-mode-toggle" />
              <Label htmlFor="mobile-mode-toggle" className="cursor-pointer">
                {mode === "portal" ? "Customer Portal" : "Seller Mode"}
              </Label>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r px-4 py-6 shadow-sm z-10">
        <div className="flex items-center gap-2 font-bold text-2xl text-primary mb-8 px-2">
          <Store className="h-8 w-8 text-secondary" />
          <span>Social<span className="text-foreground">Seller</span></span>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLinks />
        </nav>
        <div className="mt-auto pt-4 border-t">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
            <Label htmlFor="desktop-mode-toggle" className="text-sm font-medium cursor-pointer">
              {mode === "portal" ? "Customer Portal" : "Seller Mode"}
            </Label>
            <Switch checked={mode === "portal"} onCheckedChange={toggleMode} id="desktop-mode-toggle" />
          </div>
        </div>
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
