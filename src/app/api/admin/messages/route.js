import { publishMessageEvent } from "@/lib/message-events";
import { summarizeInbox } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin1234";
const SUPPORT_LISTING_NAME = "Batjee Support";
const SUPPORT_RESOLVED_MARKER = "__BATJEE_SUPPORT_RESOLVED__";

const conversationInclude = {
  listing: {
    select: {
      id: true,
      product_name: true,
      product_status: true,
      price: true,
    },
  },
  buyer: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  seller: {
    select: {
      id: true,
      email: true,
      name: true,
    },
  },
  messages: {
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  },
  transaction: true,
};

function isAuthorized(request) {
  return (
    request.headers.get("x-admin-email") === ADMIN_EMAIL &&
    request.headers.get("x-admin-password") === ADMIN_PASSWORD
  );
}

function getParticipantIds(conversation) {
  return [conversation.buyerId, conversation.sellerId];
}

async function ensureAdminUser() {
  return prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Batjee Admin",
      password: ADMIN_PASSWORD,
      user_type: "admin",
      status: "active",
      address: "Batjee Support Desk",
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Batjee Admin",
      password: ADMIN_PASSWORD,
      user_type: "admin",
      status: "active",
      address: "Batjee Support Desk",
    },
  });
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = await ensureAdminUser();
    const conversations = await prisma.conversation.findMany({
      where: { sellerId: admin.id },
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
    });

    return Response.json(summarizeInbox(conversations, admin.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to load admin messages" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = await ensureAdminUser();
    const body = await request.json();
    const conversationId = Number(body.conversationId);
    const messageBody = body.body?.trim();
    const imageUrl = body.imageUrl?.trim() || null;

    if (!conversationId || (!messageBody && !imageUrl)) {
      return Response.json({ error: "conversationId and a message or image are required" }, { status: 400 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        sellerId: admin.id,
      },
    });

    if (!existing) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        messages: {
          create: {
            senderId: admin.id,
            body: messageBody || "",
            imageUrl,
          },
        },
      },
      include: conversationInclude,
    });

    publishMessageEvent(getParticipantIds(conversation), {
      type: "refresh",
      conversationId: conversation.id,
    });

    return Response.json({
      conversation: summarizeInbox([conversation], admin.id).conversations[0],
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to send admin reply" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = await ensureAdminUser();
    const body = await request.json();
    const conversationId = Number(body.conversationId);
    const action = String(body.action || "mark_read").trim();

    if (!conversationId) {
      return Response.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        sellerId: admin.id,
      },
      include: conversationInclude,
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (action === "solve_support") {
      if (conversation.listing?.product_name !== SUPPORT_LISTING_NAME) {
        return Response.json({ error: "Only admin support conversations can be marked as solved" }, { status: 400 });
      }

      const updatedConversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          messages: {
            create: {
              senderId: admin.id,
              body: SUPPORT_RESOLVED_MARKER,
            },
          },
        },
        include: conversationInclude,
      });

      publishMessageEvent(getParticipantIds(updatedConversation), {
        type: "refresh",
        conversationId,
      });

      return Response.json({
        success: true,
        conversation: summarizeInbox([updatedConversation], admin.id).conversations[0],
      });
    }

    await prisma.conversationMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: admin.id },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    publishMessageEvent(getParticipantIds(conversation), {
      type: "refresh",
      conversationId,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}