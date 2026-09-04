export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
export type SeatingArea = 'indoor' | 'outdoor';
export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  area: SeatingArea;
  status: TableStatus;
  currentPartyId?: string;
  seatedAt?: number;
  reservationId?: string;
}
export interface QueueEntry {
  id: string;
  queueNumber: string;
  customerName?: string;
  phone: string;
  partySize: number;
  smoking: boolean;
  joinedAt: number;
  estimatedWaitMinutes?: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no-show';
  assignedTableId?: string;
}
export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  smoking: boolean;
  date: string;
  time: string;
  notes?: string;
  status: 'upcoming' | 'arrived' | 'seated' | 'cancelled' | 'no-show';
  assignedTableId?: string;
}
export interface ServiceState {
  version: 2;
  startedAt: number;
  nextNumber: number;
  tables: RestaurantTable[];
  queue: QueueEntry[];
  reservations: Reservation[];
}
export const SERVICE_DATE = '2026-09-03';
const phones = [
  '9123 1122',
  '9234 2233',
  '9345 3344',
  '9456 4455',
  '9567 5566',
  '9678 6677',
  '9789 7788',
  '9890 8899',
];
export function seed(now = Date.now()): ServiceState {
  const occupied = ['Leung', 'Mak', 'Tang'].map(
    (name, i): QueueEntry => ({
      id: `d${i}`,
      queueNumber: `A0${i + 7}`,
      customerName: name,
      phone: phones[i],
      partySize: [2, 4, 6][i],
      smoking: [true, false, false][i],
      joinedAt: now - (80 - i * 10) * 60000,
      status: 'seated',
      assignedTableId: ['T2', 'T5', 'T7'][i],
    }),
  );
  const table = (
    id: string,
    capacity: number,
    area: SeatingArea,
    status: TableStatus,
    extra: Partial<RestaurantTable> = {},
  ): RestaurantTable => ({ id, name: id, capacity, area, status, ...extra });
  return {
    version: 2,
    startedAt: now,
    nextNumber: 17,
    tables: [
      table('T1', 2, 'outdoor', 'available'),
      table('T2', 2, 'outdoor', 'occupied', {
        currentPartyId: 'd0',
        seatedAt: now - 38 * 60000,
      }),
      table('T3', 4, 'outdoor', 'available'),
      table('T4', 4, 'outdoor', 'reserved', { reservationId: 'r1' }),
      table('T5', 4, 'indoor', 'occupied', {
        currentPartyId: 'd1',
        seatedAt: now - 52 * 60000,
      }),
      table('T6', 6, 'indoor', 'cleaning'),
      table('T7', 6, 'indoor', 'occupied', {
        currentPartyId: 'd2',
        seatedAt: now - 24 * 60000,
      }),
      table('T8', 8, 'indoor', 'available'),
    ],
    queue: [
      ...occupied,
      ...['Chan', 'Lee', 'Cheung', 'Lam', 'Ho'].map(
        (name, i): QueueEntry => ({
          id: `q${i}`,
          queueNumber: `A${12 + i}`,
          customerName: name,
          phone: phones[i + 3],
          partySize: [4, 2, 6, 3, 5][i],
          smoking: [false, true, false, false, true][i],
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
        smoking: true,
        date: SERVICE_DATE,
        time: '19:30',
        notes: 'Outside, by the entrance if possible',
        status: 'upcoming',
        assignedTableId: 'T4',
      },
      {
        id: 'r2',
        customerName: 'Lee',
        phone: '9234 5678',
        partySize: 6,
        smoking: false,
        date: SERVICE_DATE,
        time: '20:00',
        notes: 'Family dinner · one child',
        status: 'upcoming',
      },
      {
        id: 'r3',
        customerName: 'Ho',
        phone: '9345 6789',
        partySize: 2,
        smoking: false,
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
  smoking = false,
) {
  const preferred: SeatingArea = smoking ? 'outdoor' : 'indoor';
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
        Number(b.area === preferred) - Number(a.area === preferred) ||
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
      party.smoking,
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
