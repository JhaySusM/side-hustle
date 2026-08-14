function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || null;
}

// Fire-and-forget: a logging failure must never block the action it records.
export async function logActivity(
  prisma,
  { userId = null, actorId = null, actorType = 'user', action, category, status = 'success', detail = null, request = null, metadata = null }
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        actorId,
        actorType,
        action,
        category,
        status,
        detail,
        ipAddress: request ? getClientIp(request) : null,
        userAgent: request ? request.headers.get('user-agent') || null : null,
        metadata: metadata || undefined,
      },
    });
  } catch {
    // Best-effort only.
  }
}
