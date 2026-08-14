import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const USER_SELECT = { id: true, name: true, email: true };

const POINTS_LABEL = {
  earn_referral: "Points earned (referral)",
  spend_premium_slot: "Points redeemed (premium slot)",
  spend_boost: "Points redeemed (boost)",
  spend_badge: "Points redeemed (badge)",
  admin_adjustment: "Points adjusted by admin",
};

function nameOf(user) {
  if (!user) return null;
  return user.name || user.email || `User #${user.id}`;
}

function serializeLog(row) {
  return {
    id: `log-${row.id}`,
    time: row.createdAt,
    userId: row.userId,
    user: nameOf(row.user) || (row.metadata?.email ?? "Unknown user"),
    actorType: row.actorType,
    actor: nameOf(row.actor),
    action: row.action,
    category: row.category,
    status: row.status,
    detail: row.detail || "",
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
  };
}

function serializePoints(row) {
  const isSpend = row.points < 0;
  return {
    id: `pts-${row.id}`,
    time: row.createdAt,
    userId: row.userId,
    user: nameOf(row.user),
    actorType: row.type === "admin_adjustment" ? "admin" : "user",
    actor: null,
    action: row.type,
    category: "transaction",
    status: row.type === "admin_adjustment" ? "admin" : "success",
    detail: `${POINTS_LABEL[row.type] || row.type} — ${isSpend ? "" : "+"}${row.points} pts (balance ${row.balanceAfter})`,
    ipAddress: null,
    userAgent: null,
  };
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [logs, pointsTransactions] = await Promise.all([
      prisma.activityLog.findMany({
        include: { user: { select: USER_SELECT }, actor: { select: USER_SELECT } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.pointsTransaction.findMany({
        include: { user: { select: USER_SELECT } },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
    ]);

    const activities = [...logs.map(serializeLog), ...pointsTransactions.map(serializePoints)].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isToday = (value) => new Date(value).getTime() >= startOfToday.getTime();

    const eventsToday = activities.filter((a) => isToday(a.time)).length;
    const failedLogins = activities.filter((a) => a.action === "login_failed" && isToday(a.time)).length;
    const flaggedListingsToday = activities.filter((a) => a.action === "listing_reported" && isToday(a.time)).length;
    const newAccountsToday = activities.filter((a) => a.action === "account_created" && isToday(a.time)).length;

    return Response.json({
      activities,
      summary: { eventsToday, failedLogins, flaggedListingsToday, newAccountsToday },
    });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to load activity log" }, { status: 500 });
  }
}
