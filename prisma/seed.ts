import { PrismaClient, Priority, DealStage, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Permissions
  const permissions = [
    { name: "dashboard:view", description: "View dashboard" },
    { name: "deals:read", description: "Read deals" },
    { name: "deals:create", description: "Create deals" },
    { name: "deals:update", description: "Update deals" },
    { name: "deals:delete", description: "Delete deals" },
    { name: "claims:read", description: "Read claims" },
    { name: "claims:create", description: "Create claims" },
    { name: "claims:update", description: "Update claims" },
    { name: "claims:delete", description: "Delete claims" },
    { name: "queries:read", description: "Read queries" },
    { name: "queries:create", description: "Create queries" },
    { name: "queries:update", description: "Update queries" },
    { name: "queries:delete", description: "Delete queries" },
    { name: "clients:read", description: "Read clients" },
    { name: "clients:create", description: "Create clients" },
    { name: "clients:update", description: "Update clients" },
    { name: "clients:delete", description: "Delete clients" },
    { name: "users:read", description: "Read users" },
    { name: "users:create", description: "Create users" },
    { name: "users:update", description: "Update users" },
    { name: "users:delete", description: "Delete users" },
    { name: "reports:view", description: "View reports" },
    { name: "reports:export", description: "Export reports" },
    { name: "import:execute", description: "Import data" },
    { name: "notifications:read", description: "Read notifications" },
    { name: "settings:manage", description: "Manage settings" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  // Create Roles with specific permissions
  const roleConfigs = [
    {
      name: "SUPER_ADMIN",
      description: "Full system access",
      permissions: allPermissions.map((p) => p.name),
    },
    {
      name: "EXECUTIVE",
      description: "Executive leadership access",
      permissions: [
        "dashboard:view",
        "deals:read",
        "claims:read",
        "queries:read",
        "clients:read",
        "reports:view",
        "reports:export",
        "notifications:read",
      ],
    },
    {
      name: "MANAGER",
      description: "Team management access",
      permissions: [
        "dashboard:view",
        "deals:read",
        "deals:create",
        "deals:update",
        "claims:read",
        "claims:create",
        "claims:update",
        "queries:read",
        "queries:create",
        "queries:update",
        "clients:read",
        "clients:create",
        "clients:update",
        "reports:view",
        "notifications:read",
      ],
    },
    {
      name: "CONSULTANT",
      description: "Consultant access",
      permissions: [
        "dashboard:view",
        "deals:read",
        "deals:create",
        "deals:update",
        "claims:read",
        "claims:create",
        "claims:update",
        "queries:read",
        "queries:create",
        "queries:update",
        "clients:read",
        "clients:create",
        "clients:update",
        "notifications:read",
      ],
    },
    {
      name: "SUPPORT_AGENT",
      description: "Support agent access",
      permissions: [
        "claims:read",
        "claims:create",
        "claims:update",
        "queries:read",
        "queries:create",
        "queries:update",
        "clients:read",
        "notifications:read",
      ],
    },
  ];

  for (const config of roleConfigs) {
    const role = await prisma.role.upsert({
      where: { name: config.name },
      update: { description: config.description },
      create: { name: config.name, description: config.description },
    });

    // Assign permissions
    for (const permName of config.permissions) {
      const perm = allPermissions.find((p) => p.name === permName);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  // Create Users
  const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  const executiveRole = await prisma.role.findUnique({ where: { name: "EXECUTIVE" } });
  const managerRole = await prisma.role.findUnique({ where: { name: "MANAGER" } });
  const consultantRole = await prisma.role.findUnique({ where: { name: "CONSULTANT" } });
  const supportRole = await prisma.role.findUnique({ where: { name: "SUPPORT_AGENT" } });

  const hashedPassword = await bcrypt.hash("Admin@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@evocrm.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@evocrm.com",
      password: hashedPassword,
      roleId: superAdminRole!.id,
    },
  });

  const executive = await prisma.user.upsert({
    where: { email: "executive@evocrm.com" },
    update: {},
    create: {
      name: "James Mitchell",
      email: "executive@evocrm.com",
      password: hashedPassword,
      roleId: executiveRole!.id,
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: "manager@evocrm.com" },
    update: {},
    create: {
      name: "Sarah Williams",
      email: "manager@evocrm.com",
      password: hashedPassword,
      roleId: managerRole!.id,
    },
  });

  const consultant1 = await prisma.user.upsert({
    where: { email: "consultant1@evocrm.com" },
    update: {},
    create: {
      name: "David Brown",
      email: "consultant1@evocrm.com",
      password: hashedPassword,
      roleId: consultantRole!.id,
    },
  });

  const consultant2 = await prisma.user.upsert({
    where: { email: "consultant2@evocrm.com" },
    update: {},
    create: {
      name: "Lisa Anderson",
      email: "consultant2@evocrm.com",
      password: hashedPassword,
      roleId: consultantRole!.id,
    },
  });

  const support = await prisma.user.upsert({
    where: { email: "support@evocrm.com" },
    update: {},
    create: {
      name: "Mike Johnson",
      email: "support@evocrm.com",
      password: hashedPassword,
      roleId: supportRole!.id,
    },
  });

  // Create Sample Clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "Thabo Mokoena",
        company: "Mokoena Holdings",
        email: "thabo@mokoena.co.za",
        phone: "+27 82 123 4567",
        consultantId: consultant1.id,
        managerId: manager1.id,
        lifetimeRevenue: 1250000,
        satisfactionScore: 85,
        riskScore: 20,
      },
    }),
    prisma.client.create({
      data: {
        name: "Priya Patel",
        company: "Patel Financial Services",
        email: "priya@patelfs.co.za",
        phone: "+27 83 234 5678",
        consultantId: consultant2.id,
        managerId: manager1.id,
        lifetimeRevenue: 890000,
        satisfactionScore: 92,
        riskScore: 10,
      },
    }),
    prisma.client.create({
      data: {
        name: "John van der Merwe",
        company: "Van der Merwe Investments",
        email: "john@vdm.co.za",
        phone: "+27 84 345 6789",
        consultantId: consultant1.id,
        managerId: manager1.id,
        lifetimeRevenue: 2100000,
        satisfactionScore: 78,
        riskScore: 35,
      },
    }),
    prisma.client.create({
      data: {
        name: "Nomsa Dlamini",
        company: "Dlamini Group",
        email: "nomsa@dlaminigroup.co.za",
        phone: "+27 72 456 7890",
        consultantId: consultant2.id,
        managerId: manager1.id,
        lifetimeRevenue: 560000,
        satisfactionScore: 95,
        riskScore: 5,
      },
    }),
    prisma.client.create({
      data: {
        name: "Ahmed Cassim",
        company: "Cassim Enterprises",
        email: "ahmed@cassim.co.za",
        phone: "+27 76 567 8901",
        consultantId: consultant1.id,
        managerId: manager1.id,
        lifetimeRevenue: 1780000,
        satisfactionScore: 72,
        riskScore: 45,
      },
    }),
  ]);

  // Create Sample Deals
  const dealData = [
    { name: "Retirement Fund Portfolio", clientIdx: 0, ownerId: consultant1.id, value: 500000, priority: "HIGH" as Priority, stage: "NEGOTIATION" as DealStage, expectedCloseDate: new Date("2026-08-15") },
    { name: "Unit Trust Investment", clientIdx: 0, ownerId: consultant1.id, value: 250000, priority: "MEDIUM" as Priority, stage: "PROPOSAL_SENT" as DealStage, expectedCloseDate: new Date("2026-07-01") },
    { name: "Tax Advisory Retainer", clientIdx: 1, ownerId: consultant2.id, value: 120000, priority: "LOW" as Priority, stage: "QUALIFIED" as DealStage, expectedCloseDate: new Date("2026-09-01") },
    { name: "Estate Planning Services", clientIdx: 1, ownerId: consultant2.id, value: 350000, priority: "HIGH" as Priority, stage: "CONTACTED" as DealStage, expectedCloseDate: new Date("2026-10-01") },
    { name: "Corporate Bond Issue", clientIdx: 2, ownerId: consultant1.id, value: 2000000, priority: "CRITICAL" as Priority, stage: "NEW" as DealStage, expectedCloseDate: new Date("2026-06-30") },
    { name: "Wealth Management Package", clientIdx: 2, ownerId: consultant1.id, value: 750000, priority: "HIGH" as Priority, stage: "NEGOTIATION" as DealStage, expectedCloseDate: new Date("2026-08-01") },
    { name: "Insurance Portfolio Review", clientIdx: 3, ownerId: consultant2.id, value: 85000, priority: "LOW" as Priority, stage: "WON" as DealStage, isWon: true, expectedCloseDate: new Date("2026-05-15") },
    { name: "Business Loan Facilitation", clientIdx: 4, ownerId: consultant1.id, value: 1500000, priority: "CRITICAL" as Priority, stage: "PROPOSAL_SENT" as DealStage, expectedCloseDate: new Date("2026-07-15") },
    { name: "Offshore Investment Setup", clientIdx: 4, ownerId: consultant1.id, value: 500000, priority: "MEDIUM" as Priority, stage: "LOST" as DealStage, isLost: true, expectedCloseDate: new Date("2026-04-01") },
    { name: "Healthcare Fund Advisory", clientIdx: 3, ownerId: consultant2.id, value: 200000, priority: "MEDIUM" as Priority, stage: "QUALIFIED" as DealStage, expectedCloseDate: new Date("2026-11-01") },
  ];

  for (const deal of dealData) {
    await prisma.deal.create({ data: { ...deal, clientId: clients[deal.clientIdx].id } });
  }

  // Create Sample Claims
  const claimStatuses: Status[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const departments = ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Property Insurance", "Investment Claims"];

  for (let i = 1; i <= 8; i++) {
    const clientIdx = i % clients.length;
    await prisma.claim.create({
      data: {
        claimNumber: `CLM-2026-${String(i).padStart(6, "0")}`,
        clientId: clients[clientIdx].id,
        consultantId: i % 2 === 0 ? consultant1.id : consultant2.id,
        department: departments[i % departments.length],
        priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL][i % 4],
        status: claimStatuses[i % 4],
        slaDueDate: new Date(2026, 6, 10 + i),
        description: `Claim description for ${clients[clientIdx].name} - ${departments[i % departments.length]} claim #${i}`,
        escalated: i > 6,
      },
    });
  }

  // Create Sample Queries
  for (let i = 1; i <= 6; i++) {
    const clientIdx = (i + 1) % clients.length;
    await prisma.query.create({
      data: {
        queryNumber: `QRY-2026-${String(i).padStart(6, "0")}`,
        clientId: clients[clientIdx].id,
        consultantId: i % 2 === 0 ? consultant1.id : consultant2.id,
        department: departments[i % departments.length],
        priority: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL][i % 4],
        status: claimStatuses[i % 4],
        slaDueDate: new Date(2026, 6, 5 + i),
        notes: `Query about ${departments[i % departments.length]} from ${clients[clientIdx].name}`,
        escalated: i > 5,
      },
    });
  }

  // Create Sample Activities
  const activityTypes = ["DEAL_CREATED", "DEAL_UPDATED", "DEAL_WON", "CLAIM_CREATED", "CLAIM_UPDATED", "QUERY_CREATED", "QUERY_RESOLVED", "CLIENT_UPDATED", "NOTE_ADDED"];

  for (let i = 0; i < 15; i++) {
    const clientIdx = i % clients.length;
    const deal = await prisma.deal.findFirst({ where: { clientId: clients[clientIdx].id }, orderBy: { createdAt: "desc" } });
    const claim = await prisma.claim.findFirst({ where: { clientId: clients[clientIdx].id }, orderBy: { createdAt: "desc" } });

    await prisma.activityLog.create({
      data: {
        type: activityTypes[i % activityTypes.length],
        message: `Activity ${i + 1}: ${activityTypes[i % activityTypes.length]} for ${clients[clientIdx].name}`,
        userId: i % 2 === 0 ? consultant1.id : consultant2.id,
        clientId: clients[clientIdx].id,
        dealId: deal?.id,
        claimId: claim?.id,
        createdAt: new Date(2026, 5, 28 - i, 8 + i, 30),
      },
    });
  }

  // Create Notifications
  const users = [admin, executive, manager1, consultant1, consultant2, support];
  const notificationTitles = [
    "New Claim Created",
    "SLA Breach Warning",
    "Deal Won!",
    "Query Resolved",
    "New Client Assigned",
  ];

  for (const user of users) {
    for (let i = 0; i < 3; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: notificationTitles[(i + users.indexOf(user)) % notificationTitles.length],
          message: `Notification message ${i + 1} for ${user.name}`,
          read: i > 0,
          link: i === 0 ? "/claims" : "/dashboard",
        },
      });
    }
  }

  // Create Counters
  await prisma.counter.upsert({
    where: { name: "claim" },
    update: {},
    create: { name: "claim", value: 9 },
  });
  await prisma.counter.upsert({
    where: { name: "query" },
    update: {},
    create: { name: "query", value: 7 },
  });

  console.log("✅ Database seeded successfully!");
  console.log("👤 Admin login: admin@evocrm.com / Admin@123456");
  console.log("👤 Test users: executive@evocrm.com, manager@evocrm.com, consultant1@evocrm.com, support@evocrm.com");
  console.log("🔑 All passwords: Admin@123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });