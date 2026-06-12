---
name: templates-to-html
description: Fill design tokens into pre-built responsive HTML layout templates — primary generation path when Gemini API is unavailable
---

# Templates to HTML

> **Use when**: Gemini API is unavailable. This is the **preferred** non-Gemini path (A3) — more reliable than free-form Claude HTML generation.
> **Alternative**: `prompts-to-html` is the last-resort fallback (A2) when template layouts don't cover a page type.

Fill design tokens from `DESIGN_TOKENS.json` and `DESIGN_SYSTEM.md` into pre-built, production-tested HTML layout templates. These templates are responsive (mobile/tablet/desktop), support dark/light mode, and include accessibility best practices out of the box.

---

## Prerequisites

1. **DESIGN_TOKENS.json** at `{PROJECT_DIR}/design/DESIGN_TOKENS.json` (from `design-tokens-export` node)
2. **DESIGN_SYSTEM.md** at `{PROJECT_DIR}/design/DESIGN_SYSTEM.md`
3. **Design Prompts file** at `{PROJECT_DIR}/design/{PROJECT}_DesignPrompts.md`
4. **Shared components** at `.claude/.claude/shared-components/` (navbar, footer, variation nav)

---

## Available Templates

| Template | File | Use For |
|----------|------|---------|
| Dashboard | `.claude/templates/html/dashboard.html` | Admin panels, user dashboards, overview pages |
| Landing | `.claude/templates/html/landing.html` | Homepages, marketing pages, public-facing |
| Auth | `.claude/templates/html/auth.html` | Login, signup, forgot-password, reset-password |
| CRUD Table | `.claude/templates/html/crud-table.html` | List views, data tables, management screens |
| Detail | `.claude/templates/html/detail.html` | Detail views, entity pages, two-column layouts |
| Settings | `.claude/templates/html/settings.html` | Settings pages, profile editor, tabbed forms |

---

## Token System

Templates use `{{UPPERCASE_TOKEN}}` placeholders. Tokens fall into three categories:

### 1. Design Tokens (from DESIGN_TOKENS.json)

| Token | Source | Example Value |
|-------|--------|---------------|
| `{{PRIMARY_COLOR}}` | `colors.primary.hex` | `#0066FF` |
| `{{ACCENT_COLOR}}` | `colors.accent.hex` | `#8B5CF6` |
| `{{SUCCESS_COLOR}}` | `colors.success.hex` | `#10B981` |
| `{{WARNING_COLOR}}` | `colors.warning.hex` | `#F59E0B` |
| `{{ERROR_COLOR}}` | `colors.error.hex` | `#EF4444` |
| `{{FONT_HEADING}}` | `typography.heading_family` | `Inter` |
| `{{FONT_BODY}}` | `typography.body_family` | `Inter` |
| `{{H1_SIZE}}` | `typography.scale.h1` | `4xl` |
| `{{H2_SIZE}}` | `typography.scale.h2` | `3xl` |
| `{{H3_SIZE}}` | `typography.scale.h3` | `2xl` |
| `{{BODY_SIZE}}` | `typography.scale.body` | `base` |
| `{{CARD_RADIUS}}` | `spacing.card_radius` | `lg` |
| `{{BUTTON_RADIUS}}` | `spacing.button_radius` | `md` |
| `{{SHADOW}}` | `effects.shadow` | `shadow-sm` |
| `{{SURFACE_BG}}` | `colors.surface` (light) | `#F9FAFB` |
| `{{SURFACE_COLOR}}` | `colors.surface` (light) | `#FFFFFF` |
| `{{TEXT_PRIMARY}}` | `colors.text.primary` (light) | `#1E293B` |
| `{{TEXT_SECONDARY}}` | `colors.text.secondary` (light) | `#64748B` |
| `{{BORDER_COLOR}}` | `colors.border` (light) | `#E5E7EB` |
| `{{BG_DARK}}` | `colors.background` (dark) | `#0F172A` |
| `{{SURFACE_DARK}}` | `colors.surface` (dark) | `#1E293B` |
| `{{TEXT_PRIMARY_DARK}}` | `colors.text.primary` (dark) | `#F1F5F9` |
| `{{TEXT_SECONDARY_DARK}}` | `colors.text.secondary` (dark) | `#94A3B8` |
| `{{BORDER_DARK}}` | `colors.border` (dark) | `#334155` |
| `{{SHADOW_CLASS}}` | `effects.shadow` | `shadow-sm` |
| `{{BG_CLASS}}` | `colors.background_class` | `bg-slate-50` |
| `{{TEXT_CLASS}}` | `colors.text_primary_class` | `text-slate-800` |
| `{{TEXT_SECONDARY_CLASS}}` | `colors.text_secondary_class` | `text-slate-500` |
| `{{BORDER_CLASS}}` | `colors.border_class` | `border border-slate-200` |
| `{{PRIMARY_GRADIENT_END}}` | Derived from primary | `#4F46E5` |

