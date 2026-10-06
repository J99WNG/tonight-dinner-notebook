/* Mount hydration reads the device store; action helpers run only from user events. */
/* oxlint-disable react/react-compiler */
'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Users,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  ArrowRight,
  MapPin,
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
import { SectionHeading } from '@/components/section-heading';
import type { TableFilter, TableGrouping } from '@/components/table-overview';
import {
  addDays,
  formatServiceDate,
  hongKongToday,
  sevenDayWindow,
} from '@/lib/dates';
import { cn } from '@/lib/utils';
import {
  ActionToast,
  PrimaryNavigation,
  ServiceHeader,
  type ServiceView,
} from '@/components/app-shell';
import {
  ChoiceItem,
  ChoiceList,
  DetailLine,
  DetailPanel,
  EmptyState,
  FormFootnote,
  OperationalSurface,
  ReadyBadge,
  SupportingText,
  operationalType,
} from '@/components/operational-ui';
import { BookingsView, TablesView } from '@/components/service-views';
type Modal =
  | { type: 'walk-in' }
  | { type: 'seat'; id: string; kind: 'queue' | 'reservation' }
  | { type: 'table'; id: string }
  | { type: 'queue'; id: string }
  | { type: 'booking'; id?: string; date?: string }
  | { type: 'reset' }
  | null;
const wideButton = 'min-h-12 w-full text-base';
const formRow =
  'flex gap-3 [&>*]:min-w-0 [&>*]:flex-1 [&>button]:px-2 [&>button]:text-base [&>button]:whitespace-normal';
const ticket = cn(
  operationalType,
  'grid size-12 -rotate-1 place-items-center rounded-sm border-0 bg-ticket text-lg font-bold text-ticket-foreground shadow-sm',
);
const hongKongClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Hong_Kong',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/**
 * Application orchestrator. Product designers should find visual composition
 * in the extracted view/pattern components; this file owns state and actions.
 */
