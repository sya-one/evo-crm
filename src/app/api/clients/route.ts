import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        consultant: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        _count: { select: { deals: true, claims: true, queries: true } },
      },
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        company: body.company,
        email: body.email,
        phone: body.phone,
        consultantId: body.consultantId,
        managerId: body.managerId,
        lifetimeRevenue: parseFloat(body.lifetimeRevenue) || 0,
        satisfactionScore: parseInt(body.satisfactionScore) || 0,
        riskScore: parseInt(body.riskScore) || 0,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}