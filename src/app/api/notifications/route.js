import { requireRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializeNotification(notification) {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    deepLink: notification.deepLink || "",
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  if (!prisma.userNotification) {
    return Response.json(
      { error: "Notifications are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const notifications = await prisma.userNotification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.userNotification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return Response.json(
      {
        notifications: notifications.map(serializeNotification),
        unreadCount,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  if (!prisma.userNotification) {
    return Response.json(
      { error: "Notifications are not ready yet. Run Prisma generate and restart the server." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const markAll = Boolean(body.markAll);
    const now = new Date();

    if (markAll) {
      const result = await prisma.userNotification.updateMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      return Response.json({ updated: result.count });
    }

    const notificationId = Number(body.notificationId);
    if (!notificationId) {
      return Response.json({ error: "notificationId is required" }, { status: 400 });
    }

    const result = await prisma.userNotification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    });

    if (result.count === 0) {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }

    return Response.json({ updated: result.count });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to update notifications" },
      { status: 500 }
    );
  }
}
