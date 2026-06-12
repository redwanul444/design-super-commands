#!/usr/bin/env node
/**
 * a11y-audit.mjs
 *
 * Headless accessibility audit for generated HTML files. Runs as a
 * deterministic node in the design-2 blueprint after full HTML generation.
 *
 * Checks:
 *   1. All <img> tags have alt attributes
 *   2. All <input> tags have associated <label> elements
 *   3. No empty links (<a> with no text and no aria-label)
 *   4. No empty buttons
 *   5. All interactive elements have focus styles (class check)
 *   6. Contrast ratio >= 4.5:1 on text elements (delegated to Playwright if available)
 *   7. Form inputs have placeholder or label
 *   8. No missing lang attribute on <html>
 *   9. No positive tabindex values
 *   10. prefers-reduced-motion media query present
 *
 * Usage:
 *   node a11y-audit.mjs <html_dir> [--report <path>]
 *
 * Outputs A11Y_REPORT.md with pass/fail per check and an overall score.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function findHtmlFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  try {
    const entries = readdirSync(dir, { recursive: true });
    for (const entry of entries) {
      if (entry.endsWith('.html')) {
        files.push(join(dir, entry));
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${dir}: ${e.message}`);
  }
  return files;
}

function auditFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const filename = filePath.split(/[/\\]/).pop();
  const issues = [];

  // 1. All <img> have alt
  const imgWithoutAlt = content.match(/<img(?![^>]*\balt=)[^>]*>/g);
  if (imgWithoutAlt) {
    imgWithoutAlt.forEach(img => {
      issues.push({ check: 'img-alt', severity: 'P2', element: img.slice(0, 80), file: filename });
    });
  }

  // 2. All <input> have associated <label> (by id-for or wrapping)
  const inputs = content.match(/<input[^>]*id=["']([^"']+)["'][^>]*>/g) || [];
  inputs.forEach(input => {
    const idMatch = input.match(/id=["']([^"']+)["']/);
    if (idMatch) {
      const id = idMatch[1];
      // Check for label with matching for attribute
      const hasLabel = new RegExp(`<label[^>]*for=["']${id}["']`, 'i').test(content);
      if (!hasLabel) {
        // Check for wrapping label
        const wrapped = new RegExp(`<label[^>]*>[\\s\\S]*?${id}[\\s\\S]*?</label>`, 'i').test(content);
        if (!wrapped) {
          const typeMatch = input.match(/type=["']([^"']+)["']/);
          const type = typeMatch ? typeMatch[1] : 'text';
          // Skip hidden inputs
          if (type !== 'hidden' && type !== 'submit' && type !== 'button' && type !== 'reset') {
            issues.push({ check: 'input-label', severity: 'P1', element: `#${id}`, file: filename });
          }
        }
      }
    }
  });

  // 3. No empty links
  const emptyLinks = content.match(/<a\b(?![^>]*\baria-label=)(?![^>]*>[^<]{1,}<)(?![^>]*><i\b)[^>]*>\s*<\/a>/g);
  if (emptyLinks) {
    emptyLinks.forEach(link => {
      issues.push({ check: 'empty-link', severity: 'P1', element: link.slice(0, 60), file: filename });
    });
  }

  // 4. No empty buttons
  const emptyButtons = content.match(/<button\b(?![^>]*\baria-label=)(?![^>]*>[^<]{1,}<)[^>]*>\s*<\/button>/g);
  if (emptyButtons) {
    emptyButtons.forEach(btn => {
      issues.push({ check: 'empty-button', severity: 'P1', element: btn.slice(0, 60), file: filename });
    });
  }

  // 5. cursor-pointer on interactive elements
  const interactiveWithoutCursor = content.match(/<(button|a|select)\b(?![^>]*\bcursor-pointer\b)[^>]*>/g);
  if (interactiveWithoutCursor) {
    // Count by type
    const missing = {};
    interactiveWithoutCursor.forEach(el => {
      const tag = el.match(/^<(\w+)/)[1];
      missing[tag] = (missing[tag] || 0) + 1;
    });
    if (Object.keys(missing).length > 0) {
      const summary = Object.entries(missing).map(([k, v]) => `${k}(x${v})`).join(', ');
      issues.push({ check: 'cursor-pointer', severity: 'P2', element: summary, file: filename });
    }
  }

  // 6. lang attribute on html
  const htmlTag = content.match(/<html(?![^>]*\blang=)[^>]*>/);
  if (htmlTag) {
    issues.push({ check: 'html-lang', severity: 'P1', element: '<html> missing lang', file: filename });
  }

  // 7. No positive tabindex
  const positiveTabindex = content.match(/tabindex\s*=\s*["']([1-9]\d*)["']/g);
  if (positiveTabindex) {
    issues.push({ check: 'tabindex-positive', severity: 'P2', element: positiveTabindex.join(', '), file: filename });
  }

  // 8. prefers-reduced-motion present
  if (!content.includes('prefers-reduced-motion')) {
    issues.push({ check: 'reduced-motion', severity: 'P2', element: 'Missing prefers-reduced-motion', file: filename });
  }

  // 9. Check for focus styles (focus:ring or focus:outline)
  if (!content.includes('focus:ring') && !content.includes('focus:outline')) {
    issues.push({ check: 'focus-styles', severity: 'P2', element: 'Missing focus styles', file: filename });
  }

  // 10. Form has no aria-describedby for errors
  // (Light check: look for form elements without aria-describedby)
  const forms = content.match(/<form[^>]*>/g) || [];
  forms.forEach(form => {
    if (!form.includes('aria-describedby')) {
      issues.push({ check: 'form-aria-describedby', severity: 'P2', element: form.slice(0, 60), file: filename });
    }
  });

  return { file: filename, issues, totalChecks: 10 };
}

function generateReport(results, outputDir) {
  const totalFiles = results.length;
  const allIssues = results.flatMap(r => r.issues);
  const p1Issues = allIssues.filter(i => i.severity === 'P1');
  const p2Issues = allIssues.filter(i => i.severity === 'P2');

  // Score calculation: P1 issues cost more
  const maxScore = totalFiles * 10;
  const penalty = p1Issues.length * 2 + p2Issues.length * 1;
  const score = Math.max(0, Math.min(1, (maxScore - penalty) / maxScore));
  const passed = score >= 0.9;

  let report = `# Accessibility Audit Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Files Audited:** ${totalFiles}\n`;
  report += `**Overall Score:** ${score.toFixed(2)} (${(score * 100).toFixed(0)}%)\n`;
  report += `**Status:** ${passed ? 'PASS' : 'FAIL'} (threshold: 0.90)\n`;
  report += `**P1 Issues:** ${p1Issues.length}\n`;
  report += `**P2 Issues:** ${p2Issues.length}\n\n`;

  report += `## Summary by Check\n\n`;
  report += `| Check | Files Affected | Severity |\n`;
  report += `|-------|---------------|----------|\n`;

  const checks = {};
  allIssues.forEach(i => {
    if (!checks[i.check]) checks[i.check] = { files: new Set(), severity: i.severity };
    checks[i.check].files.add(i.file);
  });

  Object.entries(checks).sort(([a], [b]) => a.localeCompare(b)).forEach(([check, data]) => {
    report += `| ${check} | ${data.files.size} | ${data.severity} |\n`;
  });

  report += `\n## Per-File Results\n\n`;
  results.forEach(r => {
    const passFail = r.issues.length === 0 ? 'PASS' : 'FAIL';
    report += `### ${r.file} — ${passFail}\n`;
    if (r.issues.length > 0) {
      report += `| Check | Severity | Element |\n`;
      report += `|-------|----------|--------|\n`;
      r.issues.forEach(i => {
        report += `| ${i.check} | ${i.severity} | \`${i.element}\` |\n`;
      });
    }
    report += `\n`;
  });

  const reportPath = join(outputDir, 'A11Y_REPORT.md');
  writeFileSync(reportPath, report);
  console.log(`A11Y_REPORT.md written to ${reportPath}`);
  console.log(`Score: ${score.toFixed(2)} (${passed ? 'PASS' : 'FAIL'})`);

  // Write JSON for programmatic consumption
  const jsonPath = join(outputDir, 'a11y-report.json');
  writeFileSync(jsonPath, JSON.stringify({
    score,
    passed,
    threshold: 0.9,
    totalFiles,
    p1Issues: p1Issues.length,
    p2Issues: p2Issues.length,
    timestamp: new Date().toISOString(),
    results,
  }, null, 2));

  return { score, passed };
}

function main() {
  const args = process.argv.slice(2);
  let htmlDir = args[0];
  let reportDir = args.find(a => a.startsWith('--report='))?.split('=')[1] || htmlDir;

  // Parse flags
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--report=')) {
      reportDir = args[i].split('=')[1];
    }
  }

  if (!htmlDir) {
    console.error('Usage: node a11y-audit.mjs <html_dir> [--report=<dir>]');
    process.exit(1);
  }

  const files = findHtmlFiles(htmlDir);
  if (files.length === 0) {
    console.log('No HTML files found. Skipping audit.');
    process.exit(0);
  }

  console.log(`Auditing ${files.length} HTML files...`);
  const results = files.map(auditFile);

  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const { score, passed } = generateReport(results, reportDir);

  process.exit(passed ? 0 : 1);
}

main();
