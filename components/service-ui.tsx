'use client';
import { useState, type ReactNode, type SubmitEvent } from 'react';
import {
  Check,
  Clock3,
  Users,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
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
  statusText,
  type RestaurantTable,
  type QueueEntry,
  type Reservation,
  SERVICE_DATE,
} from '@/lib/restaurant';
export const minutes = (since: number, now: number) =>
  Math.max(0, Math.floor((now - since) / 60000));
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
  table: t,
  now,
  reservation,
  onClick,
}: {
  table: RestaurantTable;
  now: number;
  reservation?: Reservation;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`table-card ${t.status}`}
      aria-label={`${t.name}, ${t.capacity} seats, ${statusText[t.status]}`}
    >
      <span className="table-top">
        <b>{t.name}</b>
        {t.status === 'available' ? (
          <Check size={16} />
        ) : t.status === 'cleaning' ? (
          <Sparkles size={16} />
        ) : t.status === 'reserved' ? (
          <CalendarDays size={16} />
        ) : (
          <Clock3 size={16} />
        )}
      </span>
      <span className="capacity">
        <Users size={13} />
        {t.capacity} seats
      </span>
      <span className="table-status">
        {statusText[t.status]}
        {t.seatedAt
          ? ' · ' + minutes(t.seatedAt, now) + 'm'
          : t.status === 'reserved' && reservation
            ? ' · ' + reservation.time
            : ''}
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
}: {
  party: QueueEntry;
  now: number;
  onSeat: () => void;
  onDetail: () => void;
  fits: boolean;
}) {
  return (
    <article className="queue-card">
      <button
        className="ticket"
        onClick={onDetail}
        aria-label={`Details for ${q.queueNumber}`}
      >
        {q.queueNumber}
      </button>
      <div className="party-info">
        <h3>
          {q.customerName || 'Walk-in'} <span>· {q.partySize} people</span>
        </h3>
        <p>
          Waiting {minutes(q.joinedAt, now)} min{' '}
          <span className="estimate">
            · Est. {q.estimatedWaitMinutes || 15}–
            {(q.estimatedWaitMinutes || 15) + 5} min
          </span>
        </p>
        {fits && <span className="fit-note">A table fits</span>}
      </div>
      <Button
        variant="outline"
        onClick={onSeat}
        aria-label={`Seat ${q.queueNumber}`}
      >
        Seat <ArrowUpRight />
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
}: {
  reservation: Reservation;
  soon: boolean;
  onArrive: () => void;
  onSeat: () => void;
  onEdit: () => void;
}) {
  return (
    <article className={`reservation-card ${soon ? 'soon' : ''}`}>
      <button
        className="booking-time"
        onClick={onEdit}
        aria-label={`Edit booking for ${r.customerName} at ${r.time}`}
      >
        {r.time}
        <span>{r.assignedTableId || 'Booking'}</span>
      </button>
      <div className="party-info">
        <h3>
          {r.customerName} <span>· {r.partySize} people</span>
        </h3>
        <p className={`reservation-status ${r.status}`}>
          {r.status === 'upcoming'
            ? soon
              ? 'Due soon'
              : 'Upcoming'
            : r.status === 'no-show'
              ? 'No-show'
              : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
        </p>
      </div>
      {r.status === 'upcoming' ? (
        <Button
          variant="outline"
          onClick={onArrive}
          aria-label={`Mark ${r.customerName} arrived`}
        >
          Arrived
        </Button>
      ) : r.status === 'arrived' ? (
        <Button
          onClick={onSeat}
          aria-label={`Seat reservation ${r.customerName}`}
        >
          Seat <ArrowUpRight />
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
}
export function PartyForm({
  booking = false,
  initial,
  onSubmit,
}: {
  booking?: boolean;
  initial?: Reservation;
  onSubmit: (data: PartyInput) => void;
}) {
  const [error, setError] = useState('');
  const [size, setSize] = useState(initial?.partySize || 2);
  const [large, setLarge] = useState((initial?.partySize || 2) >= 7);
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = (key: string, fallback = '') => {
      const v = f.get(key);
      return typeof v === 'string' ? v.trim() : fallback;
    };
    if (booking && !value('name')) {
      setError('Please enter a name for the booking.');
      return;
    }
    onSubmit({
      customerName: value('name'),
      phone: value('phone'),
      partySize: large ? Number(f.get('size')) : size,
      date: value('date', SERVICE_DATE),
      time: value('time', '19:30'),
      notes: value('notes'),
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
        <legend>How many people?</legend>
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
          Exact party size
          <Input
            id="party-size"
            name="size"
            aria-label="Exact party size"
            type="number"
            min="7"
            max="30"
            defaultValue={Math.max(7, size)}
            required
          />
        </label>
      )}
      <label htmlFor="party-name">
        Name <span>{booking ? '' : '(optional)'}</span>
        <Input
          id="party-name"
          name="name"
          placeholder={booking ? 'Name for the booking' : 'e.g. Chan'}
          defaultValue={initial?.customerName}
          maxLength={60}
          required={booking}
        />
      </label>
      <label htmlFor="party-phone">
        Phone <span>(optional)</span>
        <Input
          id="party-phone"
          name="phone"
          type="tel"
          placeholder="e.g. 9123 4567"
          defaultValue={initial?.phone}
          maxLength={24}
        />
      </label>
      {booking && (
        <>
          <div className="form-row">
            <label htmlFor="party-date">
              Date
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
              Time
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
            Notes <span>(optional)</span>
            <Input
              id="party-notes"
              name="notes"
              placeholder="High chair, table preference…"
              defaultValue={initial?.notes}
              maxLength={160}
            />
          </label>
        </>
      )}
      <Button type="submit" className="wide">
        {booking
          ? initial
            ? 'Save booking'
            : 'Create booking'
          : 'Add to queue'}{' '}
        <ArrowUpRight />
      </Button>
      {!booking && (
        <p className="form-footnote">
          Just the party size is enough. We’ll take care of the number.
        </p>
      )}
    </form>
  );
}
