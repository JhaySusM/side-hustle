import { isAdminRequest, getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

function serializeReport(report) {
  return {
    id: report.id,
    reportType: report.reportType,
    details: report.details || "",
    imageUrl: report.imageUrl || "",
    status: report.status,
    priority: report.priority,
    actionTaken: report.actionTaken || "",
    adminNote: report.adminNote || "",
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt,
    reporter: {
      id: report.reporter.id,
      name: report.reporter.name || report.reporter.email,
      email: report.reporter.email,
    },
    seller: report.seller
      ? {
          id: report.seller.id,
          name: report.seller.name || report.seller.email,
          email: report.seller.email,
          status: report.seller.status,
        }
      : null,
    listing: report.listing
      ? {
          id: report.listing.id,
          title: report.listing.product_name,
          status: report.listing.product_status,
          seller: {
            id: report.listing.user.id,
            name: report.listing.user.name || report.listing.user.email,
            email: report.listing.user.email,
          },
        }
      : null,
  };
}

function summarizeReports(reports) {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const open = reports.filter((report) => report.status === "open").length;
  const resolvedToday = reports.filter((report) => {
    if (!report.resolvedAt) {
      return false;
    }

    const resolvedAt = new Date(report.resolvedAt).getTime();
    return Number.isFinite(resolvedAt) && now - resolvedAt <= oneDayMs;
  }).length;

  const resolvedReports = reports.filter((report) => report.resolvedAt);
  const avgResolutionHours = resolvedReports.length
    ? resolvedReports.reduce((sum, report) => {
        const created = new Date(report.createdAt).getTime();
        const resolved = new Date(report.resolvedAt).getTime();
        if (!Number.isFinite(created) || !Number.isFinite(resolved) || resolved < created) {
          return sum;
        }
        return sum + (resolved - created) / (1000 * 60 * 60);
      }, 0) / resolvedReports.length
    : 0;

  const bannedUsers = new Set(
    reports
      .filter((report) => report.actionTaken === "user_banned")
      .map((report) => report.listing?.user?.id || report.seller?.id)
      .filter(Boolean)
  ).size;

  return {
    open,
    resolvedToday,
    avgResolutionHours,
    bannedUsers,
  };
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.productReport) {
    return Response.json(
      { error: "Reports are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const reports = await prisma.productReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            product_name: true,
            product_status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      reports: reports.map(serializeReport),
      summary: summarizeReports(reports),
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.productReport) {
    return Response.json(
      { error: "Reports are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const reportId = Number(body.reportId);
    const nextStatus = body.status?.trim() || "resolved";
    const actionTaken = body.actionTaken?.trim() || null;
    const adminNote = body.adminNote?.trim() || null;

    if (!reportId) {
      return Response.json({ error: "reportId is required" }, { status: 400 });
    }

    const existing = await prisma.productReport.findUnique({
      where: { id: reportId },
      include: {
        listing: {
          select: {
            id: true,
            user_id: true,
          },
        },
        seller: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }

    if (actionTaken === "listing_removed" && existing.listing?.id) {
      await prisma.productList.update({
        where: { id: existing.listing.id },
        data: { product_status: "Inactive" },
      });
    }

    if (actionTaken === "user_suspended" || actionTaken === "user_banned") {
      const targetUserId = existing.listing?.user_id || existing.seller?.id;
      if (!targetUserId) {
        return Response.json({ error: "No report target user found" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: { status: "inactive" },
      });
    }

    const report = await prisma.productReport.update({
      where: { id: reportId },
      data: {
        status: nextStatus,
        actionTaken,
        adminNote,
        resolvedAt: nextStatus === "resolved" ? new Date() : null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            product_name: true,
            product_status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    await logActivity(prisma, {
      userId: existing.listing?.user_id || existing.seller?.id || null,
      actorId: admin.id,
      actorType: "admin",
      action: "report_resolved",
      category: "listing",
      status: "admin",
      detail: `${admin.name || admin.email} resolved report #${reportId}${actionTaken ? ` (${actionTaken})` : ""}`,
      request,
      metadata: { reportId, actionTaken },
    });

    return Response.json({ report: serializeReport(report) });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}
