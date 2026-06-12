# Design Skills Dependency Graph

Full dependency map of all design-related skills and scripts used by the `fullstack-2` orchestrator.

```
                          PRD (from Phase 2)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
          prd-to-design-guide      prd-to-design-prompts
          (full path, 3a)          (fast path, skip DG)
                    │                     │
                    ▼                     │
         design-guide-to-prompts          │
              (3b: DG→prompts)            │
                    │                     │
                    └──────────┬──────────┘
                               ▼
                      Design Prompts File
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
           generate-html (ROUTER)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   A1: Gemini   A3: Templates  A2: Claude
   (gemini-     (templates-    (prompts-
    html-gen)    to-html)       to-html)
        │           │           │
        │           ├── templates/html/*.html
        │           ├── shared-components/*.html
        │           ├── DESIGN_TOKENS.json
        │           └── analyze-design (context)
        │                       │
        └───────────┬───────────┘
                    ▼
            Generated HTML
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   export-       a11y-audit   design-snapshot
   design-       (a11y-       (design-
   tokens.js)    audit.mjs)   snapshot.js)
        │           │           │
        ▼           ▼           ▼
  DESIGN_TOKENS  A11Y_REPORT  .snapshots/
  .json + .css   .md           <ts>/
        │
        ├──────────────────────┐
        ▼                      ▼
  frontend phase          user-stories phase
  (consumes tokens)       (consumes tokens)
        │
        ▼
  design-qa-html / design-qa-figma
  (fidelity scoring against tokens)
```

## Skills by Phase

### Phase 3a — Design Guide Generation
| Skill | Path | Role |
|-------|------|------|
| `prd-to-design-guide` | `skills/design/prd-to-design-guide/SKILL.md` | **Primary** — Converts PRD → Design Guide |
| `analyze-design` | `skills/design/analyze-design/SKILL.md` | Design intelligence DB (style/color/font search) |

### Phase 3b — Design Prompts
| Skill | Path | Role |
|-------|------|------|
| `design-guide-to-prompts` | `skills/design/design-guide-to-prompts/SKILL.md` | **Primary** — Design Guide → structured prompts |
| `prd-to-design-prompts` | `skills/design/prd-to-design-prompts/SKILL.md` | Fast path — PRD → prompts directly |

### Phase 3c-3e — HTML Generation
| Skill | Path | Role |
|-------|------|------|
| `generate-html` | `skills/design/generate-html/SKILL.md` | **Router** — selects A1/A3/A2 path |
| `generate-html-gemini` | `skills/design/generate-html-gemini/SKILL.md` | A1 — Gemini API generation (primary) |
| `templates-to-html` | `skills/design/templates-to-html/SKILL.md` | A3 — Template-based generation (preferred fallback) |
| `prompts-to-html` | `skills/design/prompts-to-html/SKILL.md` | A2 — Free-form Claude generation (last resort) |

### Phase 3f-3g — Post-Generation
| Script | Path | Role |
|--------|------|------|
| `export-design-tokens.js` | `v2/scripts/export-design-tokens.js` | DESIGN_SYSTEM.md → DESIGN_TOKENS.json + tokens.css |
| `a11y-audit.mjs` | `v2/scripts/a11y-audit.mjs` | WCAG AA accessibility audit |
| `design-snapshot.js` | `v2/scripts/design-snapshot.js` | Timestamped HTML snapshot |

### Post-Design (React Phase)
| Skill | Path | Role |
|-------|------|------|
| `design-qa-html` | `react/skills/qa/design-qa-html.md` | Fidelity scoring: React vs HTML |
| `design-qa-figma` | `react/skills/qa/design-qa-figma.md` | Fidelity scoring: React vs Figma |
| `responsive-design` | `react/skills/responsive-design/SKILL.md` | Mobile/tablet responsive styles |

## Blueprint Nodes (design-2.yaml execution order)

