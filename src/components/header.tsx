"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";

  return (
    <header className="glass sticky top-0 z-30 h-16 px-4 lg:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="w-64 lg:w-80 h-9 pl-9 bg-muted/50 border-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </Button>
        </Link>

        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
          <div className="h-8 w-8 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold">
            {userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground leading-tight">{userName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}