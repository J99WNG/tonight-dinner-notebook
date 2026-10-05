'use client';
import { useState, type ReactNode, type SubmitEvent } from 'react';
import {
  Check,
  Clock3,
  Users,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  Cigarette,
  Ban,
  Phone,
  Timer,
  Snowflake,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  type RestaurantTable,
  type QueueEntry,
  type Reservation,
  SERVICE_DATE,
} from '@/lib/restaurant';
import type { Translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const operationalType =
  'font-mono tracking-[0.015em] tabular-nums [font-feature-settings:"tnum"_1]';
const selectedControl =
  'border-brand-orange-700 bg-brand-orange-700 text-white';
const tableStatusStyles: Record<RestaurantTable['status'], string> = {
  available:
    'border-[1.5px] border-status-ready-border bg-status-ready text-status-ready-foreground',
  occupied:
    'border-status-occupied-border bg-status-occupied text-status-occupied-foreground',
  reserved:
    'border-status-reserved-border bg-status-reserved text-status-reserved-foreground',
  cleaning:
    'border-dashed border-status-cleaning-border bg-status-cleaning text-status-cleaning-foreground',
};
export const minutes = (since: number, now: number) =>
  Math.max(0, Math.floor((now - since) / 60000));
export const duration = (since: number, now: number) => {
  const totalSeconds = Math.max(0, Math.floor((now - since) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
export function Sheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="bottom-0 top-auto left-0 max-h-[calc(100dvh-max(16px,env(safe-area-inset-top)))] w-full max-w-full translate-none gap-5 overflow-y-auto overscroll-y-contain rounded-t-[22px] rounded-b-none bg-paper px-5 pt-[27px] pb-[max(25px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] min-[761px]:top-1/2 min-[761px]:left-1/2 min-[761px]:max-h-[90dvh] min-[761px]:max-w-[450px] min-[761px]:-translate-x-1/2 min-[761px]:-translate-y-1/2 min-[761px]:rounded-[20px] min-[761px]:p-7 [&_[data-slot=dialog-close]]:top-2 [&_[data-slot=dialog-close]]:right-2 [&_[data-slot=dialog-close]]:min-h-11 [&_[data-slot=dialog-close]]:min-w-11">
        <DialogTitle className="pr-5 text-[25px] leading-[1.2] font-semibold tracking-[-0.8px]">
          {title}
        </DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function TableCard({
  table,
  now,
  reservation,
  onClick,
  t,
  className,
}: {
  table: RestaurantTable;
  now: number;
  reservation?: Reservation;
  onClick: () => void;
  t: Translate;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-28 min-w-0 flex-col rounded-[10px] border bg-muted px-2 py-2.5 text-left transition-transform hover:-translate-y-0.5 min-[769px]:min-h-[119px] min-[769px]:rounded-xl min-[769px]:px-3 min-[769px]:py-[13px]',
        tableStatusStyles[table.status],
        className,
      )}
      aria-label={`${table.name}, ${t('party.people', { count: table.capacity })}, ${t('status.' + table.status)}`}
    >
      <span className="flex items-center justify-between [&>svg]:text-current">
        <b
          className={cn(
            operationalType,
            'text-xl font-semibold min-[769px]:text-[22px]',
          )}
        >
          {table.name}
        </b>
        {table.status === 'available' ? (
          <Check size={20} />
        ) : table.status === 'cleaning' ? (
          <Sparkles size={20} />
        ) : table.status === 'reserved' ? (
          <CalendarDays size={20} />
        ) : (
          <Clock3 size={20} />
        )}
      </span>
      <span className="mt-[7px] flex min-w-0 items-start gap-[5px] text-base leading-[1.35] font-normal whitespace-normal text-ink-muted [overflow-wrap:anywhere]">
        <Users size={18} />
        {table.capacity} · {t('area.' + table.area)}
      </span>
      <span className="mt-auto flex flex-wrap items-end justify-between gap-1.5 pt-3 text-base leading-[1.35] font-semibold whitespace-normal min-[769px]:pt-[15px]">
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {t('status.' + table.status)}
        </span>
        {table.seatedAt ? (
          <span
            className={cn(
              operationalType,
              'inline-flex min-w-0 max-w-full items-center gap-1 [overflow-wrap:anywhere] [&>svg]:size-[18px]',
            )}
          >
            <Timer aria-hidden="true" /> {duration(table.seatedAt, now)}
          </span>
        ) : table.status === 'reserved' && reservation ? (
          <span
            className={cn(
              operationalType,
              'inline-flex min-w-0 max-w-full items-center gap-1 [overflow-wrap:anywhere] [&>svg]:size-[18px]',
            )}
          >
            <Clock3 aria-hidden="true" /> {reservation.time}
          </span>
        ) : null}
      </span>
    </button>
  );
}
export function QueueCard({
  party: q,
  now,
  onSeat,
  onDetail,
  t,
}: {
  party: QueueEntry;
  now: number;
  onSeat: () => void;
  onDetail: () => void;
  t: Translate;
}) {
  return (
    <article className="flex min-h-[108px] items-center gap-2.5 border-b border-dashed border-border px-[13px] py-[17px] last:border-b-0 min-[769px]:min-h-[105px] min-[769px]:gap-3.5 min-[769px]:px-[18px] min-[769px]:py-5 [&>button]:px-3">
      <button
        className={cn(
          operationalType,
          'grid h-[43px] min-w-11 rotate-[-0.7deg] place-items-center rounded-sm border-0 bg-ticket text-base font-bold text-ticket-foreground shadow-[0_2px_5px_oklch(31%_0.092_12/9%)] min-[769px]:h-[46px] min-[769px]:min-w-[49px] min-[769px]:text-[17px]',
        )}
        onClick={onDetail}
        aria-label={`${q.queueNumber} ${q.customerName || t('queue.walkin')}`}
      >
        {q.queueNumber}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-start gap-x-4 gap-y-2.5">
          <h3 className="mb-2 min-w-0 text-lg leading-[1.3] font-semibold [overflow-wrap:anywhere]">
            {q.customerName || t('queue.walkin')}{' '}
            <span className="text-base font-normal text-ink-muted">
              · {t('party.people', { count: q.partySize })}
            </span>
          </h3>
          <a
            className="-mt-2.5 inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-ink-muted no-underline [&>svg]:size-5 [&>svg]:text-brand-orange-700"
            href={`tel:${q.phone.replace(/\s/g, '')}`}
            aria-label={t('detail.phone', { phone: q.phone })}
          >
            <Phone aria-hidden="true" /> {q.phone}
          </a>
        </div>
        <p
          className={cn(
            operationalType,
            'mt-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-ink-muted [&_svg]:size-5 [&_svg]:text-brand-orange-700',
          )}
        >
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Clock3 aria-hidden="true" />
            {t('queue.waiting', { count: minutes(q.joinedAt, now) })}
          </span>
          <span className="inline-flex items-center gap-1.5 text-ink-muted max-[760px]:mt-[5px] max-[760px]:block max-[760px]:first-letter:text-transparent">
            {t('queue.estimate', {
              min: q.estimatedWaitMinutes || 15,
              max: (q.estimatedWaitMinutes || 15) + 5,
            })}
          </span>
        </p>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-base text-ink-muted max-[760px]:gap-x-2.5 max-[760px]:gap-y-[5px] [&_svg]:size-5 [&_svg]:text-brand-orange-700">
          <span className="inline-flex items-center gap-1.5">
            {q.smoking ? <Cigarette /> : <Ban />}
            {t(q.smoking ? 'party.smoking' : 'party.nonSmoking')}
          </span>
          {q.airConditioning && (
            <span className="inline-flex items-center gap-1.5">
              <Snowflake /> {t('party.airConditioned')}
            </span>
          )}
        </span>
      </div>
      <Button
        variant="secondary"
        onClick={onSeat}
        aria-label={`Seat ${q.queueNumber}`}
      >
        {t('queue.seat')} <ArrowUpRight />
      </Button>
    </article>
  );
}
export function ReservationCard({
  reservation: r,
  soon,
  onArrive,
  onSeat,
  onEdit,
  t,
}: {
  reservation: Reservation;
  soon: boolean;
  onArrive: () => void;
  onSeat: () => void;
  onEdit: () => void;
  t: Translate;
}) {
  return (
    <article
      className={cn(
        'flex items-center gap-3.5 border-b border-border px-2.5 py-[18px] last:border-b-0 min-[761px]:px-4 min-[761px]:py-[22px]',
        soon && 'relative bg-status-reserved',
      )}
    >
      <button
        className={cn(
          'min-h-12 min-w-[57px] border-0 bg-transparent p-0 text-left text-[19px] font-semibold',
          soon && 'text-status-reserved-foreground',
        )}
        onClick={onEdit}
        aria-label={`Edit booking for ${r.customerName} at ${r.time}`}
      >
        <span
          className={cn(
            operationalType,
            'flex items-center gap-1.5 text-[19px] font-semibold',
          )}
        >
          {r.time}
        </span>
        <span className="mt-[5px] block text-base font-normal text-ink-muted">
          {r.assignedTableId || t('booking.label')}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-start gap-x-4 gap-y-2.5">
          <h3 className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">
            {r.customerName}{' '}
            <span className="text-base font-normal text-ink-muted">
              · {t('party.people', { count: r.partySize })}
            </span>
          </h3>
          <a
            className="-mt-2.5 inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-ink-muted no-underline [&>svg]:size-5 [&>svg]:text-brand-orange-700"
            href={`tel:${r.phone.replace(/\s/g, '')}`}
            aria-label={t('detail.phone', { phone: r.phone })}
          >
            <Phone aria-hidden="true" /> {r.phone}
          </a>
        </div>
        <p
          className={cn('mt-[7px] text-base text-ink-muted', {
            'text-status-reserved-foreground': r.status === 'upcoming',
            'font-semibold text-status-ready-foreground':
              r.status === 'arrived',
            'text-brand-red-700':
              r.status === 'cancelled' || r.status === 'no-show',
          })}
        >
          {r.status === 'upcoming' && soon
            ? t('booking.dueSoon')
            : t('status.' + r.status)}
        </p>
        <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-base text-ink-muted [&_svg]:size-5 [&_svg]:text-brand-orange-700">
          <span className="inline-flex items-center gap-1.5">
            {r.smoking ? <Cigarette /> : <Ban />}
            {t(r.smoking ? 'party.smoking' : 'party.nonSmoking')}
          </span>
          {r.airConditioning && (
            <span className="inline-flex items-center gap-1.5">
              <Snowflake /> {t('party.airConditioned')}
            </span>
          )}
        </span>
      </div>
      {r.status === 'upcoming' ? (
        <Button
          variant="secondary"
          onClick={onArrive}
          aria-label={`Mark ${r.customerName} arrived`}
        >
          {t('action.arrived')}
        </Button>
      ) : r.status === 'arrived' ? (
        <Button
          onClick={onSeat}
          aria-label={`Seat reservation ${r.customerName}`}
        >
          {t('queue.seat')} <ArrowUpRight />
        </Button>
      ) : (
        <Check size={20} />
      )}
    </article>
  );
}
export interface PartyInput {
  customerName: string;
  phone: string;
  partySize: number;
  date: string;
  time: string;
  notes: string;
  smoking: boolean;
  airConditioning: boolean;
  assignedTableId?: string;
}
export function PartyForm({
  booking = false,
  initial,
  defaultDate = SERVICE_DATE,
  tables = [],
  reservations = [],
  onSubmit,
  t,
}: {
  booking?: boolean;
  initial?: Reservation;
  defaultDate?: string;
  tables?: RestaurantTable[];
  reservations?: Reservation[];
  onSubmit: (data: PartyInput) => void;
  t: Translate;
}) {
  const [errors, setErrors] = useState<
    Partial<Record<'name' | 'phone' | 'size' | 'date' | 'time', string>>
  >({});
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState(initial?.customerName || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [size, setSize] = useState(initial?.partySize || 2);
  const [exactSize, setExactSize] = useState(
    Math.max(7, initial?.partySize || 7),
  );
  const [smoking, setSmoking] = useState(initial?.smoking ?? false);
  const [airConditioning, setAirConditioning] = useState(
    initial?.airConditioning ?? false,
  );
  const [large, setLarge] = useState((initial?.partySize || 2) >= 7);
  const [date, setDate] = useState(initial?.date || defaultDate);
  const [time, setTime] = useState(initial?.time || '19:30');
  const [assignedTableId, setAssignedTableId] = useState(
    initial?.assignedTableId || '',
  );
  const partySize = large ? exactSize : size;
  // Both flows share the same first two steps; bookings add scheduling last.
  const steps = booking
    ? [t('form.stepGuest'), t('form.stepPreferences'), t('form.stepBooking')]
    : [t('form.stepGuest'), t('form.stepPreferences')];
  const eligibleTables = tables
    .filter(
      (table) =>
        table.capacity >= partySize &&
        (date !== SERVICE_DATE ||
          table.status === 'available' ||
          table.reservationId === initial?.id) &&
        !reservations.some(
          (reservation) =>
            reservation.id !== initial?.id &&
            reservation.date === date &&
            reservation.time === time &&
            reservation.assignedTableId === table.id &&
            ['upcoming', 'arrived'].includes(reservation.status),
        ),
    )
    .sort(
      (a, b) =>
        Number(
          b.area ===
            (airConditioning ? 'indoor' : smoking ? 'outdoor' : 'indoor'),
        ) -
          Number(
            a.area ===
              (airConditioning ? 'indoor' : smoking ? 'outdoor' : 'indoor'),
          ) || a.capacity - b.capacity,
    );
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateGuest()) {
      setStep(1);
      return;
    }
    if (booking && !validateSchedule()) {
      setStep(3);
      return;
    }
    onSubmit({
      customerName: customerName.trim(),
      phone: phone.trim(),
      partySize,
      date,
      time,
      notes: notes.trim(),
      smoking,
      airConditioning,
      assignedTableId: eligibleTables.some(
        (table) => table.id === assignedTableId,
      )
        ? assignedTableId
        : undefined,
    });
  }
  function validateGuest() {
    const nextErrors = {
      ...(large && (exactSize < 7 || exactSize > 30)
        ? { size: t('form.exactSizeInvalid') }
        : {}),
      ...(booking && !customerName.trim()
        ? { name: t('form.nameRequired') }
        : {}),
      ...(!phone.trim() ? { phone: t('form.phoneRequired') } : {}),
    };
    setErrors((current) => ({
      ...current,
      size: nextErrors.size,
      name: nextErrors.name,
      phone: nextErrors.phone,
    }));
    return Object.keys(nextErrors).length === 0;
  }
  function validateSchedule() {
    const nextErrors = {
      ...(!date ? { date: t('form.dateRequired') } : {}),
      ...(!time ? { time: t('form.timeRequired') } : {}),
    };
    setErrors((current) => ({
      ...current,
      date: nextErrors.date,
      time: nextErrors.time,
    }));
    return Object.keys(nextErrors).length === 0;
  }
  function continueFlow() {
    if (step === 1 && !validateGuest()) {
      return;
    }
    setStep((current) => Math.min(steps.length, current + 1));
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 [&_fieldset]:m-0 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_label]:text-base [&_label]:font-semibold [&_legend]:text-base [&_legend]:font-semibold [&_label>span]:font-normal [&_label>span]:text-ink-muted [&_input]:mt-2 [&_input]:min-h-[47px] [&_input]:bg-paper [&_input]:text-base"
      noValidate
    >
      <div className="grid gap-2.5 pb-1.5" aria-label={t('form.progress')}>
        <p
          id="form-progress-status"
          className="font-semibold text-ink-muted"
          aria-live="polite"
        >
          {t('form.step', { current: step, total: steps.length })}
        </p>
        <progress
          className="absolute top-0 left-0 z-4 h-1.5 w-full appearance-none overflow-hidden rounded-t-[20px] border-0 bg-muted [&::-moz-progress-bar]:bg-brand-orange-700 [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-brand-orange-700"
          value={step}
          max={steps.length}
          aria-labelledby="form-progress-status"
        />
        <ol className="m-0 flex list-none gap-2 p-0">
          {steps.map((label, index) => {
            const number = index + 1;
            return (
              <li
                key={label}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-start gap-[7px] text-center leading-[1.25] text-ink-muted [&>span]:grid [&>span]:size-7 [&>span]:shrink-0 [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-muted [&>span]:font-bold',
                  number < step &&
                    '[&>span]:bg-status-ready [&>span]:text-status-ready-foreground',
                  number === step &&
                    'font-bold text-brand-orange-800 [&>span]:bg-brand-orange-700 [&>span]:text-paper',
                )}
                aria-current={number === step ? 'step' : undefined}
              >
                <span>{number}</span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
      <div className={step !== 1 ? 'hidden' : 'flex flex-col gap-5'}>
        <fieldset>
          <legend>{t('form.partySize')}</legend>
          <div className="mt-3 grid grid-cols-7 gap-[5px] min-[761px]:gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Button
                type="button"
                variant="outline"
                key={n}
                aria-pressed={n === 7 ? large : !large && size === n}
                className={cn(
                  'min-h-12 p-0 text-base',
                  (n === 7 ? large : !large && size === n) && selectedControl,
                )}
                onClick={() => {
                  setSize(n);
                  setLarge(n === 7);
                }}
              >
                {n === 7 ? '7+' : n}
              </Button>
            ))}
          </div>
        </fieldset>
        {large && (
          <label htmlFor="party-size">
            {t('form.exactSize')}
            <Input
              id="party-size"
              name="size"
              aria-label={t('form.exactSize')}
              type="number"
              min="7"
              max="30"
              value={exactSize}
              aria-invalid={Boolean(errors.size)}
              aria-describedby={errors.size ? 'party-size-error' : undefined}
              onChange={(event) => {
                setExactSize(Number(event.target.value));
                setErrors((current) => ({ ...current, size: undefined }));
              }}
              required
            />
            {errors.size && (
              <span
                id="party-size-error"
                className="mt-[7px] block leading-[1.4] font-semibold text-brand-red-700!"
                role="alert"
              >
                {errors.size}
              </span>
            )}
          </label>
        )}
        <label htmlFor="party-name">
          {t('form.name')}
          <Input
            id="party-name"
            name="name"
            placeholder={t('form.nameHint')}
            value={customerName}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'party-name-error' : undefined}
            onChange={(event) => {
              setCustomerName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
            maxLength={60}
            required={booking}
          />
          {errors.name && (
            <span
              id="party-name-error"
              className="mt-[7px] block leading-[1.4] font-semibold text-brand-red-700!"
              role="alert"
            >
              {errors.name}
            </span>
          )}
        </label>
        <label htmlFor="party-phone">
          {t('form.phone')}
          <Input
            id="party-phone"
            name="phone"
            type="tel"
            placeholder={t('form.phoneHint')}
            value={phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'party-phone-error' : undefined}
            onChange={(event) => {
              setPhone(event.target.value);
              setErrors((current) => ({ ...current, phone: undefined }));
            }}
            maxLength={24}
            required
          />
          {errors.phone && (
            <span
              id="party-phone-error"
              className="mt-[7px] block leading-[1.4] font-semibold text-brand-red-700!"
              role="alert"
            >
              {errors.phone}
            </span>
          )}
        </label>
      </div>
      <div className={step !== 2 ? 'hidden' : 'flex flex-col gap-5'}>
        <fieldset>
          <legend>{t('form.smokingQuestion')}</legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'min-h-12 px-2 text-base',
                !smoking && selectedControl,
              )}
              aria-pressed={!smoking}
              onClick={() => setSmoking(false)}
            >
              <Ban /> {t('form.no')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'min-h-12 px-2 text-base',
                smoking && selectedControl,
              )}
              aria-pressed={smoking}
              onClick={() => {
                setSmoking(true);
                setAirConditioning(false);
              }}
            >
              <Cigarette /> {t('form.yes')}
            </Button>
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('form.airConditioningQuestion')}</legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'min-h-12 px-2 text-base',
                !airConditioning && selectedControl,
              )}
              aria-pressed={!airConditioning}
              onClick={() => setAirConditioning(false)}
            >
              <MapPin /> {t('form.noPreference')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'min-h-12 px-2 text-base',
                airConditioning && selectedControl,
              )}
              aria-pressed={airConditioning}
              onClick={() => {
                setAirConditioning(true);
                setSmoking(false);
              }}
            >
              <Snowflake /> {t('form.airConditioned')}
            </Button>
          </div>
        </fieldset>
      </div>
      {booking && (
        <div className={step !== 3 ? 'hidden' : 'flex flex-col gap-5'}>
          <div className="flex gap-3 [&>*]:min-w-0 [&>*]:flex-1">
            <label htmlFor="party-date">
              {t('form.date')}
              <Input
                id="party-date"
                name="date"
                type="date"
                value={date}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'party-date-error' : undefined}
                onChange={(event) => {
                  setDate(event.target.value);
                  setErrors((current) => ({ ...current, date: undefined }));
                }}
                min={SERVICE_DATE}
                required
              />
              {errors.date && (
                <span
                  id="party-date-error"
                  className="mt-[7px] block leading-[1.4] font-semibold text-brand-red-700!"
                  role="alert"
                >
                  {errors.date}
                </span>
              )}
            </label>
            <label htmlFor="party-time">
              {t('form.time')}
              <Input
                id="party-time"
                name="time"
                type="time"
                value={time}
                aria-invalid={Boolean(errors.time)}
                aria-describedby={errors.time ? 'party-time-error' : undefined}
                onChange={(event) => {
                  setTime(event.target.value);
                  setErrors((current) => ({ ...current, time: undefined }));
                }}
                required
              />
              {errors.time && (
                <span
                  id="party-time-error"
                  className="mt-[7px] block leading-[1.4] font-semibold text-brand-red-700!"
                  role="alert"
                >
                  {errors.time}
                </span>
              )}
            </label>
          </div>
          <fieldset>
            <legend>
              {t('form.assignTable')} <span>{t('form.optional')}</span>
            </legend>
            {eligibleTables.length ? (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {eligibleTables.map((table) => (
                  <Button
                    key={table.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-auto min-h-[58px] flex-col gap-0.5 [&>span]:text-base [&>span]:font-medium [&>span]:text-ink-muted',
                      assignedTableId === table.id &&
                        `${selectedControl} [&>span]:text-inherit`,
                    )}
                    aria-pressed={assignedTableId === table.id}
                    onClick={() =>
                      setAssignedTableId((current) =>
                        current === table.id ? '' : table.id,
                      )
                    }
                  >
                    <b>{table.name}</b>
                    <span>
                      {table.capacity} · {t('area.' + table.area)}
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-base leading-[1.7] text-ink-muted">
                {t('form.noSuitableTable')}
              </p>
            )}
            <p className="mt-2 text-base leading-[1.45] text-ink-muted">
              {t('form.assignTableHelp')}
            </p>
          </fieldset>
          <label htmlFor="party-notes">
            {t('form.notes')} <span>{t('form.optional')}</span>
            <Input
              id="party-notes"
              name="notes"
              placeholder={t('form.notesHint')}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={160}
            />
          </label>
        </div>
      )}
      <div className="sticky bottom-[-28px] z-2 mx-[-2px] flex items-center gap-2.5 bg-[linear-gradient(to_bottom,transparent,var(--paper)_12px)] px-0.5 pt-3 pb-0.5 [&>button]:w-0 [&>button]:flex-1">
        {step > 1 && (
          <Button
            type="button"
            variant="quaternary"
            onClick={() => {
              setStep((current) => Math.max(1, current - 1));
            }}
          >
            <ArrowLeft /> {t('action.back')}
          </Button>
        )}
        {step < steps.length ? (
          <Button
            type="button"
            onClick={continueFlow}
            className="min-h-[52px] w-full text-base"
          >
            {t('action.next')} <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" className="min-h-[52px] w-full text-base">
            {booking
              ? initial
                ? t('form.saveBooking')
                : t('form.createBooking')
              : t('form.addQueue')}{' '}
            <ArrowUpRight />
          </Button>
        )}
      </div>
      {!booking && step === 2 && (
        <p className="text-center text-base leading-[1.7] text-ink-muted">
          {t('form.fast')}
        </p>
      )}
    </form>
  );
}
