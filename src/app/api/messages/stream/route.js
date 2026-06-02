import { requireRequestUser } from "@/lib/auth";
import { subscribeToMessageEvents } from "@/lib/message-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function encodeEvent(payload) {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request) {
  const { errorResponse, user } = await requireRequestUser(request);
  if (errorResponse) {
    return errorResponse;
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeEvent({ type: "connected" }));

      const unsubscribe = subscribeToMessageEvents(user.id, (payload) => {
        controller.enqueue(encodeEvent(payload));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encodeEvent({ type: "heartbeat" }));
      }, 20000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream may already be closed.
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // The abort handler above cleans up subscriptions.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}