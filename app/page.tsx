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
  Phone,
  Cigarette,
  Ban,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  seed,
  suitableTables,
  seatParty,
  SERVICE_DATE,
  type ServiceState,
  type Reservation,
} from '@/lib/restaurant';
import { loadService, saveService } from '@/lib/storage';
import { translator, type Language } from '@/lib/i18n';
import {
  TableCard,
  QueueCard,
  ReservationCard,
  Sheet,
  PartyForm,
  minutes,
  duration,
  type PartyInput,
} from '@/components/service-ui';
import { BookingCalendar } from '@/components/booking-calendar';
import { SectionHeading } from '@/components/section-heading';
import {
  TableOverview,
  TableGroupingSwitch,
  type TableFilter,
  type TableGrouping,
} from '@/components/table-overview';
import {
  addDays,
  formatServiceDate,
  hongKongToday,
  sevenDayWindow,
} from '@/lib/dates';
type View = 'Tonight' | 'Bookings' | 'Tables';
type Modal =
  | { type: 'walk-in' }
  | { type: 'seat'; id: string; kind: 'queue' | 'reservation' }
  | { type: 'table'; id: string }
  | { type: 'queue'; id: string }
  | { type: 'booking'; id?: string; date?: string }
  | { type: 'reset' }
  | null;
