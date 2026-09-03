import { seed, type ServiceState } from './restaurant';
const KEY = 'dai-pai-dong-service-v1';
export function loadService(): ServiceState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as ServiceState;
      if (
        s.version === 1 &&
        Number.isFinite(s.startedAt) &&
        Number.isInteger(s.nextNumber) &&
        Array.isArray(s.tables) &&
        s.tables.length &&
        Array.isArray(s.queue) &&
        Array.isArray(s.reservations) &&
        s.tables.every(
          (t) =>
            typeof t.id === 'string' &&
            Number.isFinite(t.capacity) &&
            ['available', 'occupied', 'reserved', 'cleaning'].includes(
              t.status,
            ),
        ) &&
        s.queue.every(
          (q) =>
            typeof q.id === 'string' &&
            Number.isFinite(q.joinedAt) &&
            Number.isFinite(q.partySize),
        ) &&
        s.reservations.every(
          (r) =>
            typeof r.id === 'string' &&
            typeof r.date === 'string' &&
            typeof r.time === 'string',
        )
      )
        return s;
    }
  } catch {
    /* An unavailable or outdated local store must not block service. */
  }
  return seed();
}
export function saveService(state: ServiceState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