### 2. Page Content Tokens (from Design Prompts)

| Token | Source | Example |
|-------|--------|---------|
| `{{PAGE_TITLE}}` | Page prompt `name:` field | "Dashboard" |
| `{{PAGE_HEADING}}` | Page prompt layout instructions | "Welcome back" |
| `{{PAGE_SUBTITLE}}` | Page prompt overview | "Monitor your metrics" |
| `{{PAGE_DESCRIPTION}}` | Page prompt purpose | "Dashboard for..." |
| `{{PROJECT_NAME}}` | Design prompts frontmatter | "MySaaS" |

### 3. Template-Specific Tokens (filled per page type)

Each template has its own set of structural tokens:

**Dashboard**: `{{NAVIGATION}}`, `{{SIDEBAR_ITEMS}}`, `{{STATS_CARDS}}`, `{{MAIN_CONTENT}}`, `{{MAIN_CONTENT_TITLE}}`, `{{SIDE_CONTENT}}`, `{{SIDE_CONTENT_TITLE}}`, `{{PAGE_ACTIONS}}`, `{{EXTRA_SECTIONS}}`

**Landing**: `{{NAVIGATION}}`, `{{HERO_HEADING}}`, `{{HERO_SUBTITLE}}`, `{{CTA_PRIMARY_TEXT}}`, `{{CTA_PRIMARY_LINK}}`, `{{CTA_SECONDARY_TEXT}}`, `{{CTA_SECONDARY_LINK}}`, `{{FEATURES_SECTION}}`, `{{HOW_IT_WORKS_SECTION}}`, `{{PRICING_SECTION}}`, `{{TESTIMONIALS}}`, `{{TESTIMONIAL_HEADING}}`, `{{FINAL_CTA_HEADING}}`, `{{FINAL_CTA_SUBTITLE}}`, `{{FINAL_CTA_TEXT}}`, `{{FINAL_CTA_LINK}}`

**Auth**: `{{NAVIGATION}}`, `{{BRAND_ICON}}`, `{{BRAND_HEADING}}`, `{{BRAND_SUBTITLE}}`, `{{FORM_HEADING}}`, `{{FORM_SUBTITLE}}`, `{{FORM_FIELDS}}`, `{{FORM_EXTRAS}}`, `{{SUBMIT_BUTTON_TEXT}}`, `{{SOCIAL_LOGIN}}`, `{{BOTTOM_LINK_TEXT}}`, `{{BOTTOM_LINK_HREF}}`, `{{BOTTOM_LINK_LABEL}}`

**CRUD Table**: `{{NAVIGATION}}`, `{{SEARCH_PLACEHOLDER}}`, `{{FILTER_CONTROLS}}`, `{{ACTION_BUTTONS}}`, `{{TABLE_HEADERS}}`, `{{TABLE_ROWS}}`, `{{PAGINATION_INFO}}`, `{{PAGINATION_CONTROLS}}`

**Detail**: `{{NAVIGATION}}`, `{{BREADCRUMB}}`, `{{STATUS_BADGES}}`, `{{HEADER_ACTIONS}}`, `{{DETAIL_CONTENT}}`, `{{DETAIL_SECTIONS}}`, `{{META_TITLE}}`, `{{META_FIELDS}}`, `{{SIDEBAR_EXTRAS}}`

**Settings**: `{{NAVIGATION}}`, `{{TAB_ITEMS}}`, `{{SETTINGS_FORM}}`

### Shared Tokens (from .claude/shared-components/)

| Token | Source File | Filled With |
|-------|-------------|-------------|
| `{{NAVIGATION}}` | `.claude/shared-components/navbar.html` | Full navbar HTML (populated with page links) |
| `{{FOOTER}}` | `.claude/shared-components/footer.html` | Full footer HTML |
| `{{VARIATION_NAV}}` | `.claude/shared-components/variation-nav.html` | In-page variation navigation bar |

---

## Workflow

### Step 1: Determine Template

For each page in the parsed prompts, select the template based on `category`:

| Category | Template |
|----------|----------|
| `auth` | `auth.html` |
| `public` | `landing.html` (if first page) or `detail.html` |
| `user` | `dashboard.html` (if named dashboard/home/overview) or `crud-table.html` (lists) or `detail.html` (entity views) |
| `admin` | `dashboard.html` |
| any | `settings.html` (if page name contains "settings"/"profile") |

