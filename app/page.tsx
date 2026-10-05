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
import { cn } from '@/lib/utils';
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
const operationalType =
  'font-mono tracking-[0.015em] tabular-nums [font-feature-settings:"tnum"_1]';
const operationalSurface = 'rounded-[14px] bg-paper';
const supportingText =
  'mt-3.5 flex items-center gap-1.5 text-base leading-normal text-ink-muted';
const emptyState =
  'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-5 py-[30px] text-center text-ink-muted [&>h3]:text-[17px] [&>h3]:text-foreground [&>p]:max-w-[300px] [&>p]:text-base [&>p]:leading-relaxed';
const wideButton = 'min-h-[52px] w-full text-base';
const detailBlock =
  'flex flex-col gap-2.5 rounded-xl bg-muted p-6 [&>h3]:text-lg [&>h3]:font-semibold [&>p]:text-base [&>p]:leading-normal [&>p]:text-ink-muted';
const detailLine =
  'inline-flex items-center gap-1.5 [&>svg]:size-5 [&>svg]:text-brand-orange-700';
const formRow =
  'flex gap-3 [&>*]:min-w-0 [&>*]:flex-1 [&>button]:px-2 [&>button]:text-base [&>button]:whitespace-normal';
const ticket = cn(
  operationalType,
  'grid h-[46px] min-w-[49px] rotate-[-0.7deg] place-items-center rounded-sm border-0 bg-ticket text-[17px] font-bold text-ticket-foreground shadow-[0_2px_5px_oklch(31%_0.092_12/9%)]',
);
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
    <div className="grid grid-cols-2 gap-3 min-[769px]:grid-cols-4">
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
    <div className="mx-auto max-w-[1240px]">
      <header className="mx-5 flex min-h-[92px] items-center gap-[9px] border-b border-border min-[769px]:mx-12 min-[769px]:min-h-28 min-[769px]:gap-5">
        <div className="flex min-w-0 items-center gap-2 min-[769px]:gap-3.5">
          <svg
            className="h-[50px] w-[42px] overflow-hidden min-[769px]:h-[72px] min-[769px]:w-[62px]"
            viewBox="0 0 640 700"
            aria-hidden="true"
          >
            <image
              href="supreme-roast-goose-king-logo.svg"
              width="640"
              height="826"
            />
          </svg>
          <strong className="text-base leading-[1.2] tracking-[0.04em] whitespace-nowrap min-[769px]:leading-[1.3]">
            新志興訂位簿
          </strong>
        </div>
        <div className="ml-auto flex items-center gap-2 min-[769px]:gap-[18px]">
          <span className="hidden items-center gap-[7px] text-base min-[761px]:flex">
            <i className="size-[7px] rounded-full bg-status-ready-border" />{' '}
            {t('service.open')}
          </span>

          <div
            className={cn(
              operationalType,
              'inline-flex min-h-11 items-center gap-[9px] text-foreground [&>svg]:size-[22px] [&>svg]:text-brand-orange-700',
            )}
            aria-label={`${t('service.hkTime')}: ${clock}`}
          >
            <Clock3 aria-hidden="true" />
            <span className="flex flex-col items-start gap-px">
              <small className="sr-only text-base leading-[1.1] text-ink-muted min-[761px]:not-sr-only">
                {t('service.currentTime')}
              </small>
              <b className="text-lg leading-[1.1] min-[761px]:text-[22px]">
                {clock}
              </b>
            </span>
          </div>

          <div
            className="flex rounded-[9px] bg-muted p-[3px]"
            aria-label="Language / 語言 / 语言"
          >
            {(
              [
                ['en', 'EN'],
                ['zh-HK', '繁'],
                ['zh-CN', '简'],
              ] as const
            ).map(([code, label]) => (
              <button
                className="min-h-8 min-w-[31px] rounded-[7px] border-0 bg-transparent text-base text-ink-muted aria-pressed:bg-paper aria-pressed:font-bold aria-pressed:text-brand-orange-800 aria-pressed:shadow-[0_1px_5px_oklch(27.9%_0.102_12.9/7%)] min-[761px]:min-h-[34px] min-[761px]:min-w-[35px]"
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
      <main
        className="px-5 pt-6 pb-[125px] min-[769px]:px-12 min-[769px]:pt-9 min-[769px]:pb-[130px]"
        aria-busy={!hydrated}
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-x-10 gap-y-2 min-[769px]:flex-row min-[769px]:items-baseline min-[769px]:gap-y-5">
          <h1 className="my-2 text-[38px] leading-[1.2] font-semibold tracking-[-2.5px] min-[769px]:text-5xl [&>span]:text-brand-orange-600">
            {t('nav.' + view.toLowerCase())}
            <span>.</span>
          </h1>

          <p
            className={cn(
              operationalType,
              'text-xl font-bold text-brand-red-700 sm:text-3xl',
            )}
          >
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
          <output className="mb-5 block bg-status-cleaning p-[15px] leading-normal text-status-cleaning-foreground">
            {t('storage.warning')}
          </output>
        )}
        {view === 'Tonight' ? (
          <div className="flex flex-col gap-6 min-[769px]:grid min-[769px]:grid-cols-[1fr_1.1fr] min-[769px]:[grid-template-areas:'tables_tables'_'bookings_queue'_'location_queue'] min-[769px]:gap-10">
            <div className="contents">
              <section className="order-0 min-[769px]:[grid-area:tables]">
                <SectionHeading
                  heading={t('tables.title')}
                  context={
                    <>
                      <span>
                        {t('tables.inGroup', { count: state.tables.length })}
                      </span>
                      <span
                        className={cn(
                          operationalType,
                          'rounded-[20px] bg-status-ready px-2.5 py-1.5 text-base text-status-ready-foreground',
                        )}
                      >
                        {t('tables.ready', { count: ready.length })}
                      </span>
                    </>
                  }
                />
                {tableGrid}
                <p className={supportingText}>{t('tables.tap')}</p>
                {nextBooking && (
                  <button
                    className={cn(
                      operationalType,
                      'mt-3.5 hidden min-h-[46px] w-full items-center gap-[7px] rounded-[9px] border border-brand-orange-200 bg-brand-orange-100 p-2.5 text-left text-base text-brand-red-700 max-[760px]:flex [&>span]:flex-1 [&_b]:font-semibold',
                    )}
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
              <section className="order-2 mt-0 min-[769px]:mt-[5px] min-[769px]:[grid-area:bookings]">
                <SectionHeading
                  heading={t('booking.coming')}
                  context={t('booking.dayCount', {
                    count: reservations.length,
                  })}
                  action={
                    <Button
                      variant="tertiary"
                      onClick={() => setView('Bookings')}
                      className="min-h-11 text-base"
                    >
                      {t('booking.all')} <ArrowRight />
                    </Button>
                  }
                />
                {reservations.length ? (
                  <>
                    <div className={cn(operationalSurface, '[&>article]:px-5')}>
                      {reservations.map(bookingCard)}
                    </div>
                    <p className={supportingText}>
                      <Clock3 size={18} /> {t('booking.held')}
                    </p>
                  </>
                ) : (
                  <div className={emptyState}>
                    <CalendarDays />
                    <h3>{t('booking.none')}</h3>
                    <p>{t('booking.accounted')}</p>
                  </div>
                )}
              </section>
              <div className="order-3 mt-px flex items-center gap-[7px] pb-1 text-base text-ink-muted min-[769px]:[grid-area:location]">
                <MapPin size={18} />
                <span>牛池灣 · 60A Lung Chi Path, Ngau Chi Wan</span>
              </div>
            </div>
            <section className="order-1 self-start min-[769px]:[grid-area:queue]">
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
                  <div className={cn(operationalSurface, 'overflow-hidden')}>
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
                  <p className={supportingText}>
                    <NotebookPen size={18} /> {t('queue.order')}
                  </p>
                </>
              ) : (
                <div className={emptyState}>
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
          <section className="w-full max-w-none">
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
            <div className={cn(operationalSurface, 'mt-7 p-6')}>
              <SectionHeading
                className="items-end [&_h2]:mt-[5px]"
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
              <div>
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
                <div className={emptyState}>
                  <CalendarDays />
                  <h3>{t('booking.empty')}</h3>
                  <p>{t('booking.walkins')}</p>
                </div>
              )}
            </div>
            <p className={supportingText}>{t('booking.tap')}</p>
          </section>
        ) : (
          <section className="w-full max-w-none">
            <SectionHeading
              heading={t('tables.every')}
              context={
                <span
                  className={cn(
                    operationalType,
                    'rounded-[20px] bg-status-ready px-2.5 py-1.5 text-base text-status-ready-foreground',
                  )}
                >
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
            <p className={supportingText}>
              {t('tables.count', {
                count: state.tables.length,
                seats: state.tables.reduce(
                  (sum, table) => sum + table.capacity,
                  0,
                ),
              })}
            </p>
            <div className="mt-[30px] border-t border-border pt-[25px]">
              <h3 className="text-base font-semibold">{t('demo.title')}</h3>
              <p className="my-4 flex items-center gap-2.5 text-base">
                {t('demo.flow')}
              </p>
              <small className="text-ink-muted">{t('demo.help')}</small>
            </div>
            <Button
              variant="quinary"
              className="mt-10 mb-2 pl-0 text-base text-ink-muted"
              onClick={() => setModal({ type: 'reset' })}
            >
              <RotateCcw /> {t('action.reset')}
            </Button>
            <p className="text-base leading-[1.7] text-ink-muted">
              {t('demo.note')}
              <br />
              {t('demo.clock')}
            </p>
          </section>
        )}
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around gap-1.5 border border-b-0 border-border bg-paper px-3.5 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] shadow-[0_6px_30px_oklch(27.9%_0.102_12.9/5%)] min-[769px]:inset-x-auto min-[769px]:bottom-5 min-[769px]:left-1/2 min-[769px]:-translate-x-1/2 min-[769px]:rounded-[18px] min-[769px]:border-b min-[769px]:p-[7px]"
        aria-label="Main navigation"
      >
        {destinations.map(({ name, icon: Icon }) => (
          <button
            key={name}
            aria-current={view === name ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[58px] min-w-0 flex-1 flex-col items-center justify-center gap-[5px] rounded-xl border-0 bg-transparent text-base text-ink-muted min-[769px]:min-h-[52px] min-[769px]:min-w-[122px] min-[769px]:flex-row min-[769px]:gap-[9px]',
              view === name &&
                'bg-brand-orange-100 font-bold text-brand-orange-800',
            )}
            onClick={() => {
              setView(name);
              window.scrollTo({ top: 0 });
            }}
          >
            <Icon size={20} />
            <span>{t('nav.' + name.toLowerCase())}</span>
            {name === 'Bookings' &&
              state.reservations.some((r) => r.status === 'arrived') && (
                <i className="size-[5px] rounded-full bg-brand-red-500" />
              )}
          </button>
        ))}
      </nav>
      {toast && (
        <output
          className="fixed bottom-[88px] left-1/2 z-70 flex w-max max-w-[calc(100%-28px)] -translate-x-1/2 items-center gap-1.5 rounded-xl bg-foreground px-2.5 py-[7px] text-base text-white shadow-[0_8px_30px_oklch(27.9%_0.102_12.9/14%)] min-[761px]:bottom-[104px] min-[761px]:gap-2.5 min-[761px]:px-3.5 min-[761px]:py-[9px] [&>svg]:text-brand-orange-200 [&>span]:max-w-[205px] min-[761px]:[&>span]:max-w-[270px] [&>button]:min-h-11 [&>button]:min-w-10 [&>button]:border-0 [&>button]:bg-transparent [&>button]:font-semibold [&>button]:text-brand-orange-100"
          aria-live="polite"
        >
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
              <p className="text-base font-bold tracking-[1.4px] text-ink-muted">
                {t('sheet.suitable')}
              </p>
              <div className="flex flex-col gap-2">
                {choices.map((choice, i) => (
                  <button
                    className="flex min-h-20 w-full items-center gap-[15px] rounded-xl border border-brand-orange-200 bg-brand-orange-50 p-4 text-left [&>span:nth-child(2)]:flex-1 [&_b]:text-base [&_b]:font-semibold [&_small]:mt-[5px] [&_small]:block [&_small]:text-base [&_small]:text-ink-muted"
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
                    <span
                      className={cn(
                        operationalType,
                        'min-w-[45px] text-[26px] font-semibold',
                      )}
                    >
                      {choice.name}
                    </span>
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
              <p className="text-center text-base leading-[1.7] text-ink-muted">
                {t('sheet.choose')}
              </p>
            </>
          ) : (
            <div className={emptyState}>
              <Users />
              <h3>{t('sheet.noTable')}</h3>
              <p>{t('sheet.stays')}</p>
            </div>
          )}
          <Button
            variant="tertiary"
            className={wideButton}
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
              <div className={detailBlock}>
                <Users />
                <h3>
                  {tableParty?.customerName || t('queue.walkin')} ·{' '}
                  {t('party.people', {
                    count: tableParty?.partySize || table.capacity,
                  })}
                </h3>
                <p className={cn(detailLine, operationalType)}>
                  <Timer aria-hidden="true" />
                  {t('detail.seatedFor', {
                    duration: duration(table.seatedAt || now, now),
                  })}
                </p>
                <p className={detailLine}>
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
                <p className={detailLine}>
                  <Phone aria-hidden="true" /> {tableParty?.phone}
                </p>
              </div>
              <Button
                className={wideButton}
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
              <p className="text-center text-base leading-[1.7] text-ink-muted">
                {t('sheet.cleanHelp')}
              </p>
            </>
          ) : table.status === 'cleaning' ? (
            <>
              <div className={detailBlock}>
                <h3>{t('sheet.quickReset')}</h3>
                <p>{t('sheet.cleanHelp')}</p>
              </div>
              <Button
                className={wideButton}
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
              <div className={detailBlock}>
                <h3>
                  {tableBooking.customerName} ·{' '}
                  {t('party.people', { count: tableBooking.partySize })}
                </h3>
                <p className={operationalType}>
                  {tableBooking.time} ·{' '}
                  {tableBooking.status === 'arrived'
                    ? t('action.arrived')
                    : t('status.upcoming')}
                </p>
                <p>{tableBooking.notes}</p>
              </div>
              {tableBooking.status === 'upcoming' ? (
                <Button
                  className={wideButton}
                  onClick={() => arrive(tableBooking)}
                >
                  {t('action.arrived')}
                </Button>
              ) : (
                <Button
                  className={wideButton}
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
              <p className="text-base font-bold tracking-[1.4px] text-ink-muted">
                {t('sheet.waitingFits')}
              </p>
              {waiting.filter((q) => q.partySize <= table.capacity).length ? (
                <div className="flex flex-col gap-2">
                  {waiting
                    .filter((q) => q.partySize <= table.capacity)
                    .map((q) => (
                      <button
                        className="flex min-h-20 w-full items-center gap-[15px] rounded-xl border border-brand-orange-200 bg-brand-orange-50 p-4 text-left [&>span:nth-child(2)]:flex-1 [&_b]:text-base [&_b]:font-semibold [&_small]:mt-[5px] [&_small]:block [&_small]:text-base [&_small]:text-ink-muted"
                        key={q.id}
                        onClick={() =>
                          setModal({ type: 'seat', id: q.id, kind: 'queue' })
                        }
                      >
                        <span className={ticket}>{q.queueNumber}</span>
                        <span>
                          <b>{q.customerName || t('queue.walkin')}</b>
                          <small className={operationalType}>
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
                <div className={emptyState}>
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
          <div className={cn(detailBlock, 'p-4')}>
            <p className={detailLine}>
              <Phone aria-hidden="true" />
              {t('detail.phone', { phone: queueParty.phone })}
            </p>
            <p className={detailLine}>
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
            className={wideButton}
            onClick={() =>
              setModal({ type: 'seat', id: queueParty.id, kind: 'queue' })
            }
          >
            {t('queue.seat')} <ArrowUpRight />
          </Button>
          <div className={formRow}>
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
                <div className={formRow}>
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
            <div className={detailBlock}>
              <p className={detailLine}>
                <Phone aria-hidden="true" />
                {editBooking.phone || t('detail.noPhone')}
              </p>
              <p className={detailLine}>
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
            className={wideButton}
            onClick={() => commit(seed(), 'Dinner service reset')}
          >
            {t('action.reset')}
          </Button>
          <Button
            variant="tertiary"
            className={wideButton}
            onClick={() => setModal(null)}
          >
            {t('action.keep')}
          </Button>
        </Sheet>
      )}
    </div>
  );
}
