#!/usr/bin/env node
/**
 * export-design-tokens.js
 *
 * Reads DESIGN_SYSTEM.md and extracts design tokens into:
 *   - DESIGN_TOKENS.json  (machine-readable, consumed by frontend/user-stories phases)
 *   - tokens.css          (CSS custom properties, consumed by generated HTML)
 *
 * Usage:
 *   node export-design-tokens.js <design_dir> [--format json|css|both]
 *
 * The script is model-agnostic — it operates on the file system, parsing
 * markdown patterns. Runs as a deterministic node in design-2.yaml.
 */

const fs = require('fs');
const path = require('path');

function parseDesignSystem(content) {
  const tokens = {
    colors: {
      primary: { name: '', hex: '', usage: '', class: '' },
      accent: { name: '', hex: '', usage: '', class: '' },
      secondary: { name: '', hex: '', usage: '', class: '' },
      success: { name: '', hex: '', usage: '', class: '' },
      warning: { name: '', hex: '', usage: '', class: '' },
      error: { name: '', hex: '', usage: '', class: '' },
      background: { light: '#F9FAFB', dark: '#0F172A', class: 'bg-slate-50' },
      surface: { light: '#FFFFFF', dark: '#1E293B', class: 'bg-white' },
      text: {
        primary: { light: '#1E293B', dark: '#F1F5F9', class: 'text-slate-800' },
        secondary: { light: '#64748B', dark: '#94A3B8', class: 'text-slate-500' },
      },
      border: { light: '#E5E7EB', dark: '#334155', class: 'border-slate-200' },
    },
    typography: {
      heading_family: 'Inter',
      body_family: 'Inter',
      scale: {
        h1: '4xl',
        h2: '3xl',
        h3: '2xl',
        h4: 'xl',
        body: 'base',
        small: 'sm',
        caption: 'xs',
      },
      weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    spacing: {
      base_unit: '4px',
      card_padding: '24px',
      section_padding: '32px',
      between_cards: '16px',
      input_height: '48px',
      button_height: '48px',
      card_radius: 'lg',
      button_radius: 'md',
    },
    effects: {
      shadow: 'shadow-sm',
      transition: 'transition-colors duration-200',
      icon_family: 'lucide',
      icon_size_inline: 'w-4 h-4',
      icon_size_standalone: 'w-5 h-5',
    },
    accessibility: {
      min_contrast_ratio: '4.5',
      min_touch_target: '44px',
      reduced_motion: true,
    },
  };

  // Extract colors from markdown
  const colorRegex = /-\s*(?:Primary|Secondary|Accent|Success|Warning|Error|Danger)\s*[:\-]?\s*([^:]+?)(?::|\s*#)\s*(#[A-Fa-f0-9]{6})/g;
  let match;
  while ((match = colorRegex.exec(content)) !== null) {
    const nameLower = match[1].trim().toLowerCase();
    const hex = match[2].trim();
    if (nameLower.includes('primary')) {
      tokens.colors.primary.hex = hex;
      tokens.colors.primary.name = match[1].trim();
    } else if (nameLower.includes('accent') || nameLower.includes('secondary')) {
      tokens.colors.accent.hex = hex;
      tokens.colors.accent.name = match[1].trim();
    } else if (nameLower.includes('success') || nameLower.includes('green')) {
      tokens.colors.success.hex = hex;
      tokens.colors.success.name = match[1].trim();
    } else if (nameLower.includes('warning') || nameLower.includes('orange') || nameLower.includes('yellow')) {
      tokens.colors.warning.hex = hex;
      tokens.colors.warning.name = match[1].trim();
    } else if (nameLower.includes('error') || nameLower.includes('danger') || nameLower.includes('red')) {
      tokens.colors.error.hex = hex;
      tokens.colors.error.name = match[1].trim();
    }
  }

  // Also try the simpler format: Primary Color: #HEX
  const simpleColorRegex = /-\s*(Primary|Secondary|Accent|Success|Warning|Error|Danger)\s*[Cc]olor\s*:?\s*(#[A-Fa-f0-9]{6})/g;
  while ((match = simpleColorRegex.exec(content)) !== null) {
    const key = match[1].toLowerCase();
    const hex = match[2].trim();
    if (tokens.colors[key]) {
      tokens.colors[key].hex = hex;
      tokens.colors[key].name = match[1];
    }
  }

  // Extract font family
  const fontRegex = /[Ff]ont:?\s*[Ff]amily:?\s*([^,\n]+)/;
  const fontMatch = content.match(fontRegex);
  if (fontMatch) {
    const family = fontMatch[1].trim();
    tokens.typography.heading_family = family;
    tokens.typography.body_family = family;
  }

  // Extract heading font if separate
  const headingFontRegex = /[Hh]eading(?:\s*[Ff]ont)?:?\s*([^,\n]+)/;
  const headingFontMatch = content.match(headingFontRegex);
  if (headingFontMatch) {
    tokens.typography.heading_family = headingFontMatch[1].trim();
  }

  // Extract body font if separate
  const bodyFontRegex = /[Bb]ody(?:\s*[Ff]ont)?:?\s*([^,\n]+)/;
  const bodyFontMatch = content.match(bodyFontRegex);
  if (bodyFontMatch) {
    tokens.typography.body_family = bodyFontMatch[1].trim();
  }

  // Extract font sizes
  const h1Regex = /H1:?\s*(\d+)px/;
  const h1Match = content.match(h1Regex);
  if (h1Match) {
    const size = parseInt(h1Match[1], 10);
    if (size >= 48) tokens.typography.scale.h1 = '5xl';
    else if (size >= 36) tokens.typography.scale.h1 = '4xl';
    else tokens.typography.scale.h1 = '3xl';
  }

  const h2Regex = /H2:?\s*(\d+)px/;
  const h2Match = content.match(h2Regex);
  if (h2Match) {
    const size = parseInt(h2Match[1], 10);
    if (size >= 36) tokens.typography.scale.h2 = '4xl';
    else if (size >= 30) tokens.typography.scale.h2 = '3xl';
    else tokens.typography.scale.h2 = '2xl';
  }

  const h3Regex = /H3:?\s*(\d+)px/;
  const h3Match = content.match(h3Regex);
  if (h3Match) {
    const size = parseInt(h3Match[1], 10);
    if (size >= 24) tokens.typography.scale.h3 = '2xl';
    else tokens.typography.scale.h3 = 'xl';
  }

  // Extract border radius
  const radiusRegex = /[Rr]adius:?\s*(\d+)px/;
  const radiusMatch = content.match(radiusRegex);
  if (radiusMatch) {
    const r = parseInt(radiusMatch[1], 10);
    if (r >= 16) tokens.spacing.card_radius = '2xl';
    else if (r >= 12) tokens.spacing.card_radius = 'xl';
    else if (r >= 8) tokens.spacing.card_radius = 'lg';
    else tokens.spacing.card_radius = 'md';
  }

  // Extract shadow
  const shadowRegex = /[Ss]hadow:?\s*([^\n,]+)/;
  const shadowMatch = content.match(shadowRegex);
  if (shadowMatch) {
    const s = shadowMatch[1].trim().toLowerCase();
    if (s.includes('none')) tokens.effects.shadow = 'shadow-none';
    else if (s.includes('lg') || s.includes('xl')) tokens.effects.shadow = 'shadow-lg';
    else if (s.includes('md')) tokens.effects.shadow = 'shadow-md';
    else tokens.effects.shadow = 'shadow-sm';
  }

  // Extract icon family
  const iconRegex = /[Ii]cons?:?\s*([Ll]ucide|[Hh]eroicons?|[Ff]ont[Aa]wesome)/;
  const iconMatch = content.match(iconRegex);
  if (iconMatch) {
    tokens.effects.icon_family = iconMatch[1].toLowerCase().includes('lucide') ? 'lucide' : 'heroicons';
  }

  // Derive Tailwind classes from hex colors
  if (tokens.colors.primary.hex) {
    tokens.colors.primary.class = 'primary';
  }
  if (tokens.colors.accent.hex) {
    tokens.colors.accent.class = 'accent';
  }

  // Derive gradient end from primary (lighten slightly)
  if (tokens.colors.primary.hex) {
    const hex = tokens.colors.primary.hex.replace('#', '');
    const lightened = lightenHex(hex, 30);
    tokens.colors.primary.gradientEnd = `#${lightened}`;
  }

  return tokens;
}

function lightenHex(hex, amount) {
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  r = Math.min(255, r + amount);
  g = Math.min(255, g + amount);
  b = Math.min(255, b + amount);
  return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function generateCSS(tokens) {
  const c = tokens.colors;
  const t = tokens.typography;
  const s = tokens.spacing;
  const e = tokens.effects;
  const a = tokens.accessibility;

  return `/* Design Tokens — generated by export-design-tokens.js */
/* DO NOT EDIT MANUALLY */

:root {
  /* Colors */
  --color-primary: ${c.primary.hex || '#0066FF'};
  --color-accent: ${c.accent.hex || '#8B5CF6'};
  --color-secondary: ${c.secondary.hex || '#6366F1'};
  --color-success: ${c.success.hex || '#10B981'};
  --color-warning: ${c.warning.hex || '#F59E0B'};
  --color-error: ${c.error.hex || '#EF4444'};

  /* Surfaces */
  --color-bg: ${c.background.light};
  --color-surface: ${c.surface.light};
  --color-text-primary: ${c.text.primary.light};
  --color-text-secondary: ${c.text.secondary.light};
  --color-border: ${c.border.light};

  /* Typography */
  --font-heading: '${t.heading_family}', sans-serif;
  --font-body: '${t.body_family}', sans-serif;
  --text-h1: var(--tw-font-size-${t.scale.h1.replace('xl', 'xl')});
  --text-h2: var(--tw-font-size-${t.scale.h2});
  --text-h3: var(--tw-font-size-${t.scale.h3});
  --text-body: 1rem;
  --text-small: 0.875rem;

  /* Spacing */
  --spacing-card-padding: ${s.card_padding};
  --spacing-section-padding: ${s.section_padding};
  --spacing-between-cards: ${s.between_cards};
  --spacing-input-height: ${s.input_height};
  --radius-card: var(--tw-border-radius-${s.card_radius});
  --radius-button: var(--tw-border-radius-${s.button_radius});

  /* Effects */
  --shadow-default: var(--tw-shadow-${e.shadow});
  --transition-default: ${e.transition};

  /* Accessibility */
  --target-min-touch: ${a.min_touch_target};
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: ${c.background.dark};
    --color-surface: ${c.surface.dark};
    --color-text-primary: ${c.text.primary.dark};
    --color-text-secondary: ${c.text.secondary.dark};
    --color-border: ${c.border.dark};
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
}

function main() {
  const args = process.argv.slice(2);
  let designDir = args[0];
  let format = 'both';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' || args[i] === '-f') {
      format = args[++i];
    }
  }

  if (!designDir) {
    console.error('Usage: node export-design-tokens.js <design_dir> [--format json|css|both]');
    process.exit(1);
  }

  const systemFile = path.join(designDir, 'DESIGN_SYSTEM.md');
  if (!fs.existsSync(systemFile)) {
    console.error(`DESIGN_SYSTEM.md not found at ${systemFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(systemFile, 'utf-8');
  const tokens = parseDesignSystem(content);

  // Add metadata
  tokens._meta = {
    generated_at: new Date().toISOString(),
    source: systemFile,
    version: '1.0',
  };

  if (format === 'json' || format === 'both') {
    const jsonPath = path.join(designDir, 'DESIGN_TOKENS.json');
    fs.writeFileSync(jsonPath, JSON.stringify(tokens, null, 2));
    console.log(`DESIGN_TOKENS.json written to ${jsonPath}`);
  }

  if (format === 'css' || format === 'both') {
    const cssPath = path.join(designDir, 'tokens.css');
    fs.writeFileSync(cssPath, generateCSS(tokens));
    console.log(`tokens.css written to ${cssPath}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseDesignSystem, generateCSS };
