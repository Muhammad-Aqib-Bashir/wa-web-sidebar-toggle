#!/usr/bin/env node
// scripts/build.js — cross-platform build script (Node.js only, no shell deps)
//
// What it does:
//   1. Reads the version from manifest.json (the single source of truth)
//   2. Syncs icons/ → docs/icons/ so GitHub Pages can serve them as favicons
//   3. Collects all files Chrome needs into a zip
//   4. Validates that every file referenced in manifest.json is actually
//      present in the zip — fails the build if anything is missing, so a
//      broken package can never reach the Chrome Web Store silently
//   5. Writes dist/wa-web-sidebar-toggle-vX.Y.Z.zip
//
// Runs identically on Linux, macOS, and Windows — no bash, zip, or cp required.
"use strict";

const fs = require("fs");
const path = require("path");
const yazl = require("yazl");

const ROOT_DIR = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "dist");

// Everything Chrome needs in the published extension.
// manifest.json and background.js are single files; the rest are directories.
const INCLUDE_PATHS = [
  "manifest.json",
  "src",
  "icons",
  "popup",
  "welcome",
  "background.js",
];

// Files to silently skip anywhere in the tree.
const EXCLUDE_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

/* ── Helpers ───────────────────────────────────────────────────── */

function readManifest() {
  const manifestPath = path.join(ROOT_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error('manifest.json is missing a "version" field');
  }
  return manifest;
}

// Recursively walks realPath and pushes [absolutePath, zipPath] tuples.
// Handles both single files (e.g. "manifest.json") and directories.
function collectEntries(realPath, zipRelativePath, entries) {
  if (EXCLUDE_NAMES.has(path.basename(realPath))) return;

  const stat = fs.statSync(realPath);

  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(realPath)) {
      collectEntries(
        path.join(realPath, child),
        `${zipRelativePath}/${child}`,
        entries,
      );
    }
  } else if (stat.isFile()) {
    entries.push([realPath, zipRelativePath]);
  }
}

// Copies every file from icons/ into docs/icons/ using Node's fs so this
// works on Windows without needing cp/rsync.
function syncDocIcons() {
  const srcDir = path.join(ROOT_DIR, "icons");
  const destDir = path.join(ROOT_DIR, "docs", "icons");

  fs.mkdirSync(destDir, { recursive: true });

  for (const file of fs.readdirSync(srcDir)) {
    if (EXCLUDE_NAMES.has(file)) continue;
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
    }
  }

  console.log("Synced icons/ → docs/icons/");
}

// Cross-checks that every file manifest.json references is present in the
// zip entries we collected. Fails the build before writing the zip so a
// broken package can never reach the Chrome Web Store.
function validateEntries(manifest, zipEntryPaths) {
  const inZip = new Set(zipEntryPaths);
  const missing = [];

  // background service worker
  if (manifest.background?.service_worker) {
    if (!inZip.has(manifest.background.service_worker)) {
      missing.push(
        `background.service_worker: "${manifest.background.service_worker}"`,
      );
    }
  }

  // content scripts
  for (const cs of manifest.content_scripts || []) {
    for (const f of [...(cs.js || []), ...(cs.css || [])]) {
      if (!inZip.has(f)) missing.push(`content_scripts file: "${f}"`);
    }
  }

  // action popup
  if (manifest.action?.default_popup) {
    if (!inZip.has(manifest.action.default_popup)) {
      missing.push(`action.default_popup: "${manifest.action.default_popup}"`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\nZip validation failed — manifest.json references these files\n` +
        `but they are not in the zip (not committed to git?):\n\n` +
        `  ${missing.join("\n  ")}\n\n` +
        `Fix: git add <file> && git commit, then rebuild.\n`,
    );
  }

  console.log(`Validated — all manifest-referenced files present in zip.`);
}

/* ── Main ──────────────────────────────────────────────────────── */

function build() {
  const manifest = readManifest();
  const version = manifest.version;
  const outFile = path.join(OUT_DIR, `wa-web-sidebar-toggle-v${version}.zip`);

  // 1. Sync docs icons (cross-platform cp)
  syncDocIcons();

  // 2. Prepare output directory
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(outFile)) fs.rmSync(outFile);

  // 3. Collect all files to zip
  const entries = [];
  for (const includePath of INCLUDE_PATHS) {
    const realPath = path.join(ROOT_DIR, includePath);
    if (!fs.existsSync(realPath)) {
      // Hard error — a missing file means the extension package will be
      // invalid. Chrome rejects zips where manifest.json references a
      // file that isn't present (background service_worker, content
      // scripts, popup). Better to fail the build than ship a broken zip.
      throw new Error(
        `Required path not found: ${includePath}\n` +
          `Make sure it is committed to git: git ls-files ${includePath}`,
      );
    }
    collectEntries(realPath, includePath.split(path.sep).join("/"), entries);
  }

  // 4. Validate before writing — check every manifest reference is present
  validateEntries(
    manifest,
    entries.map(([, zipPath]) => zipPath),
  );

  // 5. Write the zip
  const zipfile = new yazl.ZipFile();
  for (const [realPath, zipRelativePath] of entries) {
    zipfile.addFile(realPath, zipRelativePath);
  }

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outFile);
    writeStream.on("close", () => resolve(outFile));
    writeStream.on("error", reject);
    zipfile.outputStream.on("error", reject);
    zipfile.outputStream.pipe(writeStream);
    zipfile.end();
  });
}

build()
  .then((outFile) => {
    const rel = path.relative(ROOT_DIR, outFile);
    const size = (fs.statSync(outFile).size / 1024).toFixed(1);
    console.log(`\nBuilt ${rel} (${size} KB)`);
  })
  .catch((err) => {
    console.error("\nBuild failed:", err.message);
    process.exit(1);
  });
