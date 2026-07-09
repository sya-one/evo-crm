import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { rows, type } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    if (type === "clients") {
      // Get the current user as default consultant
      const userId = (session.user as any).id;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          // Map CSV columns to client fields
          const clientData: any = {
            name: row.primary_contact_name || row.company_name || `Client ${i + 1}`,
            company: row.company_name || null,
            email: null,
            phone: null,
            consultantId: userId,
            lifetimeRevenue: parseFloat(row.estimated_annual_revenue) || 0,
            satisfactionScore: 0,
            riskScore: 0,
          };

          // Check if client with same company already exists
          if (clientData.company) {
            const existing = await prisma.client.findFirst({
              where: { company: clientData.company },
            });
            if (existing) {
              results.skipped++;
              results.errors.push(`Row ${i + 1}: Company "${clientData.company}" already exists`);
              continue;
            }
          }

          await prisma.client.create({ data: clientData });
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    } else if (type === "deals") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const userId = (session.user as any).id;

          // Find or create client
          let clientId = row.clientId;
          if (!clientId && row.company_name) {
            const client = await prisma.client.findFirst({
              where: { company: row.company_name },
            });
            if (client) {
              clientId = client.id;
            } else {
              // Create client on the fly
              const newClient = await prisma.client.create({
                data: {
                  name: row.primary_contact_name || row.company_name,
                  company: row.company_name,
                  consultantId: userId,
                  lifetimeRevenue: parseFloat(row.estimated_annual_revenue) || 0,
                },
              });
              clientId = newClient.id;
            }
          }

          if (!clientId) {
            results.errors.push(`Row ${i + 1}: No client found or specified`);
            continue;
          }

          const stageMap: Record<string, string> = {
            "Introductory Meeting": "CONTACTED",
            "Needs Analysis": "QUALIFIED",
            "Proposal Sent": "PROPOSAL_SENT",
            "Negotiation": "NEGOTIATION",
            "Won": "WON",
            "Lost": "LOST",
          };

          await prisma.deal.create({
            data: {
              name: `${row.product || "Deal"} - ${row.company_name || "Unknown"}`,
              clientId,
              ownerId: userId,
              value: parseFloat(row.estimated_annual_revenue) || 0,
              priority: "MEDIUM",
              stage: (stageMap[row.status] as any) || "NEW",
              expectedCloseDate: row.created_at ? new Date(row.created_at) : null,
            },
          });
          results.imported++;
        } catch (err: any) {
          results.errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}