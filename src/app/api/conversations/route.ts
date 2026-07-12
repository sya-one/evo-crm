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
    const { parentType, parentId, message } = body;

    if (!parentType || !parentId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { parentType, [parentType === "deal" ? "dealId" : parentType === "claim" ? "claimId" : "queryId"]: parentId },
    });

    if (!conversation) {
      const data: any = { parentType };
      if (parentType === "deal") data.dealId = parentId;
      else if (parentType === "claim") data.claimId = parentId;
      else if (parentType === "query") data.queryId = parentId;
      conversation = await prisma.conversation.create({ data });
    }

    const msg = await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, userId, message },
      include: { user: { select: { id: true, name: true } } },
    });

    // Create activity log
    const typeLabel = parentType.charAt(0).toUpperCase() + parentType.slice(1);
    await prisma.activityLog.create({
      data: {
        type: `${typeLabel}_MESSAGE`,
        message: `New message added to ${typeLabel}`,
        userId,
        [`${parentType}Id`]: parentId,
      },
    });

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}