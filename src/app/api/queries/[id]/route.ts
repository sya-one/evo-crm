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

    const query = await prisma.query.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            consultant: { select: { id: true, name: true, email: true } },
            manager: { select: { id: true, name: true, email: true } },
            deals: { take: 5, orderBy: { createdAt: "desc" } },
            claims: { take: 5, orderBy: { createdAt: "desc" } },
            queries: { where: { id: { not: id } }, take: 5, orderBy: { createdAt: "desc" } },
          },
        },
        consultant: { select: { id: true, name: true, email: true } },
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

    if (!query) return NextResponse.json({ error: "Query not found" }, { status: 404 });
    return NextResponse.json(query);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch query" }, { status: 500 });
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

    const existing = await prisma.query.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const changes: string[] = [];
    if (body.status && body.status !== existing.status) changes.push(`Status changed from ${existing.status} to ${body.status}`);

    const updated = await prisma.query.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(body.consultantId && { consultantId: body.consultantId }),
      },
    });

    if (changes.length > 0) {
      await prisma.activityLog.create({
        data: { type: "QUERY_UPDATED", message: changes.join("; "), userId, queryId: id, clientId: updated.clientId },
      });
    }

    return NextResponse.json(updated);
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
    await prisma.query.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}