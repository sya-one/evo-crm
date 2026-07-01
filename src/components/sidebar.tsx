"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  HelpCircle,
  Users,
  UserCog,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER", "CONSULTANT"] },
  { name: "Deals", href: "/deals", icon: TrendingUp, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER", "CONSULTANT"] },
  { name: "Claims", href: "/claims", icon: FileText, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER", "CONSULTANT", "SUPPORT_AGENT"] },
  { name: "Queries", href: "/queries", icon: HelpCircle, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER", "CONSULTANT", "SUPPORT_AGENT"] },
  { name: "Clients", href: "/clients", icon: Users, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER", "CONSULTANT", "SUPPORT_AGENT"] },
  { name: "Users", href: "/users", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "EXECUTIVE", "MANAGER"] },
  { name: "Import", href: "/import", icon: Upload, roles: ["SUPER_ADMIN", "MANAGER", "CONSULTANT"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = (session?.user as any)?.role || "";
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 rounded-lg sidebar-gradient flex items-center justify-center shadow-lg"
      >
        {mobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-gradient fixed top-0 left-0 z-40 h-screen transition-all duration-300 flex flex-col",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-white/10", collapsed && "justify-center")}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight truncate">EVO CRM</h1>
                <p className="text-white/60 text-[10px] leading-tight truncate">Financial Services</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-white")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-3">
          {!collapsed && (
            <div className="mb-3 px-1">
              <p className="text-white text-sm font-medium truncate">{userName}</p>
              <p className="text-white/50 text-xs truncate">{userEmail}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-[10px] font-medium">
                {userRole.replace("_", " ")}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 ml-auto hidden lg:flex"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}