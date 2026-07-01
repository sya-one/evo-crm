"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") redirect("/login");
  const role = (session?.user as any)?.role;
  if (role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">System configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="h-14 w-14 rounded-xl sidebar-gradient flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">EVO CRM</h3>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              <p className="text-sm text-muted-foreground">Financial Services Platform</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">App Name</Label>
              <p className="text-sm font-medium text-foreground">EVO CRM</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Environment</Label>
              <p className="text-sm font-medium text-foreground capitalize">Development</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Database</Label>
              <p className="text-sm font-medium text-foreground">MySQL</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Authentication</Label>
              <p className="text-sm font-medium text-foreground">NextAuth (Credentials)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}