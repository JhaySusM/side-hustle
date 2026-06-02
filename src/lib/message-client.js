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
  return conversation.lastMessage?.body || `Conversation about ${conversation.listingTitle}`;
}