export default function Home() {
  const [state, setState] = useState<ServiceState>(() => seed(0));
  const stateRef = useRef(state);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(0);
  const [view, setView] = useState<ServiceView>('Tonight');
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
    <div className="mx-auto max-w-7xl">
      <ServiceHeader
        clock={clock}
        language={language}
        onLanguageChange={changeLanguage}
        t={t}
      />
      <main className="px-5 pt-6 pb-32 md:px-12 md:pt-9" aria-busy={!hydrated}>
        <div className="mb-6 flex flex-col items-start justify-between gap-x-10 gap-y-2 md:flex-row md:items-baseline md:gap-y-5">
          <h1 className="my-2 text-4xl leading-tight font-semibold tracking-tight md:text-5xl [&>span]:text-brand-orange-600">
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
          <output className="mb-5 block bg-status-cleaning p-4 leading-normal text-status-cleaning-foreground">
            {t('storage.warning')}
          </output>
        )}
        {view === 'Tonight' ? (
          <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-8">
            <div className="contents">
              <section className="order-0 md:col-span-2">
                <SectionHeading
                  heading={t('tables.title')}
                  context={
                    <>
                      <span>
                        {t('tables.inGroup', { count: state.tables.length })}
                      </span>
                      <ReadyBadge>
                        {t('tables.ready', { count: ready.length })}
                      </ReadyBadge>
                    </>
                  }
                />
                {tableGrid}
                <SupportingText>{t('tables.tap')}</SupportingText>
                {nextBooking && (
                  <button
                    className={cn(
                      operationalType,
                      'mt-3 hidden min-h-12 w-full items-center gap-2 rounded-lg border border-brand-orange-200 bg-brand-orange-100 p-2.5 text-left text-base text-brand-red-700 max-md:flex [&>span]:flex-1 [&_b]:font-semibold',
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
              <section className="order-2 mt-0 md:col-start-1 md:row-start-2">
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
                    <OperationalSurface className="[&>article]:px-5">
                      {reservations.map(bookingCard)}
                    </OperationalSurface>
                    <SupportingText>
                      <Clock3 size={18} /> {t('booking.held')}
                    </SupportingText>
                  </>
                ) : (
                  <EmptyState
                    icon={<CalendarDays />}
                    title={t('booking.none')}
                    description={t('booking.accounted')}
                  />
                )}
              </section>
              <div className="order-3 mt-px flex items-center gap-2 pb-1 text-base text-ink-muted md:col-start-1 md:row-start-3">
                <MapPin size={18} />
                <span>牛池灣 · 60A Lung Chi Path, Ngau Chi Wan</span>
              </div>
            </div>
            <section className="order-1 self-start md:col-start-2 md:row-span-2 md:row-start-2">
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
                  <OperationalSurface className="overflow-hidden">
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
                  </OperationalSurface>
                  <SupportingText>
                    <NotebookPen size={18} /> {t('queue.order')}
                  </SupportingText>
                </>
              ) : (
                <EmptyState
                  icon={<Check />}
                  title={t('queue.clear')}
                  description={t('queue.none')}
                >
                  <Button onClick={() => setModal({ type: 'walk-in' })}>
                    <Plus /> {t('queue.add')}
                  </Button>
                </EmptyState>
              )}
            </section>
          </div>
        ) : view === 'Bookings' ? (
          <BookingsView
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
            onAddBooking={() =>
              setModal({ type: 'booking', date: selectedBookingDate })
            }
            renderBooking={bookingCard}
            t={t}
          />
        ) : (
          <TablesView
            tables={state.tables}
            reservations={state.reservations}
            now={now}
            grouping={tableGrouping}
            statusFilter={tableFilter}
            onGroupingChange={setTableGrouping}
            onStatusFilterChange={setTableFilter}
            onOpenTable={(id) => setModal({ type: 'table', id })}
            onReset={() => setModal({ type: 'reset' })}
            t={t}
          />
        )}
      </main>
      <PrimaryNavigation
        currentView={view}
        hasArrivedBooking={state.reservations.some(
          (reservation) => reservation.status === 'arrived',
        )}
        onSelect={(nextView) => {
          setView(nextView);
          window.scrollTo({ top: 0 });
        }}
        t={t}
      />
      {toast && (
        <ActionToast
          message={toast}
          canUndo={Boolean(previous)}
          onUndo={() => {
            if (!previous) return;
            stateRef.current = previous;
            setState(previous);
            setPrevious(null);
            setToast('Action undone');
          }}
          onDismiss={() => setToast('')}
          t={t}
        />
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
              <p className="text-base font-bold tracking-wide text-ink-muted">
                {t('sheet.suitable')}
              </p>
              <ChoiceList>
                {choices.map((choice, i) => (
                  <ChoiceItem
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
                        'min-w-12 text-2xl font-semibold',
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
                  </ChoiceItem>
                ))}
              </ChoiceList>
              <FormFootnote>{t('sheet.choose')}</FormFootnote>
            </>
          ) : (
            <EmptyState
              icon={<Users />}
              title={t('sheet.noTable')}
              description={t('sheet.stays')}
            />
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
              <DetailPanel>
                <Users />
                <h3>
                  {tableParty?.customerName || t('queue.walkin')} ·{' '}
                  {t('party.people', {
                    count: tableParty?.partySize || table.capacity,
                  })}
                </h3>
                <DetailLine className={operationalType}>
                  <Timer aria-hidden="true" />
                  {t('detail.seatedFor', {
                    duration: duration(table.seatedAt || now, now),
                  })}
                </DetailLine>
                <DetailLine>
                  {tableParty?.smoking ? (
                    <Cigarette aria-hidden="true" />
                  ) : (
                    <Ban aria-hidden="true" />
                  )}
                  {tableParty &&
                    t(
                      tableParty.smoking ? 'party.smoking' : 'party.nonSmoking',
                    )}
                </DetailLine>
                <DetailLine>
                  <Phone aria-hidden="true" /> {tableParty?.phone}
                </DetailLine>
              </DetailPanel>
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
              <FormFootnote>{t('sheet.cleanHelp')}</FormFootnote>
            </>
          ) : table.status === 'cleaning' ? (
            <>
              <DetailPanel>
                <h3>{t('sheet.quickReset')}</h3>
                <p>{t('sheet.cleanHelp')}</p>
              </DetailPanel>
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
              <DetailPanel>
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
              </DetailPanel>
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
              <p className="text-base font-bold tracking-wide text-ink-muted">
                {t('sheet.waitingFits')}
              </p>
              {waiting.filter((q) => q.partySize <= table.capacity).length ? (
                <ChoiceList>
                  {waiting
                    .filter((q) => q.partySize <= table.capacity)
                    .map((q) => (
                      <ChoiceItem
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
                      </ChoiceItem>
                    ))}
                </ChoiceList>
              ) : (
                <EmptyState
                  title={t('sheet.readyNext')}
                  description={t('sheet.noFit')}
                />
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
          <DetailPanel compact>
            <DetailLine>
              <Phone aria-hidden="true" />
              {t('detail.phone', { phone: queueParty.phone })}
            </DetailLine>
            <DetailLine>
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
            </DetailLine>
          </DetailPanel>
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
            <DetailPanel>
              <DetailLine>
                <Phone aria-hidden="true" />
                {editBooking.phone || t('detail.noPhone')}
              </DetailLine>
              <DetailLine>
                {editBooking.smoking ? (
                  <Cigarette aria-hidden="true" />
                ) : (
                  <Ban aria-hidden="true" />
                )}
                {t(editBooking.smoking ? 'party.smoking' : 'party.nonSmoking')}
              </DetailLine>
              <p>{editBooking.notes || t('detail.noNotes')}</p>
              {editBooking.assignedTableId && (
                <p>Table {editBooking.assignedTableId}</p>
              )}
            </DetailPanel>
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
