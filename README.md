# Tonight · 新志興

A mobile-first dinner notebook for 新志興至尊燒鵝大王, 60A Lung Chi Path, Ngau Chi Wan. Portfolio prototype with eight tables, five waiting parties and three reservations.

## Run

Node 22.13+ and npm are required.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

The generated React/TypeScript Sites starter uses Vinext on Vite and Tailwind CSS. The build exports static files to `dist/client`; no application server, accounts, API, or database is required. The three destinations are local views within one page.

## Branch workflow

- `main` is the production-ready branch. Changes arrive through reviewed pull requests from `develop`.
- `develop` is the integration branch for the next release.
- Short-lived `feature/*`, `fix/*`, and `chore/*` branches start from `develop` and return to it through pull requests.
- CI must pass type checking, linting, and the production build before merge.
- Sites production deployment remains an explicit release step after `develop` is promoted to `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and commit conventions.

## Source map

- `app/page.tsx`: Tonight, Bookings, Tables, and action orchestration.
- `components/service-ui.tsx`: table, queue, and reservation cards; accessible bottom sheet; shared party form.
- `components/ui/`: only the three used scaffold primitives: Button, Dialog and Input.
- `lib/restaurant.ts`: TypeScript models, realistic seed data, table suitability and atomic seating transition.
- `lib/storage.ts`: isolated localStorage adapter with version checks and fallback.
- `lib/i18n.ts`: English, Traditional Chinese and Simplified Chinese interface copy.
- `app/globals.css`: visual tokens, mobile layout, responsive desktop layout and reduced-motion support.

## Product decisions

- Default party size is two. A surname is optional for walk-ins; a phone number is required for every party. The 7+ button asks for an exact size; tables cannot be overfilled.
- Every table is marked indoor or outdoor. Smoking parties see suitable outdoor tables first; non-smoking parties see indoor tables first. This is a preference, so the manager can still use any suitable available table.
- Available tables are then ordered by smallest fit. A reservation’s held table comes first and cannot be used for an unrelated party.
- A queue entry becomes seated only after an explicit table selection. The seating transition updates both records together.
- Finishing goes to Cleaning. Mark ready is a separate manager action.
- Undo restores the previous service state for eight seconds after an action. Reset lives in Tables and restores the busy-night seed.
- Local storage is device/browser specific. Changes are not synced between tabs or devices. Unavailable storage leaves the app usable with a visible notice.
- This reproducible demo starts at 19:15 on 3 September 2026; elapsed minutes advance with real time, including time while the page is closed. Reset starts a fresh service. Estimates are illustrative ranges, not a prediction engine.
- The EN / 繁 / 简 switch changes the operational interface and saves the device’s language choice locally. Layouts support wrapping and Unicode names.
- An optional feature-detected `start_walk_in` WebMCP tool opens the same form; it never silently adds customers.

## Walkthrough

1. **Add:** Tonight → Walk-in → 4 → Chan → Add to queue. A17 appears.
2. **Seat:** Seat A12 → T3. A12 leaves Waiting; T3 is occupied.
3. **Turn over:** T5 → Finish table → T5 → Mark ready.
4. **Reservation:** Wong → Arrived → Seat → T4. Bookings records Wong as seated.
5. **No fit:** add nine people using 7+, then Seat. The party remains waiting with a clear no-table explanation.
6. **Refresh:** changes remain in the same browser. Tables → Reset demo data restores the original scenario.

## Intentionally out of scope

No authentication, backend, messaging, payments, POS, analytics, table combining or floor-plan editor. All people and phone numbers are illustrative. Upcoming bookings can be created and edited; table capacities are fixed for this prototype.

Next iteration: observe a manager using the four journeys during a simulated rush, then refine Cantonese/Mandarin service vocabulary and wait-estimate editing from that feedback.
