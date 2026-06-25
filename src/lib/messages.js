import { serializeTransaction } from "@/lib/transaction-utils";

const SUPPORT_LISTING_NAME = "Batjee Support";
const SUPPORT_RESOLVED_MARKER = "__BATJEE_SUPPORT_RESOLVED__";

export function formatMessageDate(value) {
  return new Date(value).toLocaleString();
}

export function getMessagePreview(message) {
  if (!message) {
    return "";
  }

  if (message.body) {
    return message.body;
  }

  if (message.imageUrl) {
    return "Sent an image";
  }

  return "";
}

export function serializeConversation(conversation, currentUserId) {
  const isSeller = conversation.sellerId === currentUserId;
  const otherParty = isSeller ? conversation.buyer : conversation.seller;
  const isSupportConversation = conversation.listing?.product_name === SUPPORT_LISTING_NAME;
  const isSupportResolved = isSupportConversation && conversation.messages.at(-1)?.body === SUPPORT_RESOLVED_MARKER;
  const visibleMessages = conversation.messages.filter((message) => message.body !== SUPPORT_RESOLVED_MARKER);
  const messages = visibleMessages.map((message) => ({
    id: message.id,
    senderId: message.senderId,
    senderName: message.sender?.name || message.sender?.email || "User",
    senderEmail: message.sender?.email || "",
    body: message.body,
    date: formatMessageDate(message.createdAt),
    imageUrl: message.imageUrl || "",
    createdAt: message.createdAt,
    isRead: Boolean(message.readAt) || message.senderId === currentUserId,
  }));

  const lastMessage = messages[messages.length - 1] || null;
  const unreadCount = visibleMessages.filter(
    (message) => message.senderId !== currentUserId && !message.readAt
  ).length;

  return {
    id: conversation.id,
    listingId: conversation.listingId,
    listingTitle: conversation.listing.product_name,
    listingStatus: conversation.listing.product_status,
    listingPrice: conversation.listing.price,
    isSupportConversation,
    isSupportResolved,
    transaction: serializeTransaction(conversation.transaction, currentUserId),
    sellerId: conversation.sellerId,
    buyerId: conversation.buyerId,
    otherParty: {
      id: otherParty.id,
      name: otherParty.name || otherParty.email,
      email: otherParty.email,
    },
    messages,
    lastMessage,
    unreadCount,
    updatedAt: conversation.updatedAt,
  };
}

export function summarizeInbox(conversations, currentUserId) {
  const serialized = conversations.map((conversation) =>
    serializeConversation(conversation, currentUserId)
  );

  return {
    conversations: serialized,
    unreadCount: serialized.reduce((total, conversation) => total + conversation.unreadCount, 0),
  };
}