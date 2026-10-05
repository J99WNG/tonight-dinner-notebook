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
      <DialogContent className="action-sheet">
        <DialogTitle className="sheet-title">{title}</DialogTitle>
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
}: {
  table: RestaurantTable;
  now: number;
  reservation?: Reservation;
  onClick: () => void;
  t: Translate;
}) {
  return (
    <button
      onClick={onClick}
      className={`table-card ${table.status}`}
      aria-label={`${table.name}, ${t('party.people', { count: table.capacity })}, ${t('status.' + table.status)}`}
    >
      <span className="table-top">
        <b>{table.name}</b>
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
      <span className="capacity">
        <Users size={18} />
        {table.capacity} · {t('area.' + table.area)}
      </span>
      <span className="table-status">
        <span>{t('status.' + table.status)}</span>
        {table.seatedAt ? (
          <span className="status-time">
            <Timer aria-hidden="true" /> {duration(table.seatedAt, now)}
          </span>
        ) : table.status === 'reserved' && reservation ? (
          <span className="status-time">
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
    <article className="queue-card">
      <button
        className="ticket"
        onClick={onDetail}
        aria-label={`${q.queueNumber} ${q.customerName || t('queue.walkin')}`}
      >
        {q.queueNumber}
      </button>
      <div className="party-info">
        <div className="party-heading">
          <h3>
            {q.customerName || t('queue.walkin')}{' '}
            <span>· {t('party.people', { count: q.partySize })}</span>
          </h3>
          <a
            className="party-phone"
            href={`tel:${q.phone.replace(/\s/g, '')}`}
            aria-label={t('detail.phone', { phone: q.phone })}
          >
            <Phone aria-hidden="true" /> {q.phone}
          </a>
        </div>
        <p className="wait-details">
          <span>
            <Clock3 aria-hidden="true" />
            {t('queue.waiting', { count: minutes(q.joinedAt, now) })}
          </span>
          <span className="estimate">
            {t('queue.estimate', {
              min: q.estimatedWaitMinutes || 15,
              max: (q.estimatedWaitMinutes || 15) + 5,
            })}
          </span>
        </p>
        <span className="party-meta">
          <span>
            {q.smoking ? <Cigarette /> : <Ban />}
            {t(q.smoking ? 'party.smoking' : 'party.nonSmoking')}
          </span>
          {q.airConditioning && (
            <span>
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
    <article className={`reservation-card ${soon ? 'soon' : ''}`}>
      <button
        className="booking-time"
        onClick={onEdit}
        aria-label={`Edit booking for ${r.customerName} at ${r.time}`}
      >
        <span className="booking-clock">
          {r.time}
        </span>
        <span>{r.assignedTableId || t('booking.label')}</span>
      </button>
      <div className="party-info">
        <div className="party-heading">
          <h3>
            {r.customerName}{' '}
            <span>· {t('party.people', { count: r.partySize })}</span>
          </h3>
          <a
            className="party-phone"
            href={`tel:${r.phone.replace(/\s/g, '')}`}
            aria-label={t('detail.phone', { phone: r.phone })}
          >
            <Phone aria-hidden="true" /> {r.phone}
          </a>
        </div>
        <p className={`reservation-status ${r.status}`}>
          {r.status === 'upcoming' && soon
            ? t('booking.dueSoon')
            : t('status.' + r.status)}
        </p>
        <span className="party-meta">
          <span>
            {r.smoking ? <Cigarette /> : <Ban />}
            {t(r.smoking ? 'party.smoking' : 'party.nonSmoking')}
          </span>
          {r.airConditioning && (
            <span>
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
    <form onSubmit={submit} className="party-form" noValidate>
      <div className="form-progress" aria-label={t('form.progress')}>
        <p id="form-progress-status" aria-live="polite">
          {t('form.step', { current: step, total: steps.length })}
        </p>
        <progress
          value={step}
          max={steps.length}
          aria-labelledby="form-progress-status"
        />
        <ol>
          {steps.map((label, index) => {
            const number = index + 1;
            return (
              <li
                key={label}
                className={number < step ? 'complete' : ''}
                aria-current={number === step ? 'step' : undefined}
              >
                <span>{number}</span>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
      <div className={step !== 1 ? 'form-step-hidden' : 'form-step'}>
        <fieldset>
          <legend>{t('form.partySize')}</legend>
          <div className="size-options">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Button
                type="button"
                variant="outline"
                key={n}
                aria-pressed={n === 7 ? large : !large && size === n}
                className={
                  (n === 7 ? large : !large && size === n) ? 'selected' : ''
                }
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
              <span id="party-size-error" className="field-error" role="alert">
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
            <span id="party-name-error" className="field-error" role="alert">
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
            <span id="party-phone-error" className="field-error" role="alert">
              {errors.phone}
            </span>
          )}
        </label>
      </div>
      <div className={step !== 2 ? 'form-step-hidden' : 'form-step'}>
        <fieldset>
          <legend>{t('form.smokingQuestion')}</legend>
          <div className="smoking-options">
            <Button
              type="button"
              variant="outline"
              className={!smoking ? 'selected' : ''}
              aria-pressed={!smoking}
              onClick={() => setSmoking(false)}
            >
              <Ban /> {t('form.no')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={smoking ? 'selected' : ''}
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
          <div className="preference-options">
            <Button
              type="button"
              variant="outline"
              className={!airConditioning ? 'selected' : ''}
              aria-pressed={!airConditioning}
              onClick={() => setAirConditioning(false)}
            >
              <MapPin /> {t('form.noPreference')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={airConditioning ? 'selected' : ''}
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
        <div className={step !== 3 ? 'form-step-hidden' : 'form-step'}>
          <div className="form-row">
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
                  className="field-error"
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
                  className="field-error"
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
              <div className="assignment-options">
                {eligibleTables.map((table) => (
                  <Button
                    key={table.id}
                    type="button"
                    variant="outline"
                    className={assignedTableId === table.id ? 'selected' : ''}
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
              <p className="form-footnote">{t('form.noSuitableTable')}</p>
            )}
            <p className="assignment-help">{t('form.assignTableHelp')}</p>
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
      <div className="form-actions">
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
          <Button type="button" onClick={continueFlow} className="wide">
            {t('action.next')} <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" className="wide">
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
        <p className="form-footnote">{t('form.fast')}</p>
      )}
    </form>
  );
}
