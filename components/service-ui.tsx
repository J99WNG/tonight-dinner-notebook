'use client';

import { useState, type SubmitEvent } from 'react';
import {
  Check,
  Clock3,
  Users,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  Cigarette,
  Ban,
  Snowflake,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFootnote, operationalType } from '@/components/operational-ui';
import { FieldError, FormProgress } from '@/components/molecules/form-progress';
import {
  HongKongPhoneField,
  hongKongPhoneDigits,
} from '@/components/molecules/hong-kong-phone-field';
import { PartyIdentity, PartyMeta } from '@/components/molecules/party-summary';

import {
  type RestaurantTable,
  type QueueEntry,
  type Reservation,
  SERVICE_DATE,
} from '@/lib/restaurant';
import type { Translate } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export { ActionSheet as Sheet } from '@/components/molecules/action-sheet';

// Card configuration
// Attribute variants have greater specificity than the base outline variant,
// so a selected control cannot fall back to a grey background with white text.
const selectedControl =
  'aria-pressed:border-brand-orange-800 aria-pressed:bg-brand-orange-800 aria-pressed:text-paper aria-pressed:hover:bg-brand-orange-800 aria-pressed:hover:text-paper';
const tableStatusStyles: Record<RestaurantTable['status'], string> = {
  available:
    'border-status-ready-border bg-status-ready text-status-ready-foreground',
  occupied:
    'border-status-occupied-border bg-status-occupied text-status-occupied-foreground',
  reserved:
    'border-status-reserved-border bg-status-reserved text-status-reserved-foreground',
  cleaning:
    'border-dashed border-status-cleaning-border bg-status-cleaning text-status-cleaning-foreground',
};

// Time-formatting helpers
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

