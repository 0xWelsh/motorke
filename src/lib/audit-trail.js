const MAX_AUDIT_EVENTS = 400;

function getAuditStore() {
  if (!globalThis.__auditTrailStore) {
    globalThis.__auditTrailStore = {
      startedAt: Date.now(),
      events: [],
    };
  }
  return globalThis.__auditTrailStore;
}

export function logAuditEvent(event) {
  const store = getAuditStore();
  const safeEvent = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    actorId: event.actorId || "unknown",
    actorRole: event.actorRole || "unknown",
    action: event.action || "unknown",
    entity: event.entity || "unknown",
    entityId: event.entityId || null,
    detail: event.detail || {},
  };
  store.events.push(safeEvent);
  if (store.events.length > MAX_AUDIT_EVENTS) store.events.shift();
  return safeEvent;
}

export function getAuditEvents(limit = 100) {
  const store = getAuditStore();
  return {
    startedAt: store.startedAt,
    now: Date.now(),
    total: store.events.length,
    events: [...store.events].reverse().slice(0, limit),
  };
}
