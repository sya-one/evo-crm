"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Plus, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

export default function DealsPage() {
  const { data: session, status } = useSession();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [view, setView] = useState<"list" | "kanban">("kanban");

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") fetchDeals();
  }, [status]);

  async function fetchDeals() {
    try {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(data);
    } catch (error) {
      toast.error("Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }

  async function updateDealStage(dealId: string, newStage: string) {
    try {
      const res = await fetch(`/api/deals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dealId, stage: newStage }),
      });
      if (res.ok) {
        toast.success("Deal stage updated");
        fetchDeals();
      }
    } catch (error) {
      toast.error("Failed to update deal");
    }
  }

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = deal.name.toLowerCase().includes(search.toLowerCase()) ||
      deal.client?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "ALL" || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Kanban Board View
  if (view === "kanban") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Deals</h1>
            <p className="text-muted-foreground">Manage your sales pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setView("list")}>
              List View
            </Button>
            <Link href="/deals/new">
              <Button className="sidebar-gradient">
                <Plus className="h-4 w-4 mr-2" />
                New Deal
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto kanban-scroll pb-4" style={{ minHeight: "500px" }}>
          {STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-72">
                <div className="bg-muted/50 rounded-lg p-3 h-full">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-sm font-semibold text-foreground">{stage.replace("_", " ")}</h3>
                    <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {stageDeals.map((deal) => (
                      <Link key={deal.id} href={`/deals/${deal.id}`}>
                        <div className="bg-card rounded-lg p-3 border border-border hover:shadow-md transition-all duration-200 cursor-pointer hover-lift">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-foreground truncate flex-1">{deal.name}</p>
                            <Badge className={`ml-2 text-[10px] ${getStatusColor(deal.priority)}`} variant="outline">
                              {deal.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{deal.client?.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">{formatCurrency(deal.value)}</span>
                            <span className="text-xs text-muted-foreground">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "No date"}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {stageDeals.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No deals</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setView("kanban")}>
            Kanban View
          </Button>
          <Link href="/deals/new">
            <Button className="sidebar-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Deal Name</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Value</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stage</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Close Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/deals/${deal.id}`} className="text-sm font-medium text-foreground hover:text-[#1a71b4]">
                        {deal.name}
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{deal.client?.name}</td>
                    <td className="p-4 text-sm font-semibold text-foreground">{formatCurrency(deal.value)}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(deal.stage)} variant="outline">{deal.stage}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(deal.priority)} variant="outline">{deal.priority}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(deal.expectedCloseDate)}</td>
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