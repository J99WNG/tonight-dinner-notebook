export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  currentPartyId?: string;
  seatedAt?: number;
  reservationId?: string;
}
export interface QueueEntry {
  id: string;
  queueNumber: string;
  customerName?: string;
  phone?: string;
  partySize: number;
  joinedAt: number;
  estimatedWaitMinutes?: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no-show';
  assignedTableId?: string;
}
export interface Reservation {
  id: string;
  customerName: string;
  phone?: string;
  partySize: number;
  date: string;
  time: string;
  notes?: string;
  status: 'upcoming' | 'arrived' | 'seated' | 'cancelled' | 'no-show';
  assignedTableId?: string;
}
export interface ServiceState {
  version: 1;
  startedAt: number;
  nextNumber: number;
  tables: RestaurantTable[];
  queue: QueueEntry[];
  reservations: Reservation[];
}
export const SERVICE_DATE = '2026-09-03';
export function seed(now = Date.now()): ServiceState {
  const occupied = ['Leung', 'Mak', 'Tang'].map(
    (name, i): QueueEntry => ({
      id: `d${i}`,
      queueNumber: `A0${i + 7}`,
      customerName: name,
      partySize: [2, 4, 6][i],
      joinedAt: now - (80 - i * 10) * 60000,
      status: 'seated',
      assignedTableId: ['T2', 'T5', 'T7'][i],
    }),
  );
  return {
    version: 1,
    startedAt: now,
    nextNumber: 17,
    tables: [
      { id: 'T1', name: 'T1', capacity: 2, status: 'available' },
      {
        id: 'T2',
        name: 'T2',
        capacity: 2,
        status: 'occupied',
        currentPartyId: 'd0',
        seatedAt: now - 38 * 60000,
      },
      { id: 'T3', name: 'T3', capacity: 4, status: 'available' },
      {
        id: 'T4',
        name: 'T4',
        capacity: 4,
        status: 'reserved',
        reservationId: 'r1',
      },
      {
        id: 'T5',
        name: 'T5',
        capacity: 4,
        status: 'occupied',
        currentPartyId: 'd1',
        seatedAt: now - 52 * 60000,
      },
      { id: 'T6', name: 'T6', capacity: 6, status: 'cleaning' },
      {
        id: 'T7',
        name: 'T7',
        capacity: 6,
        status: 'occupied',
        currentPartyId: 'd2',
        seatedAt: now - 24 * 60000,
      },
      { id: 'T8', name: 'T8', capacity: 8, status: 'available' },
    ],
    queue: [
      ...occupied,
      ...['Chan', 'Lee', 'Cheung', 'Lam', 'Ho'].map(
        (name, i): QueueEntry => ({
          id: `q${i}`,
          queueNumber: `A${12 + i}`,
          customerName: name,
          partySize: [4, 2, 6, 3, 5][i],
          joinedAt: now - [18, 11, 9, 6, 3][i] * 60000,
          estimatedWaitMinutes: [10, 10, 20, 15, 25][i],
          status: 'waiting',
        }),
      ),
    ],
    reservations: [
      {
        id: 'r1',
        customerName: 'Wong',
        phone: '9123 4567',
        partySize: 4,
        date: SERVICE_DATE,
        time: '19:30',
        notes: 'By the entrance, if possible',
        status: 'upcoming',
        assignedTableId: 'T4',
      },
      {
        id: 'r2',
        customerName: 'Lee',
        partySize: 6,
        date: SERVICE_DATE,
        time: '20:00',
        notes: 'Family dinner · one child',
        status: 'upcoming',
      },
      {
        id: 'r3',
        customerName: 'Ho',
        partySize: 2,
        date: SERVICE_DATE,
        time: '20:30',
        status: 'upcoming',
      },
    ],
  };
}
export const statusText: Record<TableStatus, string> = {
  available: 'Ready',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
};
export function suitableTables(
  state: ServiceState,
  size: number,
  reservationId?: string,
) {
  return state.tables
    .filter(
      (t) =>
        t.capacity >= size &&
        (t.status === 'available' ||
          (t.status === 'reserved' && t.reservationId === reservationId)),
    )
    .sort(
      (a, b) =>
        Number(b.reservationId === reservationId && !!reservationId) -
          Number(a.reservationId === reservationId && !!reservationId) ||
        a.capacity - b.capacity,
    );
}
export function seatParty(
  state: ServiceState,
  id: string,
  kind: 'queue' | 'reservation',
  tableId: string,
  now: number,
): ServiceState {
  const party =
    kind === 'queue'
      ? state.queue.find((q) => q.id === id)
      : state.reservations.find((r) => r.id === id);
  if (
    !party ||
    !['waiting', 'notified', 'upcoming', 'arrived'].includes(party.status) ||
    !suitableTables(
      state,
      party.partySize,
      kind === 'reservation' ? id : undefined,
    ).some((t) => t.id === tableId)
  )
    return state;
  return {
    ...state,
    tables: state.tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            status: 'occupied',
            currentPartyId: id,
            seatedAt: now,
            reservationId: kind === 'reservation' ? id : undefined,
          }
        : t.reservationId === id && t.status === 'reserved'
          ? { ...t, status: 'available', reservationId: undefined }
          : t,
    ),
    queue: state.queue.map((q) =>
      kind === 'queue' && q.id === id
        ? { ...q, status: 'seated', assignedTableId: tableId }
        : q,
    ),
    reservations: state.reservations.map((r) =>
      kind === 'reservation' && r.id === id
        ? { ...r, status: 'seated', assignedTableId: tableId }
        : r,
    ),
  };
}
