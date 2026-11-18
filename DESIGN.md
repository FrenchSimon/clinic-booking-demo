# Design

Approved direction: **A1 · "The treatment room"**, with Newsreader and Inter.
The clinic is green and wood inside, and patients come with pain: the interface is calm, warm and very legible, closer to the clinic itself than to a hospital or a startup.

Reference mockup: [docs/design/mockup-a1.html](docs/design/mockup-a1.html). Open it in a browser. All its styles are inline, so colors and sizes can be read straight from it.

## Fonts

Loaded with `next/font/google`.

- Headings, logos and stat numbers: **Newsreader**, weights 400 and 600, optical sizes 6 to 72. Fallback: Georgia, serif.
- Interface and body text: **Inter**, weights 400, 500 and 600. Fallback: system-ui, sans-serif.

Inter is never used alone: the serif carries the character, Inter keeps tables and forms crisp.

## Colors

| Role | Hex |
|---|---|
| Screen background | `#F7F3EB` |
| Outer background (marketing page edges) | `#E9E2D4` |
| Cards | `#FFFFFF` |
| Primary, forest green: buttons, logo, selection | `#2F5D46` |
| Text | `#1E2B24` |
| Secondary text | `#4A524C` |
| Accent, oak: small labels | `#7A5232` (text), `#9A6A43` (decorative bars only) |
| Borders | `#DDD3C2`, light dividers `#EDE6D9`, chip borders `#C9BFAD` |
| Soft green: selected tab, selected slot | `#E3EAE3` |
| Table header row | `#FBF8F2` |
| Demo bar | background `#1E2B24`, text `#F3EEE4`, muted `#C9C2B3` |

Every pair above passes WCAG AA for its text size. `#9A6A43` is too light for text and stays decorative.

## Booking statuses

Always a label, never a color alone.

| Status | Background | Text |
|---|---|---|
| Confirmed | `#E3EAE3` | `#24493A` |
| Pending payment | `#F3E6D6` | `#6B4526` |
| Cancelled, Refunded | `#ECEAE6` | `#4A4A48` |

## Shape, size and spacing

- Buttons and chips are pills (`border-radius: 999px`). Cards 14px, screens and large panels 18px.
- Touch targets at least 44px tall. Main calls to action 52px.
- Small uppercase labels: 13 to 15px, letter spacing 0.06 to 0.08em, weight 600, oak `#7A5232`.
- No shadows. Separation comes from borders and from the white cards on the warm background.
- Generous spacing: 16 to 24px inside cards, 24 to 32px between blocks.

## Navigation

- Clinic space: top bar with the Kinora logo and the clinic name, then pill tabs (Today, Agenda, Patients, Services, Outbox), the current one in soft green with `aria-current="page"`. On a phone the tabs scroll sideways.
- Demo clinics: a dark bar on top with "Demo clinic · resets in …" and the "View as Owner / Practitioner / Patient" switch, using `aria-pressed`.
- Public booking page: the clinic's name only, Kinora appears as "Booking by Kinora" in the footer. One column on a phone, steps 1 Session, 2 Physio, 3 Day and time, then a summary bar fixed at the bottom with "Continue to payment".
- Slot picking: a row of days, then a grid of times. Never a full month calendar on a phone.

## Screens in the mockup

1. **Kinora home**: hero, two calls to action ("Try the demo, no sign-up", "Read the code"), three feature columns (paid when booked, refunded on its own, reminded once).
2. **Owner dashboard**: demo bar, tabs, four stat cards, "Today's sessions" table with a header row Time · Patient · Session · Physio · Status and status pills. No AI chat here.
3. **Maison Tilleul booking page, phone**: the three steps, the summary bar, and a floating "Questions? Ask us" button above it.
4. **Maison Tilleul assistant, phone**: the chat (checklist item 18).

## Assistant (checklist item 18, patients only)

- Lives only on the clinic's public booking page.
- Header with a back button, "Ask Maison Tilleul" and "Prices, opening hours and free slots".
- A note at the top of the thread: it answers from the clinic's information only, gives no medical advice, and cannot see bookings.
- Patient messages: green bubbles on the right. Assistant messages: white bubbles on the left.
- A proposed slot shows as a card ("Wed 25 · 08:00 · Inès", "Book and pay on the booking page") that links to the prefilled booking form. The assistant never books or takes payment itself.
- The input has a visible label "Your question" and a round send button with `aria-label="Send"`.

## Formats

- Interface in English. Amounts in euros with two decimals in lists (`€45.00`), rounded in stat cards (`€6,240`).
- 24-hour times (`09:30`), short dates (`Tue 24 Nov`), time zone Europe/Brussels.

## Accessibility

- Real `<button>`, `<a href>`, `<label>` and `<input>` elements. Icon-only buttons get an `aria-label`, decorative SVGs `aria-hidden="true"`.
- Selection uses `aria-pressed`, navigation `aria-current="page"`.

## Theme variables (applied in R1.8)

The shadcn variables in `src/app/globals.css` take these values, and components only use the variables.

| Variable | Value |
|---|---|
| `--background` | `#F7F3EB` |
| `--foreground`, `--card-foreground`, `--popover-foreground` | `#1E2B24` |
| `--card`, `--popover` | `#FFFFFF` |
| `--primary` | `#2F5D46` |
| `--primary-foreground` | `#FFFFFF` |
| `--secondary`, `--accent` | `#E3EAE3` |
| `--secondary-foreground`, `--accent-foreground` | `#1E2B24` |
| `--muted` | `#FBF8F2` |
| `--muted-foreground` | `#4A524C` |
| `--border` | `#DDD3C2` |
| `--input` | `#C9BFAD` |
| `--ring` | `#2F5D46` |
| `--radius` | `14px` |

Extra variables for what shadcn does not cover: `--oak` (`#7A5232`), `--oak-decor` (`#9A6A43`), `--divider` (`#EDE6D9`), and one background and text pair per booking status.
