"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") fetchReports();
  }, [status]);

  async function fetchReports() {
    try {
      const res = await fetch("/api/reports");
      const d = await res.json();
      setData(d);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }

  function exportCSV(type: string) {
    if (!data) return;
    let csv = "";
    let filename = "";

    if (type === "revenue") {
      csv = "Month,Revenue\n" + (data.revenueByMonth || []).map((r: any) => `${r.month},${r.revenue}`).join("\n");
      filename = "revenue-report.csv";
    } else if (type === "deals") {
      csv = "Deal,Client,Value,Stage,Owner\n" + (data.deals || []).map((d: any) => `"${d.name}","${d.client?.name}",${d.value},${d.stage},"${d.owner?.name}"`).join("\n");
      filename = "deals-report.csv";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin h-8 w-8 border-4 border-[#1a71b4] border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and exports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#1a71b4]" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground mb-2">
              {formatCurrency(data?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-muted-foreground mb-4">Total revenue from won deals</p>
            <Button variant="outline" size="sm" onClick={() => exportCSV("revenue")}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#1a71b4]" />
              Deal Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground mb-2">{data?.totalDeals || 0}</p>
            <p className="text-sm text-muted-foreground mb-4">Total deals in pipeline</p>
            <Button variant="outline" size="sm" onClick={() => exportCSV("deals")}>
              <Download className="h-4 w-4 mr-2" /> Export Deals CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}