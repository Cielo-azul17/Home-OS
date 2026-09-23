hy # HomeOS — Design System V1
hy # HomeOS — Design System V1

> **Warm editorial minimalism with quiet intelligence.**
>
> HomeOS is a premium home-management product, not a smart-home control panel. The interface should feel like a beautifully organized digital home: calm, warm, minimal, precise, and human. Use warm neutral surfaces, restrained natural accents, generous whitespace, refined typography, subtle borders, soft elevation, and rich home/asset imagery. AI should feel integrated and helpful—not futuristic, neon, or visually loud.

**Theme:** light

## Design Principles

1. **Calm first** — reduce visual noise and let the information breathe.
2. **Home, not enterprise SaaS** — use warmth, imagery, and human language.
3. **Information has hierarchy** — overview first, details on demand.
4. **AI stays quiet** — AI assists with identification and organization; it should not dominate the interface.
5. **Physical things feel tangible** — asset imagery, room context, warranty and maintenance status should feel connected.
6. **One strong accent** — use sage sparingly; functional states have their own restrained semantic colors.

## Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Eggshell | `#F8F7F3` | `--color-eggshell` | Page canvas |
| White Surface | `#FFFFFF` | `--color-surface` | Cards, inputs, modals |
| Warm Stone | `#F0EEE9` | `--color-stone` | Secondary surfaces |
| Soft Stone | `#E3E0D9` | `--color-soft-stone` | Borders and dividers |
| Charcoal | `#242421` | `--color-charcoal` | Primary text and actions |
| Graphite | `#4E4D48` | `--color-graphite` | Secondary headings |
| Smoke | `#716F68` | `--color-smoke` | Body text and metadata |
| Ash | `#A19E96` | `--color-ash` | Tertiary/helper text |
| Sage | `#68745D` | `--color-sage` | Brand accent and selected states |
| Sage Soft | `#E8ECE4` | `--color-sage-soft` | Soft brand backgrounds |
| Success | `#5F7A55` | `--color-success` | Healthy/completed |
| Warning | `#A4773D` | `--color-warning` | Attention/upcoming |
| Error | `#A85E55` | `--color-error` | Urgent/problem |

### Color rules

- Keep the interface predominantly neutral.
- Sage is a **signal**, not a theme.
- Use semantic colors only when the state needs meaning.
- Avoid neon gradients, purple AI glows, and multiple competing accent colors.
- Avoid large pure-black areas.

## Typography

**Primary UI family:** Inter or a similarly clean modern sans.

| Role | Size | Weight | Line height |
|---|---:|---:|---:|
| Display | 48px | 500 | 1.08 |
| Heading | 36px | 500 | 1.15 |
| Heading-sm | 28px | 500 | 1.18 |
| Subheading | 20px | 500 | 1.30 |
| Body-lg | 18px | 400 | 1.45 |
| Body | 16px | 400 | 1.50 |
| Body-sm | 14px | 400 | 1.45 |
| Caption | 12px | 400 | 1.40 |

Use negative tracking only on large headings. Keep body text neutral and highly readable.

## Spacing & Shape

**Base unit:** 4px  
**Density:** comfortable

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96px`

### Radius

- Tags/status pills: `9999px`
- Buttons: `10–12px`
- Inputs: `10px`
- Small cards: `12px`
- Standard cards: `16px`
- Large cards: `20px`
- Image containers: `12–16px`

Do not make every element a pill.

## Elevation

Keep the UI mostly flat and calm.

```css
box-shadow:
  0 1px 2px rgba(36, 36, 33, 0.04),
  0 4px 12px rgba(36, 36, 33, 0.04);
