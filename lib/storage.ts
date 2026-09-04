import { seed, type SeatingArea, type ServiceState } from './restaurant';
const KEY = 'dai-pai-dong-service-v1';
type LegacyState = Omit<
  ServiceState,
  'version' | 'tables' | 'queue' | 'reservations'
> & {
  version: 1;
  tables: Array<Omit<ServiceState['tables'][number], 'area'>>;
  queue: Array<
    Omit<ServiceState['queue'][number], 'phone' | 'smoking'> & {
      phone?: string;
    }
  >;
  reservations: Array<
    Omit<ServiceState['reservations'][number], 'phone' | 'smoking'> & {
      phone?: string;
    }
  >;
};
function migrate(s: LegacyState): ServiceState {
  return {
    ...s,
    version: 2,
    tables: s.tables.map((t, i) => ({
      ...t,
      area: (i < 4 ? 'outdoor' : 'indoor') as SeatingArea,
    })),
    queue: s.queue.map((q) => ({ ...q, phone: q.phone || '', smoking: false })),
    reservations: s.reservations.map((r) => ({
      ...r,
      phone: r.phone || '',
      smoking: false,
    })),
  };
}
export function loadService(): ServiceState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ServiceState | LegacyState;
      const s = parsed.version === 1 ? migrate(parsed) : parsed;
      if (
        s.version === 2 &&
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
            ['indoor', 'outdoor'].includes(t.area) &&
            ['available', 'occupied', 'reserved', 'cleaning'].includes(
              t.status,
            ),
        ) &&
        s.queue.every(
          (q) =>
            typeof q.id === 'string' &&
            Number.isFinite(q.joinedAt) &&
            Number.isFinite(q.partySize) &&
            typeof q.smoking === 'boolean',
        ) &&
        s.reservations.every(
          (r) =>
            typeof r.id === 'string' &&
            typeof r.date === 'string' &&
            typeof r.time === 'string' &&
            typeof r.smoking === 'boolean',
        )
      )
        return s;
    }
  } catch {
    /* Storage must not block service. */
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
