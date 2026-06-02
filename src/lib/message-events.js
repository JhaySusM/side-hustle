const globalForEvents = globalThis;

if (!globalForEvents.messageListeners) {
  globalForEvents.messageListeners = new Map();
}

function getListeners(userId) {
  const key = String(userId);
  if (!globalForEvents.messageListeners.has(key)) {
    globalForEvents.messageListeners.set(key, new Set());
  }
  return globalForEvents.messageListeners.get(key);
}

export function subscribeToMessageEvents(userId, listener) {
  const listeners = getListeners(userId);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      globalForEvents.messageListeners.delete(String(userId));
    }
  };
}

export function publishMessageEvent(userIds, payload) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map((value) => String(value)))];
  uniqueUserIds.forEach((userId) => {
    const listeners = globalForEvents.messageListeners.get(userId);
    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => listener(payload));
  });
}