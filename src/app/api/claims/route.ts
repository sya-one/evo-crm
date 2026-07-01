import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const claims = await prisma.claim.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, company: true } },
        consultant: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Generate claim number
    const counter = await prisma.counter.upsert({
      where: { name: "claim" },
      update: { value: { increment: 1 } },
      create: { name: "claim", value: 1 },
    });

    const claimNumber = `CLM-2026-${String(counter.value).padStart(6, "0")}`;

    // Calculate SLA due date (5 business days by default)
    const slaDueDate = new Date();
    slaDueDate.setDate(slaDueDate.getDate() + 5);

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        clientId: body.clientId,
        consultantId: body.consultantId || (session.user as any).id,
        department: body.department,
        priority: body.priority || "MEDIUM",
        status: "OPEN",
        slaDueDate,
        description: body.description,
        attachments: body.attachments,
      },
      include: {
        client: { select: { id: true, name: true } },
        consultant: { select: { id: true, name: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        type: "CLAIM_CREATED",
        message: `Claim ${claimNumber} was created`,
        userId: (session.user as any).id,
        clientId: body.clientId,
        claimId: claim.id,
      },
    });

    // Create notification
    const managers = await prisma.user.findMany({
      where: { role: { name: { in: ["MANAGER", "EXECUTIVE"] } } },
    });
    for (const manager of managers) {
      await prisma.notification.create({
        data: {
          userId: manager.id,
          title: "New Claim Created",
          message: `Claim ${claimNumber} has been created and requires attention`,
          link: `/claims/${claim.id}`,
        },
      });
    }

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updateData } = body;

    const claim = await prisma.claim.update({
      where: { id },
      data: {
        ...updateData,
        slaDueDate: updateData.slaDueDate ? new Date(updateData.slaDueDate) : undefined,
      },
    });

    // Check SLA breach
    if (claim.slaDueDate && new Date() > claim.slaDueDate && !claim.escalated) {
      await prisma.claim.update({
        where: { id },
        data: { escalated: true },
      });

      const executives = await prisma.user.findMany({
        where: { role: { name: { in: ["MANAGER", "EXECUTIVE"] } } },
      });
      for (const exec of executives) {
        await prisma.notification.create({
          data: {
            userId: exec.id,
            title: "SLA Breach - Claim Escalated",
            message: `Claim ${claim.claimNumber} has breached its SLA and been escalated`,
            link: `/claims/${claim.id}`,
          },
        });
      }
    }

    return NextResponse.json(claim);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await prisma.claim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}