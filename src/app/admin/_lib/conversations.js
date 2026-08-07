// Shared by the Messages page and the notification bell — both need to mark
// a conversation read via the exact same endpoint/body and apply the same
// local patch, so this lives in one place instead of two copies drifting.
export async function markConversationRead(conversationId, patchConversations) {
  try {
    await fetch("/api/admin/messages", {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });
    // Matches the old admin-backoffice.html's behavior: only skip the local
    // update if the fetch itself threw (network failure); a non-2xx response
    // still marks the conversation read locally since the old code never
    // checked res.ok here.
    patchConversations((prev) =>
      prev.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              unreadCount: 0,
              messages: (item.messages || []).map((message) => ({ ...message, isRead: true })),
            }
          : item
      )
    );
  } catch {
    // Keep the UI usable even if the read update fails.
  }
}
