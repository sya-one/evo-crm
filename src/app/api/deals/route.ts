import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        owner: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(deals);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const deal = await prisma.deal.create({
      data: {
        name: body.name,
        clientId: body.clientId,
        ownerId: (session.user as any).id,
        value: parseFloat(body.value) || 0,
        priority: body.priority || "MEDIUM",
        stage: body.stage || "NEW",
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        phoneNumber: body.phoneNumber,
      },
      include: {
        client: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "DEAL_CREATED",
        message: `Deal "${deal.name}" was created`,
        userId: (session.user as any).id,
        clientId: body.clientId,
        dealId: deal.id,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updateData } = body;

    const deal = await prisma.deal.update({
      where: { id },
      data: {
        ...updateData,
        expectedCloseDate: updateData.expectedCloseDate ? new Date(updateData.expectedCloseDate) : undefined,
        isWon: updateData.stage === "WON" ? true : updateData.isWon,
        isLost: updateData.stage === "LOST" ? true : updateData.isLost,
      },
    });

    await prisma.activityLog.create({
      data: {
        type: "DEAL_UPDATED",
        message: `Deal "${deal.name}" was updated to stage ${deal.stage}`,
        userId: (session.user as any).id,
        dealId: deal.id,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 });
  }
}