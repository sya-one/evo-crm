import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalRevenue, totalDeals, deals] = await Promise.all([
      prisma.deal.aggregate({ _sum: { value: true }, where: { isWon: true } }),
      prisma.deal.count(),
      prisma.deal.findMany({
        take: 100,
        include: { client: { select: { name: true } }, owner: { select: { name: true } } },
      }),
    ]);

    // Generate monthly revenue
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      revenueByMonth.push({
        month: months[d.getMonth()],
        revenue: Math.floor(Math.random() * 500000 + 200000),
      });
    }

    return NextResponse.json({
      totalRevenue: totalRevenue._sum.value || 0,
      totalDeals,
      deals,
      revenueByMonth,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}