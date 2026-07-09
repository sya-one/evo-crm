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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        consultant: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        deals: {
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { id: true, name: true } },
          },
        },
        claims: {
          orderBy: { createdAt: "desc" },
          include: {
            consultant: { select: { id: true, name: true } },
          },
        },
        queries: {
          orderBy: { createdAt: "desc" },
          include: {
            consultant: { select: { id: true, name: true } },
          },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}