"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Search, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchClients();
  }, [status]);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      toast.error("Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">Client 360° profiles</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <Link key={client.id} href={`/clients/${client.id}`}>
            <Card className="hover-lift cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl sidebar-gradient flex items-center justify-center text-white font-bold text-lg">
                    {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.company || "Independent"}</p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{client._count?.deals || 0}</p>
                    <p className="text-xs text-muted-foreground">Deals</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{client._count?.claims || 0}</p>
                    <p className="text-xs text-muted-foreground">Claims</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{client._count?.queries || 0}</p>
                    <p className="text-xs text-muted-foreground">Queries</p>
                  </div>
                </div>
                {client.lifetimeRevenue > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
                    <p className="font-bold text-[#1a71b4]">{formatCurrency(client.lifetimeRevenue)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}