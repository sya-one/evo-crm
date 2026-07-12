import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;
    const body = await req.json();
    const { parentType, parentId, content } = body;

    if (!parentType || !parentId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data: any = { content, userId, parentType };
    if (parentType === "deal") data.dealId = parentId;
    else if (parentType === "claim") data.claimId = parentId;
    else if (parentType === "query") data.queryId = parentId;

    const note = await prisma.note.create({
      data,
      include: { user: { select: { id: true, name: true } } },
    });

    const typeLabel = parentType.charAt(0).toUpperCase() + parentType.slice(1);
    await prisma.activityLog.create({
      data: {
        type: `${typeLabel}_NOTE`,
        message: `Note added to ${typeLabel}`,
        userId,
        [`${parentType}Id`]: parentId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { id, content } = body;
    const note = await prisma.note.update({ where: { id }, data: { content } });
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}