### Step 2: Load Tokens

```
1. Read DESIGN_TOKENS.json → design_tokens object
2. Read DESIGN_SYSTEM.md → extract additional context (style, effects, anti-patterns)
3. Read page prompt from Design Prompts → page content tokens
4. Load shared components from .claude/shared-components/:
   - .claude/shared-components/navbar.html
   - .claude/shared-components/footer.html
   - .claude/shared-components/variation-nav.html
```

### Step 3: Fill Design Tokens

Replace all `{{DESIGN_TOKEN}}` placeholders with values from DESIGN_TOKENS.json. This is a direct string substitution — no LLM needed. Use the exact values from the JSON file.

### Step 4: Fill Shared Components

```
1. Take .claude/shared-components/navbar.html
2. Inject page list into navigation links
3. Mark current page as active
4. Substitute {{NAVIGATION}} token

5. Take .claude/shared-components/footer.html
6. Inject project name
7. Substitute {{FOOTER}} token

8. Take .claude/shared-components/variation-nav.html
9. Substitute {{VARIATION_NAV}} token
```

### Step 5: Generate Page Content (LLM-assisted for template-specific tokens)

For tokens that need intelligent filling (like `{{TABLE_ROWS}}`, `{{FORM_FIELDS}}`, `{{HERO_HEADING}}`), use the LLM with this constrained context:

```
I am filling the {{TEMPLATE_NAME}} template for page "{{PAGE_NAME}}".

DESIGN TOKENS (already filled):
{{DESIGN_TOKENS_SUMMARY}}

PAGE PROMPT:
{{PAGE_PROMPT_FULL}}

TEMPLATE STRUCTURE (tokens already filled shown as [...], tokens needing content marked as ???):
{{TEMPLATE_SKELETON}}

Please generate only the content for the ??? tokens as HTML fragments.
Rules:
- Use ONLY colors/fonts/spacing from the design tokens above
- Must include responsive classes (sm:, md:, lg:) for mobile/tablet/desktop
- Must use Lucide icons (i data-lucide="..." tags)
- No emojis as icons
- All interactive elements must have cursor-pointer
- All form inputs must have associated labels
- Output one HTML fragment per token, labeled with the token name
```

### Step 6: Assemble & Validate

```
1. Combine: template skeleton + filled design tokens + shared components + generated content = final HTML
2. Validate:
   - All {{TOKEN}} placeholders resolved (no remaining {{...}})
   - Contains responsive classes (sm:, md:, lg:)
   - Contains data-theme support (reads from localStorage)
   - Has cursor-pointer on interactive elements
   - Has alt text on images
   - Has labels on form inputs
   - Has prefers-reduced-motion media query
3. Save to output_dir/{filename}.html
```

---

## Error Handling

| Error | Recovery |
|-------|----------|
| Template not found for category | Fall back to `detail.html` (most general) |
| Token not found in DESIGN_TOKENS.json | Use sensible default from `analyze-design` fallback chain |
| Shared component missing | Generate inline minimal version |
| Unresolved `{{...}}` in output | Flag in validation, retry with explicit fill |

---

## Output

- One `.html` file per page in `{output_dir}/{page-slug}.html`
- All files share identical navbar and footer (from shared components)
- All files support dark/light mode via CSS custom properties + `data-theme`
- All files are responsive (mobile 375px, tablet 768px, desktop 1440px)
- All files pass the pre-delivery checklist from `analyze-design/SKILL.md`

---

## Template vs Free-Form Tradeoffs

| Aspect | Templates (A3) | Free-Form (A2) |
|--------|---------------|----------------|
| Layout reliability | Guaranteed — pre-tested HTML | Variable — depends on LLM quality |
| Responsive | Built-in (sm/md/lg breakpoints) | Must be prompted explicitly |
| Dark mode | Built-in (CSS custom properties) | Rarely generated correctly |
| Accessibility | Pre-verified (labels, focus, contrast) | Must be prompted + verified |
| Design token fidelity | Exact — direct substitution | Approximate — LLM interpretation |
| Visual variety | Moderate — same skeleton per type | Higher — free-form layouts |
| Generation speed | Fast — mostly substitution | Slow — full LLM generation per page |

Use A3 for production runs. Use A2 only for pages with no matching template.

---

## Related

- `templates/html/*.html` — The 6 template files
- `.claude/shared-components/*.html` — Shared navbar, footer, variation nav
- `skills/design/generate-html/SKILL.md` — Router skill (selects A1/A3/A2)
- `skills/design/prompts-to-html/SKILL.md` — Free-form fallback (A2)
- `v2/scripts/export-design-tokens.js` — Generates DESIGN_TOKENS.json