```

Prefer a hairline border over heavy shadows.

## Layout

- Desktop max width: `1280px`
- Content width: `1120–1200px`
- Desktop outer gutter: `32–48px`
- Section gap: `48–80px`
- Card padding: `20–24px`
- Large card padding: `32px`
- Element gap: `8–16px`
- Desktop grid: 12 columns
- Responsive layouts should collapse cleanly to 1–2 columns.

## Core Components

### Primary Button
Charcoal fill, white text, 10–12px radius, 40px-ish height, Inter 14px/500.

### Secondary Button
White/eggshell fill, charcoal text, 1px soft-stone border, 10–12px radius.

### Ghost Button
Transparent with charcoal/smoke text and subtle hover surface.

### Asset Card
Product image → asset name → room/category → key status.

Example:

**Samsung 55” TV**  
Living Room · Electronics  
**Warranty · 284 days left**

### Room Card
Room image or visual → room name → asset count → navigation affordance.

### Reminder Card
Show title, related asset, date, and clear status: Upcoming / Due / Overdue / Completed.

### Finance Card
Show monthly home spending and a lightweight category breakdown. Avoid complex analytics in V1.

### AI Identification Card
Show uploaded image, identified product, suggested room/category, and clear **Confirm / Edit** actions.

The AI surface should use Sage subtly. No glowing futuristic treatment.

### Status Badge
Use compact pills for:
- Warranty active
- Expiring soon
- Maintenance due
- Repair pending
- Completed

## Navigation

Primary navigation:

**Home · Inventory · Reminders · Finances · Documents**

A prominent **+ Add** action creates:

- Asset
- Expense
- Reminder
- Document

Inventory remains the center of V1.

## Dashboard Pattern

The dashboard should answer:

> **“What is happening with my home, and what needs my attention?”**

Recommended hierarchy:

1. Greeting / home context
2. Home overview
3. **Needs attention**
4. Rooms / Your home
5. Home spending
6. Recent activity

Avoid generic SaaS KPI-card overload.

## Imagery

Imagery is important because HomeOS represents physical things.

Use:
- Realistic appliance/product imagery
- Room photography where useful
- Consistent image crops
- Soft, natural lighting
- Neutral backgrounds
- Rounded image containers

Avoid:
- Futuristic AI illustrations
- Neon 3D objects
- Excessive decorative gradients
- Generic stock photography when an actual asset image is more useful

## Do

- Use warm off-white backgrounds.
- Keep most of the UI neutral.
- Use Sage as a restrained brand signal.
- Give asset imagery enough visual weight.
- Use generous whitespace.
- Use subtle borders and soft elevation.
- Keep cards consistent.
- Make information easy to scan.
- Let AI assist quietly.
- Use clear room/category hierarchy.

## Don't

- Don't use neon purple or futuristic AI gradients.
- Don't make the UI dark by default.
- Don't turn every component into a pill.
- Don't overload the dashboard with charts.
- Don't use heavy shadows.
- Don't use multiple bright accent colors.
- Don't make AI the visual center of every screen.
- Don't design HomeOS like a smart-device control panel.
- Don't sacrifice readability for visual minimalism.

## HomeOS V1 UX Language

**Capture → Organize → Understand → Remember**

- **Capture** what the user owns.
- **Organize** it by room and category.
- **Understand** important asset information.
- **Remember** warranties, maintenance, repairs, bills, and reminders.

### AI V1

**Photo → Identify → Suggest → User confirms → Asset created**

The AI suggests; the user stays in control.

## Agent Prompt Guide

> Create a premium, calm, warm home-management interface using warm eggshell backgrounds, neutral surfaces, charcoal typography, restrained sage accents, generous whitespace, subtle borders, soft elevation, rounded 12–16px cards, and realistic home/asset imagery. The experience should feel like a beautifully organized digital home, not an enterprise SaaS dashboard or smart-home controller. Keep AI interactions subtle and integrated. Avoid neon colors, futuristic gradients, excessive glassmorphism, excessive pill components, heavy shadows, and dense analytics layouts.

### Example prompts

1. **Dashboard:** Create a HomeOS dashboard with a warm eggshell canvas, greeting, home overview, a prominent “Needs attention” section, room cards, lightweight home spending, and recent activity.
2. **Asset card:** Create an asset card with a realistic product image, product name, room/category metadata, and a compact warranty or maintenance status.
3. **AI identification:** Create an AI asset-identification confirmation card showing the uploaded product image, identified product, suggested room and category, with clear Confirm and Edit actions.
4. **Room card:** Create a room card with a subtle room image, room name, asset count, and a clean navigation affordance.
5. **Asset detail:** Create an asset detail page for a household appliance with purchase information, warranty, maintenance, repair history, documents, and a clear primary action.

## Quick Start — CSS Custom Properties

```css
:root {
  --color-eggshell: #F8F7F3;
  --color-surface: #FFFFFF;
  --color-stone: #F0EEE9;
  --color-soft-stone: #E3E0D9;
  --color-charcoal: #242421;
  --color-graphite: #4E4D48;
  --color-smoke: #716F68;
  --color-ash: #A19E96;
  --color-sage: #68745D;
  --color-sage-soft: #E8ECE4;
  --color-success: #5F7A55;
  --color-warning: #A4773D;
  --color-error: #A85E55;

  --font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  --text-caption: 12px;
  --text-body-sm: 14px;
  --text-body: 16px;
  --text-body-lg: 18px;
  --text-subheading: 20px;
  --text-heading-sm: 28px;
  --text-heading: 36px;
  --text-display: 48px;

  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-96: 96px;

  --page-max-width: 1280px;
  --content-max-width: 1200px;
  --card-padding: 24px;

  --radius-button: 12px;
  --radius-input: 10px;
  --radius-card: 16px;
  --radius-large-card: 20px;
  --radius-full: 9999px;

  --shadow-subtle:
    0 1px 2px rgba(36, 36, 33, 0.04),
    0 4px 12px rgba(36, 36, 33, 0.04);
}
```

## HomeOS Visual North Star

**Calm. Warm. Organized. Intelligent.**

> **A beautifully organized digital representation of your home — with AI quietly doing the tedious work.**
