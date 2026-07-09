"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getInitials } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  Users,
  TrendingUp,
  FileText,
  HelpCircle,
  Activity,
  Shield,
  DollarSign,
  Target,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "deals" | "claims" | "queries" | "activity">("overview");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && params.id) {
      fetchClient();
    }
  }, [status, params.id]);

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${params.id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setClient(data);
    } catch (error) {
      toast.error("Client not found");
      router.push("/clients");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!client) return null;

  const wonDeals = client.deals?.filter((d: any) => d.isWon) || [];
  const lostDeals = client.deals?.filter((d: any) => d.isLost) || [];
  const activeDeals = client.deals?.filter((d: any) => !d.isWon && !d.isLost) || [];
  const openClaims = client.claims?.filter((c: any) => c.status === "OPEN" || c.status === "IN_PROGRESS") || [];
  const openQueries = client.queries?.filter((q: any) => q.status === "OPEN" || q.status === "IN_PROGRESS") || [];
  const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + d.value, 0);

  function getRiskColor(score: number): string {
    if (score >= 40) return "text-red-500";
    if (score >= 20) return "text-yellow-500";
    return "text-green-500";
  }

  function getSatisfactionColor(score: number): string {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="h-14 w-14 rounded-xl sidebar-gradient flex items-center justify-center text-white font-bold text-xl">
            {getInitials(client.name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {client.company && (
                <>
                  <Building2 className="h-4 w-4" />
                  {client.company}
                </>
              )}
              {client.email && (
                <>
                  <Mail className="h-4 w-4 ml-2" />
                  {client.email}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue (Won Deals)</p>
          </CardContent>
        </Card>
        <Card className="stat-card hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{activeDeals.length}</p>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </CardContent>
        </Card>
        <Card className="stat-card hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{openClaims.length}</p>
            <p className="text-xs text-muted-foreground">Open Claims</p>
          </CardContent>
        </Card>
        <Card className="stat-card hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{openQueries.length}</p>
            <p className="text-xs text-muted-foreground">Open Queries</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-foreground hover:text-[#1a71b4]">{client.email}</a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{client.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="text-sm text-foreground">{client.company || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Client Since</p>
                  <p className="text-sm text-foreground">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.consultant && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full sidebar-gradient flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(client.consultant.name)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Consultant</p>
                    <p className="text-sm font-medium text-foreground">{client.consultant.name}</p>
                    <p className="text-xs text-muted-foreground">{client.consultant.email}</p>
                  </div>
                </div>
              )}
              {client.manager && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#123d63] flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(client.manager.name)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manager</p>
                    <p className="text-sm font-medium text-foreground">{client.manager.name}</p>
                    <p className="text-xs text-muted-foreground">{client.manager.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Satisfaction Score</span>
                  <span className={`text-sm font-bold ${getSatisfactionColor(client.satisfactionScore)}`}>
                    {client.satisfactionScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 transition-all"
                    style={{ width: `${client.satisfactionScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                  <span className={`text-sm font-bold ${getRiskColor(client.riskScore)}`}>
                    {client.riskScore}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 transition-all"
                    style={{ width: `${client.riskScore}%` }}
                  />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(client.lifetimeRevenue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {[
              { id: "overview" as const, label: "Overview", icon: Shield },
              { id: "deals" as const, label: "Deals", icon: TrendingUp },
              { id: "claims" as const, label: "Claims", icon: FileText },
              { id: "queries" as const, label: "Queries", icon: HelpCircle },
              { id: "activity" as const, label: "Activity", icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.activities?.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                      <div className="h-8 w-8 rounded-full bg-[#1a71b4]/10 flex items-center justify-center flex-shrink-0">
                        <Activity className="h-4 w-4 text-[#1a71b4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.user?.name} • {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!client.activities || client.activities.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Active Items Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{activeDeals.length}</p>
                      <p className="text-xs text-muted-foreground">Active Deals</p>
                      <p className="text-lg font-semibold text-blue-500 mt-1">
                        {formatCurrency(activeDeals.reduce((s: number, d: any) => s + d.value, 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <FileText className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{openClaims.length}</p>
                      <p className="text-xs text-muted-foreground">Open Claims</p>
                      <p className="text-lg font-semibold text-orange-500 mt-1">
                        {client.claims?.length || 0} Total
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <HelpCircle className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{openQueries.length}</p>
                      <p className="text-xs text-muted-foreground">Open Queries</p>
                      <p className="text-lg font-semibold text-purple-500 mt-1">
                        {client.queries?.length || 0} Total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Deals Tab */}
          {activeTab === "deals" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Deals ({client.deals?.length || 0})</CardTitle>
                <Link href={`/deals/new?clientId=${client.id}`}>
                  <Button size="sm" className="sidebar-gradient">+ New Deal</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {client.deals?.map((deal: any) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`}>
                    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{deal.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(deal.stage)} variant="outline">{deal.stage}</Badge>
                          <Badge className={getStatusColor(deal.priority)} variant="outline">{deal.priority}</Badge>
                          <span className="text-xs text-muted-foreground">{deal.owner?.name}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm font-bold text-foreground">{formatCurrency(deal.value)}</p>
                        <p className="text-xs text-muted-foreground">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "No date"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!client.deals || client.deals.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No deals yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Claims Tab */}
          {activeTab === "claims" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Claims ({client.claims?.length || 0})</CardTitle>
                <Link href={`/claims/new?clientId=${client.id}`}>
                  <Button size="sm" className="sidebar-gradient">+ New Claim</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {client.claims?.map((claim: any) => (
                  <Link key={claim.id} href={`/claims/${claim.id}`}>
                    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a71b4]">{claim.claimNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(claim.status)} variant="outline">{claim.status}</Badge>
                          <Badge className={getStatusColor(claim.priority)} variant="outline">{claim.priority}</Badge>
                          {claim.escalated && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">SLA: {formatDate(claim.slaDueDate)}</p>
                        <p className="text-xs text-muted-foreground">{claim.department || "-"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!client.claims || client.claims.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No claims yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Queries Tab */}
          {activeTab === "queries" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Queries ({client.queries?.length || 0})</CardTitle>
                <Link href={`/queries/new?clientId=${client.id}`}>
                  <Button size="sm" className="sidebar-gradient">+ New Query</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {client.queries?.map((query: any) => (
                  <Link key={query.id} href={`/queries/${query.id}`}>
                    <div className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a71b4]">{query.queryNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(query.status)} variant="outline">{query.status}</Badge>
                          <Badge className={getStatusColor(query.priority)} variant="outline">{query.priority}</Badge>
                          {query.escalated && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-muted-foreground">SLA: {formatDate(query.slaDueDate)}</p>
                        <p className="text-xs text-muted-foreground">{query.department || "-"}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {(!client.queries || client.queries.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No queries yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {client.activities?.map((activity: any) => (
                    <div key={activity.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                      <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-[#1a71b4] bg-card z-10" />
                      <div className="ml-10 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {activity.type?.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</span>
                        </div>
                        <p className="text-sm text-foreground">{activity.message}</p>
                        {activity.user && (
                          <p className="text-xs text-muted-foreground mt-1">by {activity.user.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!client.activities || client.activities.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}