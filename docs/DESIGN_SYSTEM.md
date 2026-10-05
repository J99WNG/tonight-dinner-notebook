# Interface system

This note explains the small set of rules that keeps the prototype consistent. Tailwind theme tokens in `app/globals.css` and colocated component classes are the source of truth.

## Foundations

- Brand and status colors are OKLCH custom properties exposed as Tailwind theme colors in `app/globals.css`.
- Orange is the action color. Red is reserved for the logo and destructive or attention states.
- Status surfaces use low chroma and high lightness to reduce visual noise. Each status also has a text label and icon, so meaning never depends on color alone.
- Interface text does not go below Tailwind's `text-base` (`1rem`, or 16px at the default browser size). Shared buttons, dialogs, and inputs use the same utility so component variants cannot bypass that floor.
- Time, dates, durations, queue identifiers, and other compact operational values use the shared `font-mono`, `tabular-nums`, and tracking utilities. The theme font pairs the platform mono face for Latin glyphs with locale-appropriate CJK fallbacks for English, Traditional Chinese, and Simplified Chinese.
- Interactive targets are at least 44px high and use the same visible keyboard focus ring.
- Queue numbers use a soft pink paper token to match the handwritten tickets guests receive in the restaurant. The number remains dark enough to meet text contrast requirements.

## Button hierarchy

The shared `Button` component exposes five product tiers. The hierarchy is about task importance, not component size; all tiers keep the same touch-target and focus behavior.

| Tier       | Treatment                      | Use                                                                                     |
| ---------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| Primary    | Solid brand orange             | One main completion action in a region, such as Add booking or Seat                     |
| Secondary  | Soft orange tint               | Repeated row actions, such as Arrived, where many actions appear together               |
| Tertiary   | Neutral filled surface         | Supporting actions that should remain visible without competing with the primary action |
| Quaternary | Brand-colored text on the page | Navigation and low-emphasis actions, such as All bookings or Back                       |
| Quinary    | Muted text on the page         | Utilities with the lowest emphasis, such as dismiss or reset helpers                    |

Borders are reserved for controls whose boundary communicates state, such as selected options, table status cards, and dividers. They are not the default button treatment.

## Section heading

`SectionHeading` keeps operational sections predictable across Tonight, Bookings, and Tables.

| Property    | Requirement | Purpose                                                    |
| ----------- | ----------- | ---------------------------------------------------------- |
| `heading`   | Required    | The section’s `h2` label                                   |
| `context`   | Required    | Count, status text, or a pill counter                      |
| `action`    | Optional    | The section’s primary action                               |
| `switcher`  | Optional    | A fieldset-based segmented control for changing the view   |
| `className` | Optional    | Layout adjustment without changing the component hierarchy |

## Component boundaries

- `app/page.tsx` coordinates application state and user actions.
- `components/service-ui.tsx` owns reusable operational cards, sheets, and forms.
- `components/booking-calendar.tsx` owns the seven-day calendar controls only.
- `components/table-overview.tsx` owns table grouping and filtering only.
- `components/section-heading.tsx` standardizes section hierarchy. Every instance requires a heading and contextual value; a primary action and fieldset switch are optional slots.
- `lib/restaurant.ts` owns restaurant data and service transitions; UI components do not mutate records themselves.
- `lib/dates.ts` owns date parsing and localized display, keeping timezone work out of components.
- Calendar “Today” is calculated in the Hong Kong timezone so the shortcut is correct even when the device is elsewhere.

## Responsive and multilingual behavior

- The Tonight table grid uses two columns so English, Traditional Chinese, and Simplified Chinese labels can wrap without clipping.
- The full Tables view uses three columns on wider screens and two on mobile.
- The compact single-column layout activates at 760px and below; wider viewports retain the dashboard composition.
- Global page padding is owned by `main`; Tonight, Bookings, and Tables all fill that same content width instead of introducing page-specific maximum widths.
- On Tonight, Tables spans the full dashboard row. Coming bookings and the waiting queue form the two-column row beneath it.
- Text rows use `min-width: 0`, normal white-space, and overflow wrapping where user or translated content can grow.
- The seven-day selector scrolls horizontally on narrow screens instead of shrinking dates below a readable size.
- The calendar sits directly on the page rather than inside another bordered surface. Borders are reserved for dividers, controls that need an edge, and table status states.
- Booking forms use three short steps (guest, preferences, then date and table) with a persistent progress indicator and action row. This avoids hiding the final action below a long scrolling form.
- Walk-in forms reuse the first two steps so staff learn one form pattern. The native progress value, live step announcement, and evenly distributed labels expose the current position visually and to assistive technology.

## Operational surfaces

- Data-dense sections use a colocated Tailwind surface treatment: paper background, 14px radius, no elevation shadow, and no decorative outer border.
- Row dividers remain because they clarify list relationships. Table status borders remain because they communicate state.
- Queue tickets intentionally use a borderless pink paper treatment. Their shape, color, number, and subtle paper shadow provide the real-world cue without adding another container edge.
- Booking calendar selection uses the same white operational surface as its corresponding booking list, with a brand-colored inset marker for selected state.
- Table-status filters reuse the associated semantic status surface and show a live count badge. Their selected state adds an inset boundary without replacing the status color.

## Form validation

- Required or constrained inputs set `aria-invalid` and reference their own inline error through `aria-describedby`.
- Errors sit directly beneath the affected input and clear when the user edits that field.
- Optional inputs do not show a validation state unless they contain invalid data.

## Accessibility guardrails

- Status color is supplemental to a written status and icon.
- Selected calendar days, filters, and grouping controls expose `aria-pressed`.
- Icon-only week controls have localized accessible names.
- Motion is disabled when the device requests reduced motion.
- Automated checks cover types, linting, and production compilation. Visual, keyboard, and assistive-technology QA remain manual checks before release.
