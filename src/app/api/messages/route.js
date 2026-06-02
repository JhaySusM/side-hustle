import { requireRequestUser } from "@/lib/auth";
import { publishMessageEvent } from "@/lib/message-events";
import { summarizeInbox } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
};

async function loadInbox(userId) {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
  });

  return summarizeInbox(conversations, userId);
}

function getParticipantIds(conversation) {
  return [conversation.buyerId, conversation.sellerId];
}

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const inbox = await loadInbox(user.id);
    return Response.json(inbox, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const messageBody = body.body?.trim();
    const conversationId = body.conversationId ? Number(body.conversationId) : null;
    const listingId = body.listingId ? Number(body.listingId) : null;
    const recipientId = body.recipientId ? Number(body.recipientId) : null;

    if (!messageBody) {
      return Response.json({ error: "Message body is required" }, { status: 400 });
    }

    let conversation;

    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [{ buyerId: user.id }, { sellerId: user.id }],
        },
      });

      if (!existing) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }

      conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          messages: {
            create: {
              senderId: user.id,
              body: messageBody,
            },
          },
        },
        include: conversationInclude,
      });
    } else {
      if (!listingId || !recipientId) {
        return Response.json(
          { error: "listingId and recipientId are required for a new conversation" },
          { status: 400 }
        );
      }

      const listing = await prisma.productList.findUnique({
        where: { id: listingId },
        select: { id: true, user_id: true },
      });

      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }

      let buyerId;
      let sellerId;
      if (user.id === listing.user_id) {
        sellerId = user.id;
        buyerId = recipientId;
      } else if (recipientId === listing.user_id) {
        sellerId = recipientId;
        buyerId = user.id;
      } else {
        return Response.json(
          { error: "One conversation participant must be the listing owner" },
          { status: 400 }
        );
      }

      if (buyerId === sellerId) {
        return Response.json({ error: "You cannot message yourself about a listing" }, { status: 400 });
      }

      const existing = await prisma.conversation.findUnique({
        where: {
          listingId_buyerId_sellerId: {
            listingId,
            buyerId,
            sellerId,
          },
        },
      });

      if (existing) {
        conversation = await prisma.conversation.update({
          where: { id: existing.id },
          data: {
            updatedAt: new Date(),
            messages: {
              create: {
                senderId: user.id,
                body: messageBody,
              },
            },
          },
          include: conversationInclude,
        });
      } else {
        conversation = await prisma.conversation.create({
          data: {
            listingId,
            buyerId,
            sellerId,
            messages: {
              create: {
                senderId: user.id,
                body: messageBody,
              },
            },
          },
          include: conversationInclude,
        });
      }
    }

    publishMessageEvent(getParticipantIds(conversation), {
      type: "refresh",
      conversationId: conversation.id,
    });

    return Response.json({
      conversation: summarizeInbox([conversation], user.id).conversations[0],
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const conversationId = Number(body.conversationId);

    if (!conversationId) {
      return Response.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.conversationMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
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
      { error: error.message || "Failed to update read state" },
      { status: 500 }
    );
  }
}
