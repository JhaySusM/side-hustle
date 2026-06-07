async function readJsonResponse(response, fallbackMessage) {
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

let inboxEventSource = null;
const inboxListeners = new Set();
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

function handleInboxMessage(event) {
  try {
    const payload = JSON.parse(event.data);
    if (payload.type !== "refresh") {
      return;
    }

    inboxListeners.forEach((listener) => {
      listener(payload);
    });
  } catch {
    // Ignore malformed stream events.
  }
}

function ensureInboxEventSource() {
  if (inboxEventSource) {
    return inboxEventSource;
  }

  inboxEventSource = new EventSource("/api/messages/stream", { withCredentials: true });
  inboxEventSource.onmessage = handleInboxMessage;
  inboxEventSource.onerror = () => {
    // EventSource handles reconnects automatically.
  };

  return inboxEventSource;
}

function closeInboxEventSourceIfIdle() {
  if (inboxListeners.size > 0 || !inboxEventSource) {
    return;
  }

  inboxEventSource.close();
  inboxEventSource = null;
}

export async function fetchInbox() {
  const response = await fetch("/api/messages", {
    cache: "no-store",
    credentials: "include",
  });

  return readJsonResponse(response, "Failed to fetch messages");
}

export async function sendMessage(payload) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return readJsonResponse(response, "Failed to send message");
}

export async function uploadMessageImage(file) {
  if (!file) {
    throw new Error("Image file is required");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported");
  }

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Image upload is not configured");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await readJsonResponse(response, "Failed to upload image");
  return data.secure_url;
}

export async function openSupportConversation() {
  const response = await fetch("/api/messages/support", {
    method: "POST",
    credentials: "include",
  });

  return readJsonResponse(response, "Failed to open support conversation");
}

export async function markConversationRead(conversationId) {
  const response = await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ conversationId }),
  });

  return readJsonResponse(response, "Failed to update message state");
}

export function subscribeToInbox(onRefresh) {
  inboxListeners.add(onRefresh);
  ensureInboxEventSource();

  return () => {
    inboxListeners.delete(onRefresh);
    closeInboxEventSourceIfIdle();
  };
}

export function getConversationPreview(conversation) {
  if (conversation.lastMessage?.body) {
    return conversation.lastMessage.body;
  }

  if (conversation.lastMessage?.imageUrl) {
    return "Sent an image";
  }

  return `Conversation about ${conversation.listingTitle}`;
}