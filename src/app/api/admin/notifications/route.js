import { isAdminRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function normalizeAudience(rawAudience) {
  const value = String(rawAudience || "all").trim();

  if (value === "all" || value === "buyers" || value === "sellers" || value === "inactive") {
    return { audienceType: value, audienceValue: null };
  }

  if (value.toLowerCase().startsWith("city:")) {
    const city = value.slice(5).trim();
    if (!city) {
      return null;
    }

    return { audienceType: "city", audienceValue: city };
  }

  return null;
}

function pickUserCity(user) {
  if (user?.addressCity && String(user.addressCity).trim()) {
    return String(user.addressCity).trim();
  }

  const text = String(user?.address || "").trim();
  if (!text) return "";

  const segments = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (!segments.length) return "";

  if (segments.length >= 2) {
    const cityPostal = segments[segments.length - 2];
    const cityPart = cityPostal.split("-")[0]?.trim();
    if (cityPart) return cityPart;
  }

  return segments[segments.length - 1];
}

async function resolveRecipientIds(audienceType, audienceValue) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      status: true,
      address: true,
      addressCity: true,
    },
  });

  const activeUsers = users.filter((user) => String(user.status || "").toLowerCase() === "active");

  if (audienceType === "all") {
    return users.map((user) => user.id);
  }

  if (audienceType === "inactive") {
    return users
      .filter((user) => String(user.status || "").toLowerCase() === "inactive")
      .map((user) => user.id);
  }

  if (audienceType === "city") {
    const cityNorm = String(audienceValue || "").trim().toLowerCase();
    return users
      .filter((user) => pickUserCity(user).toLowerCase() === cityNorm)
      .map((user) => user.id);
  }

  const sellerRows = await prisma.productList.findMany({
    select: { user_id: true },
    distinct: ["user_id"],
  });
  const sellerIds = new Set(sellerRows.map((row) => row.user_id));

  if (audienceType === "sellers") {
    return activeUsers
      .filter((user) => sellerIds.has(user.id))
      .map((user) => user.id);
  }

  if (audienceType === "buyers") {
    return activeUsers
      .filter((user) => !sellerIds.has(user.id))
      .map((user) => user.id);
  }

  return [];
}

async function loadCampaigns(limit = 20) {
  const campaigns = await prisma.notificationCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: {
          recipients: true,
        },
      },
    },
  });

  const ids = campaigns.map((campaign) => campaign.id);
  const recipientRows = ids.length
    ? await prisma.userNotification.findMany({
        where: {
          campaignId: { in: ids },
        },
        select: {
          campaignId: true,
          isRead: true,
        },
      })
    : [];

  const readByCampaign = new Map();
  recipientRows.forEach((row) => {
    if (!row.isRead) {
      return;
    }

    readByCampaign.set(row.campaignId, (readByCampaign.get(row.campaignId) || 0) + 1);
  });

  return campaigns.map((campaign) => {
    const sentCount = campaign._count.recipients;
    const readCount = readByCampaign.get(campaign.id) || 0;
    const openRate = sentCount > 0 ? (readCount / sentCount) * 100 : 0;
    return {
      id: campaign.id,
      title: campaign.title,
      body: campaign.body,
      deepLink: campaign.deepLink,
      audienceType: campaign.audienceType,
      audienceValue: campaign.audienceValue,
      createdAt: campaign.createdAt,
      sentCount,
      readCount,
      openRate,
    };
  });
}

export async function GET(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.notificationCampaign || !prisma.userNotification) {
    return Response.json(
      { error: "Notifications are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const campaigns = await loadCampaigns(20);
    return Response.json({ campaigns });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch notification campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!prisma.notificationCampaign || !prisma.userNotification) {
    return Response.json(
      { error: "Notifications are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const message = String(body.body || "").trim();
    const deepLink = String(body.deepLink || "").trim() || null;
    const audience = normalizeAudience(body.audience);

    if (!title || !message) {
      return Response.json({ error: "Title and body are required" }, { status: 400 });
    }

    if (!audience) {
      return Response.json({ error: "Invalid audience value" }, { status: 400 });
    }

    const recipientIds = await resolveRecipientIds(audience.audienceType, audience.audienceValue);

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.notificationCampaign.create({
        data: {
          title,
          body: message,
          deepLink,
          audienceType: audience.audienceType,
          audienceValue: audience.audienceValue,
        },
      });

      if (recipientIds.length > 0) {
        await tx.userNotification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            campaignId: campaign.id,
            title,
            body: message,
            deepLink,
          })),
          skipDuplicates: true,
        });
      }

      return campaign;
    });

    const campaigns = await loadCampaigns(20);

    return Response.json({
      campaignId: result.id,
      recipientCount: recipientIds.length,
      campaigns,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to queue notification" },
      { status: 500 }
    );
  }
}
