#!/usr/bin/env node
/**
 * design-snapshot.js
 *
 * Creates a timestamped snapshot of the design HTML directory before overwrites.
 * Also maintains a version history in DESIGN_TOKENS.json.
 *
 * Usage:
 *   node design-snapshot.js <design_dir> [--html-dir <dir>] [--max-snapshots 20]
 *
 * Snapshots are stored at: <design_dir>/.snapshots/<ISO_TIMESTAMP>/
 * Version history is appended to: <design_dir>/DESIGN_TOKENS.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.snapshots') continue; // Don't snapshot snapshots
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function hashDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const hasher = crypto.createHash('sha256');
  const files = fs.readdirSync(dir).sort();
  for (const file of files) {
    hasher.update(file);
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isFile()) {
      hasher.update(fs.readFileSync(fullPath));
    }
  }
  return hasher.digest('hex').slice(0, 12);
}

function main() {
  const args = process.argv.slice(2);
  let designDir = args[0];
  let htmlDir = null;
  let maxSnapshots = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--html-dir' && args[i + 1]) {
      htmlDir = args[++i];
    } else if (args[i] === '--max-snapshots' && args[i + 1]) {
      maxSnapshots = parseInt(args[++i], 10) || 20;
    }
  }

  if (!designDir) {
    console.error('Usage: node design-snapshot.js <design_dir> [--html-dir <dir>]');
    process.exit(1);
  }

  if (!htmlDir) htmlDir = path.join(designDir, 'html');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotDir = path.join(designDir, '.snapshots', timestamp);

  // Copy HTML files
  console.log(`Creating snapshot at ${snapshotDir}...`);
  copyDirSync(htmlDir, snapshotDir);

  // Count files
  const countFiles = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.isFile()) count++;
        else if (entry.isDirectory() && entry.name !== '.snapshots') walk(path.join(d, entry.name));
      }
    };
    walk(dir);
    return count;
  };

  const fileCount = countFiles(snapshotDir);
  console.log(`Copied ${fileCount} files to snapshot.`);

  // Compute hashes
  const htmlHash = hashDir(htmlDir);
  const tokensHash = hashFile(path.join(designDir, 'DESIGN_TOKENS.json'));
  const systemHash = hashFile(path.join(designDir, 'DESIGN_SYSTEM.md'));

  // Update DESIGN_TOKENS.json version history
  const tokensPath = path.join(designDir, 'DESIGN_TOKENS.json');
  let tokens = {};
  if (fs.existsSync(tokensPath)) {
    try { tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8')); } catch {}
  }

  tokens._meta = tokens._meta || {};
  tokens._meta.last_updated = new Date().toISOString();
  tokens._meta.iteration = (tokens._meta.iteration || 0) + 1;

  const history = tokens._meta.version_history || [];
  history.push({
    timestamp,
    iteration: tokens._meta.iteration,
    html_hash: htmlHash,
    tokens_hash: tokensHash,
    system_hash: systemHash,
    file_count: fileCount,
  });

  // Trim old snapshots
  while (history.length > maxSnapshots) {
    const oldest = history.shift();
    const oldDir = path.join(designDir, '.snapshots', oldest.timestamp);
    if (fs.existsSync(oldDir)) {
      fs.rmSync(oldDir, { recursive: true, force: true });
      console.log(`Pruned old snapshot: ${oldest.timestamp}`);
    }
  }

  tokens._meta.version_history = history;
  fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
  console.log(`Updated DESIGN_TOKENS.json (iteration ${tokens._meta.iteration}).`);

  // Write snapshot metadata
  const metaPath = path.join(snapshotDir, 'SNAPSHOT_META.json');
  fs.writeFileSync(metaPath, JSON.stringify({
    timestamp,
    iteration: tokens._meta.iteration,
    html_hash: htmlHash,
    tokens_hash: tokensHash,
    system_hash: systemHash,
    file_count: fileCount,
    parent_dir: htmlDir,
  }, null, 2));

  console.log('Snapshot complete.');
}

if (require.main === module) {
  main();
}

module.exports = { main, hashDir, hashFile };
