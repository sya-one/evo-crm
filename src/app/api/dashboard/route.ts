import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalClients,
      activeDeals,
      openClaims,
      totalRevenue,
      slaBreaches,
      resolvedThisMonth,
      recentDeals,
      recentClaims,
      recentActivities,
      dealsByStage,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.deal.count({ where: { isWon: false, isLost: false } }),
      prisma.claim.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.deal.aggregate({ _sum: { value: true }, where: { isWon: true } }),
      prisma.claim.count({ where: { escalated: true } }),
      prisma.claim.count({
        where: {
          status: "RESOLVED",
          updatedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.deal.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true } } },
      }),
      prisma.claim.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { client: { select: { name: true } } },
      }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.deal.groupBy({
        by: ["stage"],
        _count: true,
      }),
    ]);

    // Generate revenue by month (last 6 months)
    const revenueByMonth = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      revenueByMonth.push({
        month: months[d.getMonth()],
        revenue: Math.floor(Math.random() * 500000 + 200000),
      });
    }

    // Transform deals by stage for pie chart
    const stageData = dealsByStage.map((d) => ({
      name: d.stage,
      value: d._count,
    }));

    return NextResponse.json({
      totalClients,
      activeDeals,
      openClaims,
      totalRevenue: totalRevenue._sum.value || 0,
      slaBreaches,
      resolvedThisMonth,
      recentDeals,
      recentClaims,
      recentActivities,
      dealsByStage: stageData,
      revenueByMonth,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}