/** Status-aware table card used in both the Tonight and full Tables views. */
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
        'flex min-h-28 min-w-0 flex-col rounded-xl border bg-muted p-2.5 text-left transition-transform hover:-translate-y-0.5 md:min-h-32 md:p-3',
        tableStatusStyles[table.status],
        className,
      )}
      aria-label={`${table.name}, ${t('party.people', { count: table.capacity })}, ${t('status.' + table.status)}`}
    >
      <span className="flex items-center justify-between [&>svg]:text-current">
        <b className={cn(operationalType, 'text-xl font-semibold md:text-2xl')}>
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
      <span className="mt-2 flex min-w-0 items-start gap-1.5 text-base leading-snug font-normal whitespace-normal text-ink-muted [overflow-wrap:anywhere]">
        <Users size={18} />
        {table.capacity} · {t('area.' + table.area)}
      </span>
      <span className="mt-auto flex flex-wrap items-end justify-between gap-1.5 pt-3 text-base leading-snug font-semibold whitespace-normal md:pt-4">
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {t('status.' + table.status)}
        </span>
        {table.seatedAt ? (
          <span
            className={cn(
              operationalType,
              'inline-flex min-w-0 max-w-full items-center gap-1 [overflow-wrap:anywhere] [&>svg]:size-4.5',
            )}
          >
            {duration(table.seatedAt, now)}
          </span>
        ) : table.status === 'reserved' && reservation ? (
          <span
            className={cn(
              operationalType,
              'inline-flex min-w-0 max-w-full items-center gap-1 [overflow-wrap:anywhere] [&>svg]:size-4.5',
            )}
          >
            {reservation.time}
          </span>
        ) : null}
      </span>
    </button>
  );
}
/**
 * Queue row with ticket identity, contact details, and a compact action group.
 * Actions sit below customer details to avoid a sparse third card column.
 */
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
    <article className="flex min-h-28 w-full items-start gap-2.5 border-b border-dashed border-border px-3 py-4 last:border-b-0 md:gap-3.5 md:px-4 md:py-5">
      <button
        className={cn(
          operationalType,
          'grid size-12 -rotate-1 place-items-center rounded-sm border-0 bg-ticket text-lg font-bold text-ticket-foreground shadow-sm',
        )}
        onClick={onDetail}
        aria-label={`${q.queueNumber} ${q.customerName || t('queue.walkin')}`}
      >
        {q.queueNumber}
      </button>
      <div className="min-w-0 flex-1">
        <PartyIdentity
          name={q.customerName || t('queue.walkin')}
          phone={q.phone}
          partySize={q.partySize}
          t={t}
        />
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
          <span className="inline-flex items-center gap-1.5 text-ink-muted max-md:mt-1 max-md:block max-md:first-letter:text-transparent">
            {t('queue.estimate', {
              min: q.estimatedWaitMinutes || 15,
              max: (q.estimatedWaitMinutes || 15) + 5,
            })}
          </span>
        </p>
        <PartyMeta
          smoking={q.smoking}
          airConditioning={Boolean(q.airConditioning)}
          t={t}
        />

        <div className="mt-3 flex flex-wrap gap-2 [&>button]:min-w-24 [&>button]:flex-1">
          <Button variant="tertiary" onClick={onDetail}>
            {t('action.details')}
          </Button>

          <Button
            variant="secondary"
            onClick={onSeat}
            aria-label={`Seat ${q.queueNumber}`}
          >
            {t('queue.seat')} <ArrowUpRight />
          </Button>
        </div>
      </div>
    </article>
  );
}
/** Reservation row with arrival state and the next available service action. */
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
  const serviceState =
    r.status === 'upcoming' && soon
      ? t('booking.dueSoon')
      : t('status.' + r.status);

  return (
    <article className="flex items-center gap-3.5 border-b border-border px-2.5 py-4 last:border-b-0 md:px-4 md:py-6">
      <button
        className="min-h-12 min-w-20 border-0 bg-transparent p-0 text-left text-lg font-semibold"
        onClick={onEdit}
        aria-label={`Edit booking for ${r.customerName} at ${r.time}`}
      >
        <span
          className={cn(
            operationalType,
            'flex items-center gap-1.5 text-lg font-semibold',
          )}
        >
          {r.time}
        </span>
        <span className="mt-1 block text-base font-normal text-ink-muted">
          {r.assignedTableId || t('booking.label')} · {serviceState}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <PartyIdentity
          name={r.customerName}
          phone={r.phone}
          partySize={r.partySize}
          t={t}
        />
        <PartyMeta
          smoking={r.smoking}
          airConditioning={Boolean(r.airConditioning)}
          t={t}
        />
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

/**
 * Guest and booking form. Walk-ins use two steps; bookings add scheduling as
 * the third step so both workflows teach staff the same interaction pattern.
 */
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
      ...(!phone.trim()
        ? { phone: t('form.phoneRequired') }
        : hongKongPhoneDigits(phone).length !== 8
          ? { phone: t('form.phoneInvalid') }
          : {}),
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
      className="flex flex-col gap-3 [&_fieldset]:m-0 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_label]:text-base [&_label]:font-semibold [&_legend]:text-base [&_legend]:font-semibold [&_label>span]:font-normal [&_label>span]:text-ink-muted [&_input]:mt-2 [&_input]:min-h-12 [&_input]:bg-paper [&_input]:text-base"
      noValidate
    >
      <FormProgress steps={steps} currentStep={step} t={t} />
      <div className={step !== 1 ? 'hidden' : 'flex flex-col gap-3'}>
        <fieldset>
          <legend>{t('form.partySize')}</legend>
          <div className="mt-3 grid grid-cols-7 gap-1 md:gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Button
                type="button"
                variant="outline"
                key={n}
                aria-pressed={n === 7 ? large : !large && size === n}
                className={cn('min-h-12 p-0 text-base', selectedControl)}
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
              <FieldError id="party-size-error">{errors.size}</FieldError>
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
            <FieldError id="party-name-error">{errors.name}</FieldError>
          )}
        </label>
        <HongKongPhoneField
          id="party-phone"
          label={t('form.phone')}
          hint={t('form.phoneFormat')}
          value={phone}
          error={errors.phone}
          onChange={(value) => {
            setPhone(value);
            setErrors((current) => ({ ...current, phone: undefined }));
          }}
        />
      </div>
      <div className={step !== 2 ? 'hidden' : 'flex flex-col gap-5'}>
        <fieldset>
          <legend>{t('form.smokingQuestion')}</legend>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn('min-h-12 px-2 text-base', selectedControl)}
              aria-pressed={!smoking}
              onClick={() => setSmoking(false)}
            >
              <Ban /> {t('form.no')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn('min-h-12 px-2 text-base', selectedControl)}
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
              className={cn('min-h-12 px-2 text-base', selectedControl)}
              aria-pressed={!airConditioning}
              onClick={() => setAirConditioning(false)}
            >
              <MapPin /> {t('form.noPreference')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn('min-h-12 px-2 text-base', selectedControl)}
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
                <FieldError id="party-date-error">{errors.date}</FieldError>
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
                <FieldError id="party-time-error">{errors.time}</FieldError>
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
                      'h-auto min-h-14 flex-col gap-0.5 [&>span]:text-base [&>span]:font-medium [&>span]:text-ink-muted aria-pressed:[&>span]:text-inherit',
                      selectedControl,
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
              <FormFootnote>{t('form.noSuitableTable')}</FormFootnote>
            )}
            <p className="mt-2 text-base leading-snug text-ink-muted">
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
      <div className="sticky -bottom-5 z-2 -mx-0.5 flex items-center gap-2.5 bg-paper px-0.5 pt-2 pb-0.5 md:static [&>button]:w-0 [&>button]:flex-1">
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
            className="min-h-12 w-full text-base"
          >
            {t('action.next')} <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" className="min-h-12 w-full text-base">
            {booking
              ? initial
                ? t('form.saveBooking')
                : t('form.createBooking')
              : t('form.addQueue')}{' '}
            <ArrowUpRight />
          </Button>
        )}
      </div>
      {!booking && step === 2 && <FormFootnote>{t('form.fast')}</FormFootnote>}
    </form>
  );
}
