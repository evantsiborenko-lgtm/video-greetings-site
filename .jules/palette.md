# Visual System & Palette (KVSemenov Video Greetings)

## Colors

- **Primary Color (Gold):** `#c99856`
  - Used for: Call-to-action buttons, active states, borders on hover, highlights, and icons.
- **Secondary Color (Dark Gold/Hover):** `#a67c46`
  - Used for: Hover state on primary buttons, secondary button borders.
- **Background Color (Dark Base):** `#0d0d12`
  - Used for: The main page background.
- **Light Background (Cards):** `#16161e`
  - Used for: Product cards, FAQ items, and distinct UI sections to create depth.
- **Text Color (White):** `#ffffff`
  - Used for: Primary headings, body text.
- **Muted Text (Gray):** `#a0a0b0`
  - Used for: Descriptions, secondary text, SKU codes, and subtle metadata.
- **Border Color:** `#2a2a35`
  - Used for: Separators, card borders, and accordion outlines.

## States

### Hover
- Elements typically lift (`transform: translateY(-3px)`) and increase shadow depth.
- Borders often switch to a semi-transparent primary color `rgba(201, 152, 86, 0.3)`.

### Focus (Accessibility)
- When navigated via keyboard, interactive elements receive `:focus-visible`.
- Outline: `2px solid var(--primary)` with a `2px` offset.
- Box-shadow glow: `0 0 0 4px rgba(201, 152, 86, 0.3)`.
- Interactive elements affected: `a`, `button`, `.category-card`, `.faq-question`, `.series-header`.

### Active / Selected
- Active categories (`.category-active`) receive a primary colored border and a subtle primary box-shadow.
- Expanded accordions rotate their trailing icons (`+` to `x` via `transform: rotate(45deg)`).

## Typography
- **Font Family:** 'Inter', sans-serif
- **Weights:** 300, 400, 600, 800