const destinations = [
  { name: 'Tonight' as const, icon: Moon },
  { name: 'Bookings' as const, icon: CalendarDays },
  { name: 'Tables' as const, icon: LayoutGrid },
];
const hongKongClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Hong_Kong',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
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
  // These two display preferences change how existing data is presented;
  // they do not rewrite table or booking records.
  const [tableFilter, setTableFilter] = useState<TableFilter>('all');
  const [tableGrouping, setTableGrouping] = useState<TableGrouping>('room');
  const [bookingWeekStart, setBookingWeekStart] = useState(SERVICE_DATE);
  const [selectedBookingDate, setSelectedBookingDate] = useState(SERVICE_DATE);
  const [language, setLanguage] = useState<Language>('en');
  const t = translator(language);
  const bookingWeek = sevenDayWindow(bookingWeekStart);
  useEffect(() => {
    const s = loadService();
    const savedLanguage = localStorage.getItem('dai-pai-dong-language');
    if (
      savedLanguage === 'en' ||
      savedLanguage === 'zh-HK' ||
      savedLanguage === 'zh-CN'
    ) {
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }
    stateRef.current = s;
    setState(s);
    setNow(Date.now());
    setHydrated(true);
    const interval = setInterval(() => setNow(Date.now()), 1000);
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
  function changeLanguage(next: Language) {
    setLanguage(next);
    localStorage.setItem('dai-pai-dong-language', next);
    document.documentElement.lang = next;
  }
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
            smoking: data.smoking,
            airConditioning: data.airConditioning,
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
  const timeParts = Object.fromEntries(
    hongKongClock
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  const serviceMinute = Number(timeParts.hour) * 60 + Number(timeParts.minute);
  const clock = `${timeParts.hour}:${timeParts.minute}:${timeParts.second}`;
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
          seatTarget.smoking,
          seatTarget.airConditioning,
        )
      : [];
  const editBooking =
    modal?.type === 'booking'
      ? state.reservations.find((r) => r.id === modal.id)
      : undefined;
  const tableGrid = (
    <div className="table-grid">
      {state.tables.map((tableItem) => (
        <TableCard
          key={tableItem.id}
          table={tableItem}
          now={now}
          reservation={state.reservations.find(
            (r) => r.id === tableItem.reservationId,
          )}
          onClick={() => setModal({ type: 'table', id: tableItem.id })}
          t={t}
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
      t={t}
    />
  );
  return (
    <div className="app">
      <header className="brand">
        <div className="restaurant-brand">
          <svg className="brand-mark" viewBox="0 0 640 700" aria-hidden="true">
            <image
              href="supreme-roast-goose-king-logo.svg"
              width="640"
              height="826"
            />
          </svg>
          <strong className="brand-title">新志興訂位簿</strong>
        </div>
        <div className="header-actions">
          <span className="service-pill">
            <i /> {t('service.open')}
          </span>

          <div
            className="header-clock"
            aria-label={`${t('service.hkTime')}: ${clock}`}
          >
            <Clock3 aria-hidden="true" />
            <span>
              <small>{t('service.currentTime')}</small>
              <b>{clock}</b>
            </span>
          </div>

          <div className="language-switch" aria-label="Language / 語言 / 语言">
            {(
              [
                ['en', 'EN'],
                ['zh-HK', '繁'],
                ['zh-CN', '简'],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                aria-pressed={language === code}
                onClick={() => changeLanguage(code)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main aria-busy={!hydrated}>
        <div className="page-heading">
          <h1>
            {t('nav.' + view.toLowerCase())}
            <span>.</span>
          </h1>
          
          <p className="service-date">
            {formatServiceDate(
              view === 'Bookings' ? selectedBookingDate : SERVICE_DATE,
              language,
              {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              },
            )}
          </p>
        </div>
        {storageIssue && (
          <output className="storage-warning">{t('storage.warning')}</output>
        )}
        {view === 'Tonight' ? (
          <div className="workspace">
            <div className="left-column">
              <section className="table-section">
                <SectionHeading
                  heading={t('tables.title')}
                  context={
                    <>
                      <span>
                        {t('tables.inGroup', { count: state.tables.length })}
                      </span>
                      <span className="ready-count">
                        {t('tables.ready', { count: ready.length })}
                      </span>
                    </>
                  }
                />
                {tableGrid}
                <p className="table-hint">{t('tables.tap')}</p>
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
                    <CalendarDays size={20} />
                    <span>
                      <b>
                        {nextBooking.time} · {nextBooking.customerName}
                      </b>{' '}
                      · {t('party.people', { count: nextBooking.partySize })}
                    </span>
                    <small>
                      {nextBooking.status === 'arrived'
                        ? t('action.arrived')
                        : bookingMinute(nextBooking) < serviceMinute
                          ? t('booking.dueNow')
                          : t('booking.dueSoon')}
                    </small>
                    <ArrowRight size={18} />
                  </button>
                )}
              </section>
              <section className="tonight-bookings booking-surface">
                <SectionHeading
                  heading={t('booking.coming')}
                  context={t('booking.dayCount', {
                    count: reservations.length,
                  })}
                  action={
                    <Button
                      variant="tertiary"
                      onClick={() => setView('Bookings')}
                      className="text-action"
                    >
                      {t('booking.all')} <ArrowRight />
                    </Button>
                  }
                />
                {reservations.length ? (
                  <>
                    <div className="booking-list operational-surface">
                      {reservations.map(bookingCard)}
                    </div>
                    <p className="table-hint">
                      <Clock3 size={18} /> {t('booking.held')}
                    </p>
                  </>
                ) : (
                  <div className="empty">
                    <CalendarDays />
                    <h3>{t('booking.none')}</h3>
                    <p>{t('booking.accounted')}</p>
                  </div>
                )}
              </section>
              <div className="location">
                <MapPin size={18} />
                <span>牛池灣 · 60A Lung Chi Path, Ngau Chi Wan</span>
              </div>
            </div>
            <section className="queue-section">
              <SectionHeading
                heading={t('queue.title')}
                context={t('queue.groups', { count: waiting.length })}
                action={
                  <Button onClick={() => setModal({ type: 'walk-in' })}>
                    <Plus /> {t('queue.walkin')}
                  </Button>
                }
              />
              {waiting.length ? (
                <>
                  <div className="queue-list operational-surface">
                    {waiting.map((q) => (
                      <QueueCard
                        key={q.id}
                        party={q}
                        now={now}
                        onSeat={() =>
                          setModal({ type: 'seat', id: q.id, kind: 'queue' })
                        }
                        onDetail={() => setModal({ type: 'queue', id: q.id })}
                        t={t}
                      />
                    ))}
                  </div>
                  <p className="queue-note">
                    <NotebookPen size={18} /> {t('queue.order')}
                  </p>
                </>
              ) : (
                <div className="empty">
                  <Check />
                  <h3>{t('queue.clear')}</h3>
                  <p>{t('queue.none')}</p>
                  <Button onClick={() => setModal({ type: 'walk-in' })}>
                    <Plus /> {t('queue.add')}
                  </Button>
                </div>
              )}
            </section>
          </div>
        ) : view === 'Bookings' ? (
          <section className="secondary-view booking-view">
            <BookingCalendar
              dates={bookingWeek}
              selectedDate={selectedBookingDate}
              reservations={state.reservations}
              language={language}
              onSelectDate={setSelectedBookingDate}
              onPreviousWeek={() => {
                const start = addDays(bookingWeekStart, -7);
                setBookingWeekStart(start);
                setSelectedBookingDate(start);
              }}
              onNextWeek={() => {
                const start = addDays(bookingWeekStart, 7);
                setBookingWeekStart(start);
                setSelectedBookingDate(start);
              }}
              onToday={() => {
                const today = hongKongToday();
                setBookingWeekStart(today);
                setSelectedBookingDate(today);
              }}
              t={t}
            />
            <div className="booking-day booking-surface operational-surface">
              <SectionHeading
                className="booking-day-heading"
                heading={formatServiceDate(selectedBookingDate, language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                context={t('booking.dayCount', {
                  count: state.reservations.filter(
                    (reservation) => reservation.date === selectedBookingDate,
                  ).length,
                })}
                action={
                  <Button
                    onClick={() =>
                      setModal({
                        type: 'booking',
                        date: selectedBookingDate,
                      })
                    }
                  >
                    <Plus /> {t('booking.add')}
                  </Button>
                }
              />
              <div className="booking-list">
                {state.reservations
                  .filter(
                    (reservation) => reservation.date === selectedBookingDate,
                  )
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(bookingCard)}
              </div>
              {!state.reservations.some(
                (reservation) => reservation.date === selectedBookingDate,
              ) && (
                <div className="empty">
                  <CalendarDays />
                  <h3>{t('booking.empty')}</h3>
                  <p>{t('booking.walkins')}</p>
                </div>
              )}
            </div>
            <p className="table-hint">{t('booking.tap')}</p>
          </section>
        ) : (
          <section className="secondary-view tables-view">
            <SectionHeading
              heading={t('tables.every')}
              context={
                <span className="ready-count">
                  {t('tables.ready', { count: ready.length })}
                </span>
              }
              switcher={
                <TableGroupingSwitch
                  grouping={tableGrouping}
                  onGroupingChange={setTableGrouping}
                  t={t}
                />
              }
            />
            <TableOverview
              tables={state.tables}
              reservations={state.reservations}
              now={now}
              grouping={tableGrouping}
              statusFilter={tableFilter}
              onStatusFilterChange={setTableFilter}
              onOpenTable={(id) => setModal({ type: 'table', id })}
              t={t}
            />
            <p className="table-hint">
              {t('tables.count', {
                count: state.tables.length,
                seats: state.tables.reduce(
                  (sum, table) => sum + table.capacity,
                  0,
                ),
              })}
            </p>
            <div className="turnover-guide">
              <h3>{t('demo.title')}</h3>
              <p>{t('demo.flow')}</p>
              <small>{t('demo.help')}</small>
            </div>
            <Button
              variant="quinary"
              className="reset-button"
              onClick={() => setModal({ type: 'reset' })}
            >
              <RotateCcw /> {t('action.reset')}
            </Button>
            <p className="demo-note">
              {t('demo.note')}
              <br />
              {t('demo.clock')}
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
            <span>{t('nav.' + name.toLowerCase())}</span>
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
              {t('action.undo')}
            </button>
          )}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={20} />
          </button>
        </output>
      )}
      {modal?.type === 'walk-in' && (
        <Sheet
          title={t('form.addWalkin')}
          description={t('form.walkinHelp')}
          onClose={() => setModal(null)}
        >
          <PartyForm onSubmit={addWalkIn} t={t} />
        </Sheet>
      )}
      {modal?.type === 'seat' && seatTarget && (
        <Sheet
          title={`${t('queue.seat')} ${'queueNumber' in seatTarget ? seatTarget.queueNumber : seatTarget.customerName}`}
          description={`${seatTarget.customerName || t('queue.walkin')} · ${t('party.people', { count: seatTarget.partySize })} · ${t(seatTarget.smoking ? 'party.smoking' : 'party.nonSmoking')}`}
          onClose={() => setModal(null)}
        >
          {choices.length ? (
            <>
              <p className="choice-label">{t('sheet.suitable')}</p>
              <div className="table-choices">
                {choices.map((choice, i) => (
                  <button
                    key={choice.id}
                    onClick={() => {
                      const next = seatParty(
                        stateRef.current,
                        seatTarget.id,
                        modal.kind,
                        choice.id,
                        Date.now(),
                      );
                      if (next === stateRef.current) {
                        setToast('That table is no longer available');
                        return;
                      }
                      commit(
                        next,
                        `${'queueNumber' in seatTarget ? seatTarget.queueNumber : seatTarget.customerName} seated at ${choice.name}`,
                      );
                    }}
                  >
                    <span className="choice-number">{choice.name}</span>
                    <span>
                      <b>
                        {choice.capacity} · {t('area.' + choice.area)}
                      </b>
                      <small>
                        {choice.status === 'reserved'
                          ? 'Held for this booking'
                          : i === 0
                            ? choice.area ===
                              (seatTarget.smoking ? 'outdoor' : 'indoor')
                              ? t('sheet.preferred')
                              : t('sheet.bestFit')
                            : t('sheet.available')}
                      </small>
                    </span>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
              <p className="form-footnote">{t('sheet.choose')}</p>
            </>
          ) : (
            <div className="empty">
              <Users />
              <h3>{t('sheet.noTable')}</h3>
              <p>{t('sheet.stays')}</p>
            </div>
          )}
          <Button
            variant="tertiary"
            className="wide"
            onClick={() => setModal(null)}
          >
            {t('action.cancel')}
          </Button>
        </Sheet>
      )}
      {modal?.type === 'table' && table && (
        <Sheet
          title={`${t('nav.tables')} ${table.name}`}
          description={`${t('party.people', { count: table.capacity })} · ${t('area.' + table.area)} · ${t('status.' + table.status)}`}
          onClose={() => setModal(null)}
        >
          {table.status === 'occupied' ? (
            <>
              <div className="detail-block">
                <Users />
                <h3>
                  {tableParty?.customerName || t('queue.walkin')} ·{' '}
                  {t('party.people', {
                    count: tableParty?.partySize || table.capacity,
                  })}
                </h3>
                <p className="detail-line">
                  <Timer aria-hidden="true" />
                  {t('detail.seatedFor', {
                    duration: duration(table.seatedAt || now, now),
                  })}
                </p>
                <p className="detail-line">
                  {tableParty?.smoking ? (
                    <Cigarette aria-hidden="true" />
                  ) : (
                    <Ban aria-hidden="true" />
                  )}
                  {tableParty &&
                    t(
                      tableParty.smoking ? 'party.smoking' : 'party.nonSmoking',
                    )}
                </p>
                <p className="detail-line">
                  <Phone aria-hidden="true" /> {tableParty?.phone}
                </p>
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
                {t('action.finish')} <Check />
              </Button>
              <p className="form-footnote">{t('sheet.cleanHelp')}</p>
            </>
          ) : table.status === 'cleaning' ? (
            <>
              <div className="detail-block">
                <h3>{t('sheet.quickReset')}</h3>
                <p>{t('sheet.cleanHelp')}</p>
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
                {t('action.ready')} <Check />
              </Button>
            </>
          ) : table.status === 'reserved' && tableBooking ? (
            <>
              <div className="detail-block">
                <h3>
                  {tableBooking.customerName} ·{' '}
                  {t('party.people', { count: tableBooking.partySize })}
                </h3>
                <p>
                  {tableBooking.time} ·{' '}
                  {tableBooking.status === 'arrived'
                    ? t('action.arrived')
                    : t('status.upcoming')}
                </p>
                <p>{tableBooking.notes}</p>
              </div>
              {tableBooking.status === 'upcoming' ? (
                <Button className="wide" onClick={() => arrive(tableBooking)}>
                  {t('action.arrived')}
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
                  {t('queue.seat')} {tableBooking.customerName} <ArrowUpRight />
                </Button>
              )}
              <Button
                variant="tertiary"
                onClick={() =>
                  setModal({ type: 'booking', id: tableBooking.id })
                }
              >
                {t('action.details')}
              </Button>
            </>
          ) : (
            <>
              <p className="choice-label">{t('sheet.waitingFits')}</p>
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
                          <b>{q.customerName || t('queue.walkin')}</b>
                          <small>
                            {t('party.people', { count: q.partySize })} ·{' '}
                            {t('queue.waiting', {
                              count: minutes(q.joinedAt, now),
                            })}
                          </small>
                        </span>
                        <ArrowRight size={18} />
                      </button>
                    ))}
                </div>
              ) : (
                <div className="empty">
                  <h3>{t('sheet.readyNext')}</h3>
                  <p>{t('sheet.noFit')}</p>
                </div>
              )}
              <Button
                variant="tertiary"
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
                {t('action.markCleaning')}
              </Button>
            </>
          )}
        </Sheet>
      )}
      {modal?.type === 'queue' && queueParty && (
        <Sheet
          title={`${queueParty.queueNumber} · ${queueParty.customerName || t('queue.walkin')}`}
          description={`${t('party.people', { count: queueParty.partySize })} · ${t('queue.waiting', { count: minutes(queueParty.joinedAt, now) })}`}
          onClose={() => setModal(null)}
        >
          <div className="detail-block compact">
            <p className="detail-line">
              <Phone aria-hidden="true" />
              {t('detail.phone', { phone: queueParty.phone })}
            </p>
            <p className="detail-line">
              {queueParty.smoking ? (
                <Cigarette aria-hidden="true" />
              ) : (
                <Ban aria-hidden="true" />
              )}
              {t('party.preference', {
                smoking: t(
                  queueParty.smoking ? 'party.smoking' : 'party.nonSmoking',
                ),
                area: t(queueParty.smoking ? 'area.outdoor' : 'area.indoor'),
              })}
            </p>
          </div>
          <Button
            className="wide"
            onClick={() =>
              setModal({ type: 'seat', id: queueParty.id, kind: 'queue' })
            }
          >
            {t('queue.seat')} <ArrowUpRight />
          </Button>
          <div className="form-row">
            <Button
              variant="tertiary"
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
              {t('action.noShow')}
            </Button>
            <Button
              variant="tertiary"
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
              {t('action.remove')}
            </Button>
          </div>
        </Sheet>
      )}
      {modal?.type === 'booking' && (
        <Sheet
          title={
            editBooking
              ? `${editBooking.customerName} · ${t('booking.label')}`
              : t('booking.add')
          }
          description={
            editBooking
              ? t('detail.bookingAt', {
                  count: editBooking.partySize,
                  date: editBooking.date,
                  time: editBooking.time,
                  status: t('status.' + editBooking.status),
                })
              : t('booking.formHelp')
          }
          onClose={() => setModal(null)}
        >
          {!editBooking ||
          ['upcoming', 'arrived'].includes(editBooking.status) ? (
            <>
              <PartyForm
                t={t}
                booking
                initial={editBooking}
                defaultDate={modal.date || selectedBookingDate}
                tables={state.tables}
                reservations={state.reservations}
                onSubmit={(data) => {
                  const updated = {
                    ...data,
                    id: editBooking?.id || crypto.randomUUID(),
                    status: editBooking?.status || 'upcoming',
                  } as Reservation;
                  commit(
                    {
                      ...state,
                      reservations: editBooking
                        ? state.reservations.map((r) =>
                            r.id === editBooking.id ? updated : r,
                          )
                        : [...state.reservations, updated],
                      tables: state.tables.map((table) => {
                        if (
                          table.reservationId === updated.id &&
                          table.id !== data.assignedTableId
                        )
                          return {
                            ...table,
                            status: 'available',
                            reservationId: undefined,
                          };
                        if (
                          table.id === data.assignedTableId &&
                          data.date === SERVICE_DATE
                        )
                          return {
                            ...table,
                            status: 'reserved',
                            reservationId: updated.id,
                          };
                        return table;
                      }),
                    },
                    editBooking ? 'Booking updated' : 'Booking added',
                  );
                }}
              />
              {editBooking && (
                <div className="form-row">
                  <Button
                    variant="tertiary"
                    onClick={() => changeBooking(editBooking.id, 'no-show')}
                  >
                    {t('action.noShow')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => changeBooking(editBooking.id, 'cancelled')}
                  >
                    {t('action.cancelBooking')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="detail-block">
              <p className="detail-line">
                <Phone aria-hidden="true" />
                {editBooking.phone || t('detail.noPhone')}
              </p>
              <p className="detail-line">
                {editBooking.smoking ? (
                  <Cigarette aria-hidden="true" />
                ) : (
                  <Ban aria-hidden="true" />
                )}
                {t(editBooking.smoking ? 'party.smoking' : 'party.nonSmoking')}
              </p>
              <p>{editBooking.notes || t('detail.noNotes')}</p>
              {editBooking.assignedTableId && (
                <p>Table {editBooking.assignedTableId}</p>
              )}
            </div>
          )}
        </Sheet>
      )}
      {modal?.type === 'reset' && (
        <Sheet
          title={t('reset.title')}
          description={t('reset.description')}
          onClose={() => setModal(null)}
        >
          <Button
            className="wide"
            onClick={() => commit(seed(), 'Dinner service reset')}
          >
            {t('action.reset')}
          </Button>
          <Button
            variant="tertiary"
            className="wide"
            onClick={() => setModal(null)}
          >
            {t('action.keep')}
          </Button>
        </Sheet>
      )}
    </div>
  );
}
