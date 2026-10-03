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
          <Check size={16} />
        ) : table.status === 'cleaning' ? (
          <Sparkles size={16} />
        ) : table.status === 'reserved' ? (
          <CalendarDays size={16} />
        ) : (
          <Clock3 size={16} />
        )}
      </span>
      <span className="capacity">
        <Users size={13} />
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
  fits,
  t,
}: {
  party: QueueEntry;
  now: number;
  onSeat: () => void;
  onDetail: () => void;
  fits: boolean;
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
        <h3>
          {q.customerName || t('queue.walkin')}{' '}
          <span>· {t('party.people', { count: q.partySize })}</span>
        </h3>
        <p>
          {t('queue.waiting', { count: minutes(q.joinedAt, now) })}{' '}
          <span className="estimate">
            ·{' '}
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
          <span>
            <Phone /> {q.phone}
          </span>
        </span>
        {fits && <span className="fit-note">{t('queue.fit')}</span>}
      </div>
      <Button
        variant="outline"
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
          <Clock3 aria-hidden="true" /> {r.time}
        </span>
        <span>{r.assignedTableId || t('booking.label')}</span>
      </button>
      <div className="party-info">
        <h3>
          {r.customerName}{' '}
          <span>· {t('party.people', { count: r.partySize })}</span>
        </h3>
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
          <span>
            <Phone /> {r.phone}
          </span>
        </span>
      </div>
      {r.status === 'upcoming' ? (
        <Button
          variant="outline"
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
        <Check size={18} />
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
}
export function PartyForm({
  booking = false,
  initial,
  onSubmit,
  t,
}: {
  booking?: boolean;
  initial?: Reservation;
  onSubmit: (data: PartyInput) => void;
  t: Translate;
}) {
  const [error, setError] = useState('');
  const [size, setSize] = useState(initial?.partySize || 2);
  const [smoking, setSmoking] = useState(initial?.smoking ?? false);
  const [large, setLarge] = useState((initial?.partySize || 2) >= 7);
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = (key: string, fallback = '') => {
      const v = f.get(key);
      return typeof v === 'string' ? v.trim() : fallback;
    };
    if (!value('phone') || (booking && !value('name'))) {
      setError(t('form.required'));
      return;
    }
    onSubmit({
      customerName: value('name'),
      phone: value('phone'),
      partySize: large ? Number(f.get('size')) : size,
      date: value('date', SERVICE_DATE),
      time: value('time', '19:30'),
      notes: value('notes'),
      smoking,
    });
  }
  return (
    <form onSubmit={submit} className="party-form">
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
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
            defaultValue={Math.max(7, size)}
            required
          />
        </label>
      )}
      <label htmlFor="party-name">
        {t('form.name')}
        <Input
          id="party-name"
          name="name"
          placeholder={t('form.nameHint')}
          defaultValue={initial?.customerName}
          maxLength={60}
          required={booking}
        />
      </label>
      <label htmlFor="party-phone">
        {t('form.phone')}
        <Input
          id="party-phone"
          name="phone"
          type="tel"
          placeholder={t('form.phoneHint')}
          defaultValue={initial?.phone}
          maxLength={24}
          required
        />
      </label>
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
            onClick={() => setSmoking(true)}
          >
            <Cigarette /> {t('form.yes')}
          </Button>
        </div>
      </fieldset>
      {booking && (
        <>
          <div className="form-row">
            <label htmlFor="party-date">
              {t('form.date')}
              <Input
                id="party-date"
                name="date"
                type="date"
                defaultValue={initial?.date || SERVICE_DATE}
                min={SERVICE_DATE}
                required
              />
            </label>
            <label htmlFor="party-time">
              {t('form.time')}
              <Input
                id="party-time"
                name="time"
                type="time"
                defaultValue={initial?.time || '19:30'}
                required
              />
            </label>
          </div>
          <label htmlFor="party-notes">
            {t('form.notes')} <span>{t('form.optional')}</span>
            <Input
              id="party-notes"
              name="notes"
              placeholder={t('form.notesHint')}
              defaultValue={initial?.notes}
              maxLength={160}
            />
          </label>
        </>
      )}
      <Button type="submit" className="wide">
        {booking
          ? initial
            ? t('form.saveBooking')
            : t('form.createBooking')
          : t('form.addQueue')}{' '}
        <ArrowUpRight />
      </Button>
      {!booking && <p className="form-footnote">{t('form.fast')}</p>}
    </form>
  );
}
