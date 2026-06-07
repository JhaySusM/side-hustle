import { requireRequestUser } from "@/lib/auth";
import { publishMessageEvent } from "@/lib/message-events";
import { summarizeInbox } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin1234";
const SUPPORT_LISTING_NAME = "Batjee Support";
const SUPPORT_IMAGE = "https://placehold.co/640x420?text=Batjee+Support";

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

function getParticipantIds(conversation) {
  return [conversation.buyerId, conversation.sellerId];
}

async function ensureSupportAdmin() {
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

async function ensureSupportListing(adminId) {
  const existing = await prisma.productList.findFirst({
    where: {
      user_id: adminId,
      product_name: SUPPORT_LISTING_NAME,
    },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  const fallbackCategory = await prisma.category.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!fallbackCategory) {
    throw new Error("No category available for support conversation");
  }

  return prisma.productList.create({
    data: {
      product_name: SUPPORT_LISTING_NAME,
      price: 0,
      description: "Dedicated in-app support thread for Batjee concerns.",
      image: SUPPORT_IMAGE,
      category_table_id: fallbackCategory.id,
      user_id: adminId,
      product_status: "Inactive",
    },
    select: { id: true },
  });
}

export async function POST(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const admin = await ensureSupportAdmin();

    if (admin.id === user.id) {
      return Response.json({ error: "Admin support thread is unavailable for this account" }, { status: 400 });
    }

    const supportListing = await ensureSupportListing(admin.id);

    let conversation = await prisma.conversation.findUnique({
      where: {
        listingId_buyerId_sellerId: {
          listingId: supportListing.id,
          buyerId: user.id,
          sellerId: admin.id,
        },
      },
      include: conversationInclude,
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId: supportListing.id,
          buyerId: user.id,
          sellerId: admin.id,
          messages: {
            create: {
              senderId: admin.id,
              body: "Hello! Tell us your concern here and the Batjee admin team will review it.",
            },
          },
        },
        include: conversationInclude,
      });
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
      { error: error.message || "Failed to open support conversation" },
      { status: 500 }
    );
  }
}