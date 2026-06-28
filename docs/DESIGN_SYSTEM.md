# StockPilot Counter AI — Design System ("Palengke Daylight")

This is the single source of truth for the frontend retheme. Every screen must use
these tokens and primitive classes. Do NOT invent new colors, fonts, radii, or
shadows. If something is missing, use the closest primitive rather than ad-hoc utilities.

Stack: React 19 + Vite + Tailwind 3.4. Tokens live in `tailwind.config.js`.
Reusable primitives live in `index.css` under `@layer components`.

## Product
StockPilot Counter AI: tablet-first, offline-capable AI counter system for serious
small Philippine retailers. Organized around **benta (sales), stock, utang (credit),
at kita (profit)**. Taglish operational vocabulary is part of the brand, not decoration.

## Theme polarity
Light, warm-paper work surface ("paper") with a dark-ink left navigation rail ("ink").
Cards are white. Money is the hero, rendered in tabular display type.

## Color tokens (Tailwind names → hex)
- paper          #F6F5EF   app background
- surface        #FFFFFF   cards
- sunken         #EFEEE6   inset wells, table header strips
- line           #E3E1D6   default borders
- line-strong    #CFCDBF   emphasized borders / dividers
- ink            #0E1A16   primary text, rail background
- ink-soft       #16261F   rail elevated surfaces
- muted          #6B7268   secondary text
- faint          #9AA096   tertiary text / placeholders
- peso           #0B6E50   brand jade — primary actions, sales money
- peso-deep      #095B41   hover/pressed
- peso-tint      #E7F2EC   peso-tinted backgrounds
- gcash          #1C5FD6   GCash ONLY
- gcash-tint     #E7EEFB
- utang          #B26A00   credit / owed
- utang-tint     #FBF0DA
- danger         #C0392B   destructive / over-short / errors
- danger-tint    #FBE9E7
- rail-text      #C8D2CC   rail nav label text
- rail-muted     #7C8B82   rail secondary text
- rail-active    #1C8C66   rail active accent

## Typography
- Display: 'Space Grotesk' → `font-display`. Headings, page titles, money readouts, totals.
- Body/UI: 'Inter' → `font-sans` (default). Everything else.
- Money/numbers: add `tabular-nums` (utility maps to font-variant-numeric: tabular-nums).
- Type scale (rough): page title text-2xl/3xl font-display font-bold; section title
  text-lg font-display font-semibold; body text-sm/text-base; captions text-xs.
- Eyebrows: use `.eyebrow` (uppercase, tracked, muted) for Taglish section labels.

## Radius / shadow / spacing
- Radius: controls rounded-xl (12px), cards rounded-2xl (16px), pills rounded-full.
- Shadow: `shadow-card` (resting cards), `shadow-pop` (modals/menus). No heavy glows.
- Touch: interactive elements min-h-11 (44px); primary counter actions min-h-12/14.
- Section gap rhythm: page padding p-4 lg:p-6; card padding p-4 lg:p-5; gap-4 between cards.

## Primitive classes (defined in index.css @layer components) — PREFER THESE
- `.card`               white surface, line border, rounded-2xl, shadow-card
- `.card-sunken`        sunken inset well
- `.eyebrow`            Taglish section label (uppercase tracked muted)
- `.field`             text input / select / textarea base (light, line border, focus ring peso)
- `.btn`                base button (inline-flex, center, font-semibold, rounded-xl, min-h-11, focus ring)
  variants (compose with .btn):
  - `.btn-primary`      peso fill, white text  (Cash / confirm / save)
  - `.btn-gcash`        gcash fill, white text  (GCash only)
  - `.btn-utang`        utang fill, white text  (Utang / credit)
  - `.btn-ghost`        transparent, line border, ink text  (secondary)
  - `.btn-danger`       danger text/border, tint on hover (destructive)
  - `.btn-lg`           taller (min-h-14) for primary counter actions
- `.pill`               status chip base; modifiers `.pill-ok` `.pill-warn` `.pill-bad` `.pill-muted`
- `.money`              tabular display number (font-display tabular-nums tracking-tight)
- `.stat`               owner-panel stat card (label / big money / sub-detail)
- `.rail-link`          dark-rail nav item; `.is-active` for current page
- `.data-table`         table base (used by inventory/orders): header sunken, row hover, line dividers

## Voice / copy rules
- Sentence case. Active verbs. Action keeps its name through the flow (Cash → "Cash sale recorded").
- Taglish where it's the counter's real word: Benta, Bayad, Utang, Suki, Kita, Resibo, Paubos.
- Errors are specific and tell the fix; empty states invite the next action.
- Offline is a first-class, calm state ("Offline — saving locally"), never an error.

## Money color semantics
- Sales / cash-in / positive kita: peso (jade).
- GCash figures: gcash blue.
- Utang / amounts owed: utang amber.
- Shortfalls / negative differences / errors: danger.
- Neutral counts and totals: ink.

## Accessibility / production floor
- Visible `focus-visible` ring (peso) on all interactive elements.
- `prefers-reduced-motion`: disable non-essential transitions/animations.
- Min 44px touch targets; no hover-only affordances (also provide visible state).
- Color is never the only signal (pair with label/icon).

## What NOT to do
- No sky-blue legacy theme. No emerald-500 bright neon. No pure-black backgrounds.
- No generic AI-default cream (#F4F1EA) + terracotta. Our paper is cooler/greener (#F6F5EF) with jade.
- No marketing landing inside the authed app. No numbered 01/02/03 unless it's a real sequence.
