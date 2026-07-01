import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const queries = await prisma.query.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } }, consultant: { select: { id: true, name: true } } },
    });
    return NextResponse.json(queries);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch queries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const counter = await prisma.counter.upsert({
      where: { name: "query" },
      update: { value: { increment: 1 } },
      create: { name: "query", value: 1 },
    });

    const queryNumber = `QRY-2026-${String(counter.value).padStart(6, "0")}`;
    const slaDueDate = new Date();
    slaDueDate.setDate(slaDueDate.getDate() + 3);

    const query = await prisma.query.create({
      data: {
        queryNumber,
        clientId: body.clientId,
        consultantId: body.consultantId || (session.user as any).id,
        department: body.department,
        priority: body.priority || "MEDIUM",
        status: "OPEN",
        slaDueDate,
        notes: body.notes,
        attachments: body.attachments,
      },
      include: { client: { select: { id: true, name: true } }, consultant: { select: { id: true, name: true } } },
    });

    await prisma.activityLog.create({
      data: {
        type: "QUERY_CREATED",
        message: `Query ${queryNumber} was created`,
        userId: (session.user as any).id,
        clientId: body.clientId,
        queryId: query.id,
      },
    });

    return NextResponse.json(query, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create query" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updateData } = body;
    const query = await prisma.query.update({ where: { id }, data: updateData });
    return NextResponse.json(query);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update query" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await prisma.query.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete query" }, { status: 500 });
  }
}