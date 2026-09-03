/* Mount hydration reads the device store; action helpers run only from user events. */
/* oxlint-disable react/react-compiler */
'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Users,
  ArrowUpRight,
  CalendarDays,
  LayoutGrid,
  Moon,
  Check,
  Clock3,
  ArrowRight,
  RotateCcw,
  MapPin,
  X,
  NotebookPen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  seed,
  suitableTables,
  seatParty,
  statusText,
  SERVICE_DATE,
  type ServiceState,
  type Reservation,
} from '@/lib/restaurant';
import { loadService, saveService } from '@/lib/storage';
import {
  TableCard,
  QueueCard,
  ReservationCard,
  Sheet,
  PartyForm,
  minutes,
  type PartyInput,
} from '@/components/service-ui';
type View = 'Tonight' | 'Bookings' | 'Tables';
type Modal =
  | { type: 'walk-in' }
  | { type: 'seat'; id: string; kind: 'queue' | 'reservation' }
  | { type: 'table'; id: string }
  | { type: 'queue'; id: string }
  | { type: 'booking'; id?: string }
  | { type: 'reset' }
  | null;
const destinations = [
  { name: 'Tonight' as const, icon: Moon },
  { name: 'Bookings' as const, icon: CalendarDays },
  { name: 'Tables' as const, icon: LayoutGrid },
];
export default function Home() {
  const [state, setState] = useState<ServiceState>(() => seed(0));
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [view, setView] = useState<View>('Tonight');
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [previous, setPrevious] = useState<ServiceState | null>(null);
  const [storageIssue, setStorageIssue] = useState(false);
  const [tableFilter, setTableFilter] = useState('all');
  useEffect(() => {
    const s = loadService();
    stateRef.current = s;
    setState(s);
    setNow(Date.now());
    setHydrated(true);
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (hydrated) setStorageIssue(!saveService(state));
    stateRef.current = state;
  }, [state, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast('');
      setPrevious(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toast]);
  function commit(next: ServiceState, message: string) {
    setPrevious(stateRef.current);
    stateRef.current = next;
    setState(next);
    setNow(Date.now());
    setModal(null);
    setToast(message);
  }
  function addWalkIn(data: PartyInput) {
    const s = stateRef.current;
    const queueNumber = `A${s.nextNumber}`;
    commit(
      {
        ...s,
        nextNumber: s.nextNumber + 1,
        queue: [
          ...s.queue,
          {
            id: crypto.randomUUID(),
            queueNumber,
            customerName: data.customerName,
            phone: data.phone,
            partySize: data.partySize,
            joinedAt: Date.now(),
            estimatedWaitMinutes: 15,
            status: 'waiting',
          },
        ],
      },
      `${queueNumber} added to the queue`,
    );
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    Promise.resolve()
      .then(() =>
        context.registerTool(
          {
            name: 'start_walk_in',
            description:
              'Open the walk-in form. This does not add a customer until the manager submits the form.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object');
              setModal({ type: 'walk-in' });
              return { status: 'form_opened' };
            },
          },
          { signal: lifecycle.signal },
        ),
      )
      .catch(() => {});
    return () => lifecycle.abort();
  }, []);
  const waiting = state.queue
    .filter((q) => q.status === 'waiting' || q.status === 'notified')
    .sort((a, b) => a.joinedAt - b.joinedAt);
  const ready = state.tables.filter((t) => t.status === 'available');
  const serviceMinute =
    19 * 60 + 15 + Math.max(0, Math.floor((now - state.startedAt) / 60000));
  const clock = `${String(Math.floor(serviceMinute / 60) % 24).padStart(2, '0')}:${String(serviceMinute % 60).padStart(2, '0')}`;
  const bookingMinute = (r: Reservation) =>
    Number(r.time.slice(0, 2)) * 60 + Number(r.time.slice(3));
  const reservations = state.reservations
    .filter(
      (r) =>
        r.date === SERVICE_DATE && ['upcoming', 'arrived'].includes(r.status),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  function arrive(r: Reservation) {
    commit(
      {
        ...state,
        reservations: state.reservations.map((b) =>
          b.id === r.id ? { ...b, status: 'arrived' } : b,
        ),
      },
      `${r.customerName} has arrived`,
    );
  }
  function changeBooking(id: string, status: 'cancelled' | 'no-show') {
    commit(
      {
        ...state,
        reservations: state.reservations.map((r) =>
          r.id === id ? { ...r, status } : r,
        ),
        tables: state.tables.map((t) =>
          t.reservationId === id && t.status === 'reserved'
            ? { ...t, status: 'available', reservationId: undefined }
            : t,
        ),
      },
      status === 'cancelled' ? 'Booking cancelled' : 'Booking marked no-show',
    );
  }
  const nextBooking = reservations.find(
    (r) => r.status === 'arrived' || bookingMinute(r) - serviceMinute <= 20,
  );
  const table =
    modal?.type === 'table'
      ? state.tables.find((t) => t.id === modal.id)
      : undefined;
  const tableParty = table
    ? state.queue.find((q) => q.id === table.currentPartyId) ||
      state.reservations.find((r) => r.id === table.currentPartyId)
    : undefined;
  const tableBooking = table
    ? state.reservations.find((r) => r.id === table.reservationId)
    : undefined;
  const queueParty =
    modal?.type === 'queue'
      ? state.queue.find((q) => q.id === modal.id)
      : undefined;
  const seatTarget =
    modal?.type === 'seat'
      ? modal.kind === 'queue'
        ? state.queue.find((q) => q.id === modal.id)
        : state.reservations.find((r) => r.id === modal.id)
      : undefined;
  const choices =
    seatTarget && modal?.type === 'seat'
      ? suitableTables(
          state,
          seatTarget.partySize,
          modal.kind === 'reservation' ? seatTarget.id : undefined,
        )
      : [];
  const editBooking =
    modal?.type === 'booking'
      ? state.reservations.find((r) => r.id === modal.id)
      : undefined;
  const tableGrid = (
    <div className="table-grid">
      {state.tables
        .filter(
          (t) =>
            view !== 'Tables' ||
            tableFilter === 'all' ||
            t.status === tableFilter,
        )
        .map((t) => (
          <TableCard
            key={t.id}
            table={t}
            now={now}
            reservation={state.reservations.find(
              (r) => r.id === t.reservationId,
            )}
            onClick={() => setModal({ type: 'table', id: t.id })}
          />
        ))}
    </div>
  );
  const bookingCard = (r: Reservation) => (
    <ReservationCard
      key={r.id}
      reservation={r}
      soon={
        r.date === SERVICE_DATE &&
        r.status === 'upcoming' &&
        bookingMinute(r) - serviceMinute <= 20
      }
      onArrive={() => arrive(r)}
      onSeat={() => setModal({ type: 'seat', id: r.id, kind: 'reservation' })}
      onEdit={() => setModal({ type: 'booking', id: r.id })}
    />
  );
  return (
    <div className="app">
      <header className="brand">
        <span className="stamp" aria-hidden="true">
          新<br />
          志興
        </span>
        <div>
          <strong>新志興至尊燒鵝大王</strong>
          <small>THE DINNER NOTEBOOK</small>
        </div>
        <span className="service-pill">
          <i /> Service open
        </span>
      </header>
      <main aria-busy={!hydrated}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">THURSDAY, 3 SEPTEMBER</p>
            <h1>
              {view}
              <span>.</span>
            </h1>
            <p>
              {view === 'Tonight'
                ? 'A little order in the dinner rush.'
                : view === 'Bookings'
                  ? 'A place for everyone coming tonight.'
                  : 'A quick look. A little less to remember.'}
            </p>
          </div>
          <div className="service-time">
            <Moon size={18} /> Dinner service <b>{clock}</b>
          </div>
        </div>
        {storageIssue && (
          <output className="storage-warning">
            Changes are kept for this visit. This browser couldn’t save them for
            your next visit.
          </output>
        )}
        {view === 'Tonight' ? (
          <div className="workspace">
            <div className="left-column">
              <section className="table-section">
                <div className="section-heading">
                  <h2>
                    The tables <span>{state.tables.length}</span>
                  </h2>
                  <span className="ready-count">{ready.length} ready</span>
                </div>
                {tableGrid}
                <p className="table-hint">
                  Tap a table to seat a party or update its status.
                </p>
                {nextBooking && (
                  <button
                    className="booking-reminder"
                    onClick={() =>
                      setModal(
                        nextBooking.status === 'arrived'
                          ? {
                              type: 'seat',
                              id: nextBooking.id,
                              kind: 'reservation',
                            }
                          : { type: 'booking', id: nextBooking.id },
                      )
                    }
                  >
                    <CalendarDays size={15} />
                    <span>
                      <b>
                        {nextBooking.time} · {nextBooking.customerName}
                      </b>{' '}
                      · {nextBooking.partySize} people
                    </span>
                    <small>
                      {nextBooking.status === 'arrived'
                        ? 'Arrived'
                        : bookingMinute(nextBooking) < serviceMinute
                          ? 'Due now'
                          : 'Due soon'}
                    </small>
                    <ArrowRight size={14} />
                  </button>
                )}
              </section>
              <section className="tonight-bookings">
                <div className="section-heading">
                  <h2>
                    Coming tonight <span>{reservations.length}</span>
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setView('Bookings')}
                    className="text-action"
                  >
                    All bookings <ArrowRight />
                  </Button>
                </div>
                {reservations.length ? (
                  <>
                    <div className="booking-list">
                      {reservations.map(bookingCard)}
                    </div>
                    <p className="table-hint">
                      <Clock3 size={12} /> Booked tables stay held until you
                      seat or cancel.
                    </p>
                  </>
                ) : (
                  <div className="empty">
                    <CalendarDays />
                    <h3>No more bookings tonight</h3>
                    <p>All accounted for.</p>
                  </div>
                )}
              </section>
              <div className="location">
                <MapPin size={13} />
                <span>牛池灣 · 60A Lung Chi Path, Ngau Chi Wan</span>
              </div>
            </div>
            <section className="queue-section">
              <div className="section-heading">
                <h2>
                  Waiting <span>{waiting.length} groups</span>
                </h2>
                <Button onClick={() => setModal({ type: 'walk-in' })}>
                  <Plus /> Walk-in
                </Button>
              </div>
              {waiting.length ? (
                <>
                  <div className="queue-intro">
                    <span className="busy-dot" />
                    {waiting.length >= 4
                      ? 'A busy evening'
                      : 'Service is moving'}
                    <span>
                      {waiting.reduce((sum, q) => sum + q.partySize, 0)} people
                      waiting
                    </span>
                  </div>
                  <div className="queue-list">
                    {waiting.map((q) => (
                      <QueueCard
                        key={q.id}
                        party={q}
                        now={now}
                        fits={suitableTables(state, q.partySize).length > 0}
                        onSeat={() =>
                          setModal({ type: 'seat', id: q.id, kind: 'queue' })
                        }
                        onDetail={() => setModal({ type: 'queue', id: q.id })}
                      />
                    ))}
                  </div>
                  <p className="queue-note">
                    <NotebookPen size={13} /> Arrival order shown. Seat by the
                    best table fit.
                  </p>
                </>
              ) : (
                <div className="empty">
                  <Check />
                  <h3>Queue’s clear</h3>
                  <p>No one’s waiting for a table right now.</p>
                  <Button onClick={() => setModal({ type: 'walk-in' })}>
                    <Plus /> Add walk-in
                  </Button>
                </div>
              )}
              <Button
                className="add-another"
                variant="ghost"
                onClick={() => setModal({ type: 'walk-in' })}
              >
                <Plus /> Add a walk-in
              </Button>
            </section>
          </div>
        ) : view === 'Bookings' ? (
          <section className="secondary-view">
            <div className="section-heading">
              <h2>The booking book</h2>
              <Button onClick={() => setModal({ type: 'booking' })}>
                <Plus /> Booking
              </Button>
            </div>
            {Array.from(
              new Set([SERVICE_DATE, ...state.reservations.map((r) => r.date)]),
            )
              .sort()
              .map((date) => (
                <div key={date} className="booking-day">
                  <p className="eyebrow">
                    {date === SERVICE_DATE
                      ? 'TODAY · 3 SEPTEMBER'
                      : new Date(date + 'T12:00:00').toLocaleDateString(
                          'en-GB',
                          { weekday: 'long', day: 'numeric', month: 'long' },
                        )}
                  </p>
                  <div className="booking-list">
                    {state.reservations
                      .filter((r) => r.date === date)
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map(bookingCard)}
                  </div>
                  {!state.reservations.some((r) => r.date === date) && (
                    <div className="empty">
                      <h3>No bookings today</h3>
                      <p>Walk-ins are always welcome.</p>
                    </div>
                  )}
                </div>
              ))}
            <p className="table-hint">
              Tap a booking time to view details or make a change.
            </p>
          </section>
        ) : (
          <section className="secondary-view tables-view">
            <div className="section-heading">
              <h2>Every table, at a glance</h2>
              <span className="ready-count">{ready.length} ready</span>
            </div>
            <div className="table-filters" aria-label="Filter tables">
              {['all', 'available', 'occupied', 'reserved', 'cleaning'].map(
                (filter) => (
                  <Button
                    key={filter}
                    variant="ghost"
                    aria-pressed={tableFilter === filter}
                    className={tableFilter === filter ? 'selected' : ''}
                    onClick={() => setTableFilter(filter)}
                  >
                    {filter === 'all'
                      ? 'All tables'
                      : statusText[filter as keyof typeof statusText]}
                  </Button>
                ),
              )}
            </div>
            {tableGrid}
            {tableFilter !== 'all' &&
              !state.tables.some((t) => t.status === tableFilter) && (
                <div className="empty">
                  <h3>No {tableFilter} tables</h3>
                  <p>Choose another status to see more tables.</p>
                </div>
              )}
            <p className="table-hint">
              {state.tables.length} tables ·{' '}
              {state.tables.reduce((sum, t) => sum + t.capacity, 0)} seats in
              total
            </p>
            <div className="turnover-guide">
              <h3>Keep the evening moving</h3>
              <p>
                Occupied <ArrowRight size={14} /> Cleaning{' '}
                <ArrowRight size={14} /> Ready
              </p>
              <small>
                Finish a table, give it a clean, then mark it ready.
              </small>
            </div>
            <Button
              variant="ghost"
              className="reset-button"
              onClick={() => setModal({ type: 'reset' })}
            >
              <RotateCcw /> Reset demo data
            </Button>
            <p className="demo-note">
              Sample dinner service · 3 September 2026
              <br />
              Service starts at 19:15 and advances while you try it.
            </p>
          </section>
        )}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {destinations.map(({ name, icon: Icon }) => (
          <button
            key={name}
            aria-current={view === name ? 'page' : undefined}
            className={view === name ? 'active' : ''}
            onClick={() => {
              setView(name);
              window.scrollTo({ top: 0 });
            }}
          >
            <Icon size={20} />
            <span>{name}</span>
            {name === 'Bookings' &&
              state.reservations.some((r) => r.status === 'arrived') && (
                <i className="nav-dot" />
              )}
          </button>
        ))}
      </nav>
      {toast && (
        <output className="toast" aria-live="polite">
          <Check size={18} />
          <span>{toast}</span>
          {previous && (
            <button
              onClick={() => {
                if (previous) {
                  stateRef.current = previous;
                  setState(previous);
                  setPrevious(null);
                  setToast('Action undone');
                }
              }}
            >
              Undo
            </button>
          )}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </output>
      )}
      {modal?.type === 'walk-in' && (
        <Sheet
          title="Add a walk-in"
          description="A table starts with a party. The rest is optional."
          onClose={() => setModal(null)}
        >
          <PartyForm onSubmit={addWalkIn} />
        </Sheet>
      )}
      {modal?.type === 'seat' && seatTarget && (
        <Sheet
          title={`Seat ${'queueNumber' in seatTarget ? seatTarget.queueNumber : seatTarget.customerName}`}
          description={`${seatTarget.customerName || 'Walk-in'} · ${seatTarget.partySize} people`}
          onClose={() => setModal(null)}
        >
          {choices.length ? (
            <>
              <p className="choice-label">
                SUITABLE TABLES · SMALLEST FIT FIRST
              </p>
              <div className="table-choices">
                {choices.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      const next = seatParty(
                        stateRef.current,
                        seatTarget.id,
                        modal.kind,
                        t.id,
                        Date.now(),
                      );
                      if (next === stateRef.current) {
                        setToast('That table is no longer available');
                        return;
                      }
                      commit(
                        next,
                        `${'queueNumber' in seatTarget ? seatTarget.queueNumber : seatTarget.customerName} seated at ${t.name}`,
                      );
                    }}
                  >
                    <span className="choice-number">{t.name}</span>
                    <span>
                      <b>{t.capacity} seats</b>
                      <small>
                        {t.status === 'reserved'
                          ? 'Held for this booking'
                          : i === 0
                            ? 'Best fit'
                            : 'Available'}
                      </small>
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
              <p className="form-footnote">
                Choose a table to seat this party. Larger tables are available
                if needed.
              </p>
            </>
          ) : (
            <div className="empty">
              <Users />
              <h3>No suitable tables available</h3>
              <p>
                {'queueNumber' in seatTarget
                  ? seatTarget.queueNumber
                  : seatTarget.customerName}{' '}
                stays{' '}
                {modal.kind === 'queue' ? 'in the queue' : 'in your bookings'}.
                Mark a suitable table ready, then try again.
              </p>
            </div>
          )}
          <Button
            variant="outline"
            className="wide"
            onClick={() => setModal(null)}
          >
            Cancel
          </Button>
        </Sheet>
      )}
      {modal?.type === 'table' && table && (
        <Sheet
          title={`Table ${table.name}`}
          description={`${table.capacity} seats · ${statusText[table.status]}`}
          onClose={() => setModal(null)}
        >
          {table.status === 'occupied' ? (
            <>
              <div className="detail-block">
                <Users />
                <h3>
                  {tableParty?.customerName || 'Walk-in'} ·{' '}
                  {tableParty?.partySize || table.capacity} people
                </h3>
                <p>Seated {minutes(table.seatedAt || now, now)} min ago</p>
              </div>
              <Button
                className="wide"
                onClick={() =>
                  commit(
                    {
                      ...state,
                      tables: state.tables.map((t) =>
                        t.id === table.id
                          ? {
                              ...t,
                              status: 'cleaning',
                              currentPartyId: undefined,
                              seatedAt: undefined,
                              reservationId: undefined,
                            }
                          : t,
                      ),
                    },
                    `${table.name} is now cleaning`,
                  )
                }
              >
                Finish table <Check />
              </Button>
              <p className="form-footnote">
                The table will be marked Cleaning until it’s ready again.
              </p>
            </>
          ) : table.status === 'cleaning' ? (
            <>
              <div className="detail-block">
                <h3>A quick reset for the next party</h3>
                <p>Once the table is clean, make it available for seating.</p>
              </div>
              <Button
                className="wide"
                onClick={() =>
                  commit(
                    {
                      ...state,
                      tables: state.tables.map((t) =>
                        t.id === table.id ? { ...t, status: 'available' } : t,
                      ),
                    },
                    `${table.name} is ready${waiting.find((q) => q.partySize <= table.capacity) ? ' · ' + waiting.find((q) => q.partySize <= table.capacity)!.queueNumber + ' could fit' : ''}`,
                  )
                }
              >
                Mark ready <Check />
              </Button>
            </>
          ) : table.status === 'reserved' && tableBooking ? (
            <>
              <div className="detail-block">
                <h3>
                  {tableBooking.customerName} · {tableBooking.partySize} people
                </h3>
                <p>
                  {tableBooking.time} ·{' '}
                  {tableBooking.status === 'arrived'
                    ? 'Arrived'
                    : 'Upcoming booking'}
                </p>
                <p>{tableBooking.notes}</p>
              </div>
              {tableBooking.status === 'upcoming' ? (
                <Button className="wide" onClick={() => arrive(tableBooking)}>
                  Mark arrived
                </Button>
              ) : (
                <Button
                  className="wide"
                  onClick={() =>
                    setModal({
                      type: 'seat',
                      id: tableBooking.id,
                      kind: 'reservation',
                    })
                  }
                >
                  Seat {tableBooking.customerName} <ArrowUpRight />
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  setModal({ type: 'booking', id: tableBooking.id })
                }
              >
                Booking details
              </Button>
            </>
          ) : (
            <>
              <p className="choice-label">WAITING PARTIES THAT FIT</p>
              {waiting.filter((q) => q.partySize <= table.capacity).length ? (
                <div className="table-choices">
                  {waiting
                    .filter((q) => q.partySize <= table.capacity)
                    .map((q) => (
                      <button
                        key={q.id}
                        onClick={() =>
                          setModal({ type: 'seat', id: q.id, kind: 'queue' })
                        }
                      >
                        <span className="ticket">{q.queueNumber}</span>
                        <span>
                          <b>{q.customerName || 'Walk-in'}</b>
                          <small>
                            {q.partySize} people · waiting{' '}
                            {minutes(q.joinedAt, now)} min
                          </small>
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    ))}
                </div>
              ) : (
                <div className="empty">
                  <h3>Ready for the next party</h3>
                  <p>No waiting parties fit this table right now.</p>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  commit(
                    {
                      ...state,
                      tables: state.tables.map((t) =>
                        t.id === table.id ? { ...t, status: 'cleaning' } : t,
                      ),
                    },
                    `${table.name} marked for cleaning`,
                  )
                }
              >
                Mark for cleaning
              </Button>
            </>
          )}
        </Sheet>
      )}
      {modal?.type === 'queue' && queueParty && (
        <Sheet
          title={`${queueParty.queueNumber} · ${queueParty.customerName || 'Walk-in'}`}
          description={`${queueParty.partySize} people · Waiting ${minutes(queueParty.joinedAt, now)} min`}
          onClose={() => setModal(null)}
        >
          {queueParty.phone && <p>Phone: {queueParty.phone}</p>}
          <Button
            className="wide"
            onClick={() =>
              setModal({ type: 'seat', id: queueParty.id, kind: 'queue' })
            }
          >
            Seat party <ArrowUpRight />
          </Button>
          <div className="form-row">
            <Button
              variant="outline"
              onClick={() =>
                commit(
                  {
                    ...state,
                    queue: state.queue.map((q) =>
                      q.id === queueParty.id ? { ...q, status: 'no-show' } : q,
                    ),
                  },
                  `${queueParty.queueNumber} marked no-show`,
                )
              }
            >
              No-show
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                commit(
                  {
                    ...state,
                    queue: state.queue.map((q) =>
                      q.id === queueParty.id
                        ? { ...q, status: 'cancelled' }
                        : q,
                    ),
                  },
                  `${queueParty.queueNumber} removed from queue`,
                )
              }
            >
              Remove from queue
            </Button>
          </div>
        </Sheet>
      )}
      {modal?.type === 'booking' && (
        <Sheet
          title={
            editBooking
              ? `${editBooking.customerName}’s booking`
              : 'Add a booking'
          }
          description={
            editBooking
              ? `${editBooking.partySize} people · ${editBooking.date} at ${editBooking.time} · ${editBooking.status}`
              : 'Keep a place in the book for a returning face.'
          }
          onClose={() => setModal(null)}
        >
          {!editBooking ||
          ['upcoming', 'arrived'].includes(editBooking.status) ? (
            <>
              <PartyForm
                booking
                initial={editBooking}
                onSubmit={(data) => {
                  const updated = {
                    ...data,
                    id: editBooking?.id || crypto.randomUUID(),
                    status: editBooking?.status || 'upcoming',
                  } as Reservation;
                  const held = state.tables.find(
                    (t) =>
                      t.reservationId === editBooking?.id &&
                      t.status === 'reserved',
                  );
                  const keepHold =
                    held &&
                    data.partySize <= held.capacity &&
                    data.date === SERVICE_DATE;
                  commit(
                    {
                      ...state,
                      reservations: editBooking
                        ? state.reservations.map((r) =>
                            r.id === editBooking.id
                              ? {
                                  ...updated,
                                  assignedTableId: keepHold
                                    ? held.id
                                    : undefined,
                                }
                              : r,
                          )
                        : [...state.reservations, updated],
                      tables:
                        held && !keepHold
                          ? state.tables.map((t) =>
                              t.id === held.id
                                ? {
                                    ...t,
                                    status: 'available',
                                    reservationId: undefined,
                                  }
                                : t,
                            )
                          : state.tables,
                    },
                    editBooking ? 'Booking updated' : 'Booking added',
                  );
                }}
              />
              {editBooking && (
                <div className="form-row">
                  <Button
                    variant="outline"
                    onClick={() => changeBooking(editBooking.id, 'no-show')}
                  >
                    No-show
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => changeBooking(editBooking.id, 'cancelled')}
                  >
                    Cancel booking
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="detail-block">
              <p>{editBooking.phone || 'No phone recorded'}</p>
              <p>{editBooking.notes || 'No additional notes'}</p>
              {editBooking.assignedTableId && (
                <p>Table {editBooking.assignedTableId}</p>
              )}
            </div>
          )}
        </Sheet>
      )}
      {modal?.type === 'reset' && (
        <Sheet
          title="Start a fresh dinner service?"
          description="This replaces your changes with the original busy-night scenario: eight tables, five waiting parties and three bookings."
          onClose={() => setModal(null)}
        >
          <Button
            className="wide"
            onClick={() => commit(seed(), 'Dinner service reset')}
          >
            Reset demo data
          </Button>
          <Button
            variant="outline"
            className="wide"
            onClick={() => setModal(null)}
          >
            Keep this service
          </Button>
        </Sheet>
      )}
    </div>
  );
}
