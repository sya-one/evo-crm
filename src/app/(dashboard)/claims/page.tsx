"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ClaimsPage() {
  const { data: session, status } = useSession();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchClaims();
  }, [status]);

  async function fetchClaims() {
    try {
      const res = await fetch("/api/claims");
      const data = await res.json();
      setClaims(data);
    } catch (error) {
      toast.error("Failed to fetch claims");
    } finally {
      setLoading(false);
    }
  }

  const filtered = claims.filter((c) =>
    c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claims</h1>
          <p className="text-muted-foreground">Manage insurance claims</p>
        </div>
        <Link href="/claims/new">
          <Button className="sidebar-gradient">
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search claims..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Claim #</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">SLA Due</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Escalated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((claim) => (
                  <tr key={claim.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/claims/${claim.id}`} className="text-sm font-medium text-[#1a71b4] hover:underline">
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-foreground">{claim.client?.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{claim.department || "-"}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(claim.priority)} variant="outline">{claim.priority}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(claim.status)} variant="outline">{claim.status}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(claim.slaDueDate)}</td>
                    <td className="p-4">
                      {claim.escalated ? (
                        <span className="flex items-center gap-1 text-red-500 text-sm">
                          <AlertTriangle className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}