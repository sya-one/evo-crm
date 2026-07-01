"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export default function QueriesPage() {
  const { data: session, status } = useSession();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchQueries();
  }, [status]);

  async function fetchQueries() {
    try {
      const res = await fetch("/api/queries");
      const data = await res.json();
      setQueries(data);
    } catch (error) {
      toast.error("Failed to fetch queries");
    } finally {
      setLoading(false);
    }
  }

  const filtered = queries.filter((q) =>
    q.queryNumber.toLowerCase().includes(search.toLowerCase()) ||
    q.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Queries</h1>
          <p className="text-muted-foreground">Manage client queries</p>
        </div>
        <Link href="/queries/new">
          <Button className="sidebar-gradient">
            <Plus className="h-4 w-4 mr-2" />
            New Query
          </Button>
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search queries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Query #</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Department</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">SLA Due</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Escalated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((query) => (
                  <tr key={query.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/queries/${query.id}`} className="text-sm font-medium text-[#1a71b4] hover:underline">
                        {query.queryNumber}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-foreground">{query.client?.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{query.department || "-"}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(query.priority)} variant="outline">{query.priority}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(query.status)} variant="outline">{query.status}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(query.slaDueDate)}</td>
                    <td className="p-4">
                      {query.escalated ? <span className="text-red-500 text-sm font-medium">Yes</span> : <span className="text-sm text-muted-foreground">No</span>}
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