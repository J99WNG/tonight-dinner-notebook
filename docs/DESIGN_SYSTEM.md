# Interface system

This note explains the small set of rules that keeps the prototype consistent. The CSS remains the source of truth.

## Foundations

- Brand and status colors are OKLCH custom properties in `app/globals.css`.
- Orange is the action color. Red is reserved for the logo and destructive or attention states.
- Status surfaces use low chroma and high lightness to reduce visual noise. Each status also has a text label and icon, so meaning never depends on color alone.
- Interface text does not go below `--type-min` (`0.875rem`, or 14px at the default browser size).
- Interactive targets are at least 44px high and use the same visible keyboard focus ring.

## Component boundaries

- `app/page.tsx` coordinates application state and user actions.
- `components/service-ui.tsx` owns reusable operational cards, sheets, and forms.
- `components/booking-calendar.tsx` owns the seven-day calendar controls only.
- `components/table-overview.tsx` owns table grouping and filtering only.
- `lib/restaurant.ts` owns restaurant data and service transitions; UI components do not mutate records themselves.
- `lib/dates.ts` owns date parsing and localized display, keeping timezone work out of components.

## Responsive and multilingual behavior

- The Tonight table grid uses two columns so English, Traditional Chinese, and Simplified Chinese labels can wrap without clipping.
- The full Tables view uses three columns on wider screens and two on mobile.
- Text rows use `min-width: 0`, normal white-space, and overflow wrapping where user or translated content can grow.
- The seven-day selector scrolls horizontally on narrow screens instead of shrinking dates below a readable size.

## Accessibility guardrails

- Status color is supplemental to a written status and icon.
- Selected calendar days, filters, and grouping controls expose `aria-pressed`.
- Icon-only week controls have localized accessible names.
- Motion is disabled when the device requests reduced motion.
- Automated checks cover types, linting, and production compilation. Visual, keyboard, and assistive-technology QA remain manual checks before release.
