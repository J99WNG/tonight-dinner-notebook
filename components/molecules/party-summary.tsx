import { Ban, Cigarette, Phone, Snowflake } from 'lucide-react';

import type { Translate } from '@/lib/i18n';

/**
 * Molecular guest identity row for queue and reservation cards. Keeping the
 * contact action adjacent to the name supports fast scan-and-call workflows.
 */
export function PartyIdentity({
  name,
  phone,
  partySize,
  t,
}: {
  name: string;
  phone: string;
  partySize: number;
  t: Translate;
}) {
  return (
    <div className="flex min-w-0 items-start justify-start gap-x-4 gap-y-2.5">
      <h3 className="min-w-0 text-lg leading-snug font-semibold [overflow-wrap:anywhere]">
        {name}{' '}
        <span className="text-base font-normal text-ink-muted">
          · {t('party.people', { count: partySize })}
        </span>
      </h3>

      <a
        className="-mt-2 inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-ink-muted no-underline [&>svg]:size-5 [&>svg]:text-brand-orange-700"
        href={`tel:${phone.replace(/\s/g, '')}`}
        aria-label={t('detail.phone', { phone })}
      >
        <Phone aria-hidden="true" />
        {phone}
      </a>
    </div>
  );
}

/** Molecular preference summary shared by queue and reservation cards. */
export function PartyMeta({
  smoking,
  airConditioning,
  t,
}: {
  smoking: boolean;
  airConditioning: boolean;
  t: Translate;
}) {
  return (
    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-base text-ink-muted max-md:gap-x-2.5 max-md:gap-y-1 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5 [&_svg]:size-5 [&_svg]:text-brand-orange-700">
      <span>
        {smoking ? <Cigarette /> : <Ban />}
        {t(smoking ? 'party.smoking' : 'party.nonSmoking')}
      </span>

      {airConditioning && (
        <span>
          <Snowflake />
          {t('party.airConditioned')}
        </span>
      )}
    </span>
  );
}
