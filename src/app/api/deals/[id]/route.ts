import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            consultant: { select: { id: true, name: true, email: true } },
            manager: { select: { id: true, name: true, email: true } },
            deals: { where: { id: { not: id } }, take: 5, orderBy: { createdAt: "desc" } },
            claims: { take: 5, orderBy: { createdAt: "desc" } },
            queries: { take: 5, orderBy: { createdAt: "desc" } },
          },
        },
        owner: { select: { id: true, name: true, email: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } },
        },
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error("Deal fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const userId = (session.user as any).id;

    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const changes: string[] = [];
    if (body.stage && body.stage !== existing.stage) changes.push(`Stage changed from ${existing.stage} to ${body.stage}`);
    if (body.priority && body.priority !== existing.priority) changes.push(`Priority changed from ${existing.priority} to ${body.priority}`);
    if (body.ownerId && body.ownerId !== existing.ownerId) changes.push("Owner changed");

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...(body.stage && { stage: body.stage, isWon: body.stage === "WON", isLost: body.stage === "LOST" }),
        ...(body.priority && { priority: body.priority }),
        ...(body.ownerId && { ownerId: body.ownerId }),
        ...(body.name && { name: body.name }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.expectedCloseDate && { expectedCloseDate: new Date(body.expectedCloseDate) }),
      },
    });

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: { type: "DEAL_UPDATED", message: changes.join("; "), userId, dealId: id, clientId: deal.clientId },
      });
    }

    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}