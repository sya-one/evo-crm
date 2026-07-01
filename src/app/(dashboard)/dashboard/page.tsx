"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#1a71b4", "#123d63", "#2d8bdb", "#4a9de0", "#6db5e8", "#8fc9f0"];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue || 0),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Active Deals",
      value: stats.activeDeals || 0,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Open Claims",
      value: stats.openClaims || 0,
      icon: FileText,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Total Clients",
      value: stats.totalClients || 0,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "SLA Breaches",
      value: stats.slaBreaches || 0,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Resolved This Month",
      value: stats.resolvedThisMonth || 0,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="stat-card hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold mt-3 text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#1a71b4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Deal Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deal Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.dealsByStage || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(stats.dealsByStage || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Deals"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.recentDeals || []).slice(0, 5).map((deal: any) => (
                <div key={deal.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                    <p className="text-xs text-muted-foreground">{deal.client?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(deal.value)}</p>
                    <Badge className={getStatusColor(deal.stage)} variant="outline">
                      {deal.stage}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!stats.recentDeals || stats.recentDeals.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent deals</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.recentClaims || []).slice(0, 5).map((claim: any) => (
                <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{claim.claimNumber}</p>
                    <p className="text-xs text-muted-foreground">{claim.client?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <Badge className={getStatusColor(claim.status)} variant="outline">
                      {claim.status}
                    </Badge>
                    {claim.escalated && (
                      <span className="ml-2 text-xs text-red-500 font-medium">Escalated</span>
                    )}
                  </div>
                </div>
              ))}
              {(!stats.recentClaims || stats.recentClaims.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent claims</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#1a71b4]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {(stats.recentActivities || []).slice(0, 8).map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-[#1a71b4]/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-[#1a71b4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.user?.name} • {formatDate(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {(!stats.recentActivities || stats.recentActivities.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}