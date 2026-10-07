import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/molecules/form-progress';
import { cn } from '@/lib/utils';

/** Keep only the eight national digits, including when a pasted value has +852. */
export function hongKongPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  const nationalNumber =
    digits.length > 8 && digits.startsWith('852') ? digits.slice(3) : digits;

  return nationalNumber.slice(0, 8);
}

/** Format an HK number as the familiar four-plus-four grouping. */
export function formatHongKongPhone(value: string) {
  const digits = hongKongPhoneDigits(value);

  return digits.length > 4
    ? `${digits.slice(0, 4)} ${digits.slice(4)}`
    : digits;
}

/**
 * A single, autofill-friendly Hong Kong phone field. The fixed country code
 * and 4 + 4 grouping provide a visual template without fragmenting keyboard,
 * paste, or screen-reader interaction across multiple inputs.
 */
export function HongKongPhoneField({
  id,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id}>{label}</label>
        <span id={hintId} className="text-base text-ink-muted">
          {hint}
        </span>
      </div>

      <div
        className={cn(
          'mt-2 flex min-h-12 overflow-hidden rounded-lg border border-input bg-paper transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          error && 'border-destructive ring-3 ring-destructive/20',
        )}
      >
        <span
          className="inline-flex items-center border-r border-input bg-muted px-3 font-mono text-base font-semibold text-foreground"
          aria-hidden="true"
        >
          +852
        </span>

        <Input
          id={id}
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          enterKeyHint="next"
          placeholder="9123 4567"
          value={formatHongKongPhone(value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}
          className="mt-0! min-h-11! rounded-none border-0! bg-transparent! font-mono tracking-wide ring-0! focus-visible:ring-0! aria-invalid:ring-0!"
          onChange={(event) =>
            onChange(formatHongKongPhone(event.target.value))
          }
          maxLength={9}
          pattern="[0-9]{4} [0-9]{4}"
          required
        />
      </div>

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
