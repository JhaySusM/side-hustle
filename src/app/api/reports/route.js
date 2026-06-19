import { requireRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REPORT_TYPE_PRIORITY = {
  scam: "high",
  fraud: "high",
  illegal_item: "high",
  abusive_seller: "medium",
  fake_item: "medium",
  spam: "low",
  wrong_category: "low",
  other: "medium",
};

function normalizeReportType(value) {
  return String(value || "").trim().toLowerCase();
}

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
    seller: report.seller
      ? {
          id: report.seller.id,
          name: report.seller.name || report.seller.email,
          email: report.seller.email,
        }
      : null,
    listing: report.listing
      ? {
          id: report.listing.id,
          title: report.listing.product_name,
          status: report.listing.product_status,
        }
      : null,
  };
}

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  if (!prisma.productReport) {
    return Response.json(
      { error: "Reports are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const reports = await prisma.productReport.findMany({
      where: { reporterId: user.id },
      include: {
        seller: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ reports: reports.map(serializeReport) });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  if (!prisma.productReport) {
    return Response.json(
      { error: "Reports are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const listingId = body.listingId ? Number(body.listingId) : null;
    const sellerId = body.sellerId ? Number(body.sellerId) : null;
    const reportType = normalizeReportType(body.reportType);
    const details = body.details?.trim() || "";
    const imageUrl = body.imageUrl?.trim() || null;

    if ((!listingId && !sellerId) || !reportType) {
      return Response.json(
        { error: "Either listingId or sellerId and reportType are required" },
        { status: 400 }
      );
    }

    let listing = null;
    let seller = null;

    if (listingId) {
      listing = await prisma.productList.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }

      if (listing.user_id === user.id) {
        return Response.json(
          { error: "You cannot report your own listing" },
          { status: 400 }
        );
      }

      const existingOpen = await prisma.productReport.findFirst({
        where: {
          listingId,
          reporterId: user.id,
          status: "open",
        },
        select: { id: true },
      });

      if (existingOpen) {
        return Response.json(
          { error: "You already have an open report for this listing" },
          { status: 409 }
        );
      }
    }

    if (sellerId) {
      seller = await prisma.user.findUnique({
        where: { id: sellerId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!seller) {
        return Response.json({ error: "Seller not found" }, { status: 404 });
      }

      if (seller.id === user.id) {
        return Response.json(
          { error: "You cannot report your own seller account" },
          { status: 400 }
        );
      }

      const existingOpen = await prisma.productReport.findFirst({
        where: {
          sellerId,
          reporterId: user.id,
          status: "open",
        },
        select: { id: true },
      });

      if (existingOpen) {
        return Response.json(
          { error: "You already have an open report for this seller" },
          { status: 409 }
        );
      }
    }

    const report = await prisma.productReport.create({
      data: {
        listingId: listingId || null,
        sellerId: sellerId || null,
        reporterId: user.id,
        reportType,
        details: details || null,
        imageUrl,
        priority: REPORT_TYPE_PRIORITY[reportType] || "medium",
      },
      include: {
        seller: {
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
          },
        },
      },
    });

    return Response.json({ report: serializeReport(report) }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to submit report" },
      { status: 500 }
    );
  }
}