```
1. require-prd            (deterministic)
2. domain-research        (agentic — prd-to-design-guide)
3. design-variations      (agentic — prd-to-design-guide)
4. validate-variations-output (deterministic)
5. design-checkpoint      (evaluator — design-checkpoint-rubric)
6. auto-promote-variation (deterministic)
7. require-variation-selection (deterministic — PAUSE)
8. design-full-generation (agentic — generate-html)
9. normalize-design-report (deterministic)
10. design-tokens-export   (deterministic — export-design-tokens.js)
11. a11y-audit            (deterministic — a11y-audit.mjs)
12. design-snapshot        (deterministic — design-snapshot.js)
13. evidence-check         (deterministic)
14. design-evaluator       (evaluator — design-rubric)
```

## Evaluators

| File | Criteria | When |
|------|----------|------|
| `design-checkpoint-rubric.yaml` | coherence (50%), originality (50%) | After 3 preview pages |
| `design-rubric.yaml` | coherence (25%), originality (25%), craft (25%), functionality (25%) | After full generation |
| `design-examples.yaml` | Few-shot calibration for both evaluators | Shared across evaluators |

## Gate Checks (design-gate.sh)

1. design-system-exists
2. html-files-exist
3. routes-coverage
4. routing-valid
5. shared-components-consistent
6. no-placeholders
7. client-approval
8. design-tokens-exported
9. responsive-present
10. dark-mode-support
11. a11y-score

## File Outputs

| File | Produced By | Consumed By |
|------|------------|-------------|
| `DESIGN_SYSTEM.md` | prd-to-design-guide | All downstream |
| `DESIGN_SYSTEM_A/B/C.md` | design-variations | design-full-generation |
| `DESIGN_TOKENS.json` | design-tokens-export | frontend, user-stories, templates-to-html |
| `tokens.css` | design-tokens-export | Generated HTML |
| `DESIGN_STATUS.md` | auto-promote-variation / HITL | Gate, design-full-generation |
| `A11Y_REPORT.md` | a11y-audit | Gate |
| `design-checkpoint.json` | design-checkpoint | None (advisory) |
| `design-evaluation.json` | design-evaluator | Gate (blended score) |
| `VARIATIONS_INDEX.md` | design-variations | design-full-generation |
| `DOMAIN_RESEARCH.md` | domain-research | design-variations |
| `.snapshots/<ts>/` | design-snapshot | --compare flag |

## Template Files

| Template | Path | Layout Type |
|----------|------|-------------|
| Dashboard | `templates/html/dashboard.html` | Sidebar + stats + table |
| Landing | `templates/html/landing.html` | Hero + features + pricing + CTA |
| Auth | `templates/html/auth.html` | Split-screen login/signup |
| CRUD Table | `templates/html/crud-table.html` | Filterable data table |
| Detail | `templates/html/detail.html` | Two-column detail view |
| Settings | `templates/html/settings.html` | Tabbed settings forms |

## Shared Components

| Component | Path | Injected Into |
|-----------|------|---------------|
| Navbar | `shared-components/navbar.html` | All templates ({{NAVIGATION}}) |
| Footer | `shared-components/footer.html` | All templates ({{FOOTER}}) |
| Variation Nav | `shared-components/variation-nav.html` | All templates ({{VARIATION_NAV}}) |
| Stat Card | `shared-components/stat-card.html` | Dashboard, Detail |
| Status Badge | `shared-components/status-badge.html` | Dashboard, CRUD Table, Detail |
| Form Input | `shared-components/form-input.html` | Auth, Settings |
| Form Select | `shared-components/form-select.html` | Auth, Settings |
| Button | `shared-components/button.html` | All |
| Modal | `shared-components/modal.html` | All |
| Skeleton Loader | `shared-components/skeleton-loader.html` | All (loading states) |
| Empty State | `shared-components/empty-state.html` | CRUD Table, Dashboard |
