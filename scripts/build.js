#!/usr/bin/env node
// scripts/build.js — cross-platform build script (Node.js only, no shell deps)
//
// What it does:
//   1. Reads the version from manifest.json (the single source of truth)
//   2. Syncs icons/ → docs/icons/ so GitHub Pages can serve them as favicons
//      (docs/ is the GitHub Pages root; icons that live at the repo root are
//      unreachable to a browser unless copied inside docs/)
//   3. Zips exactly the files Chrome needs into dist/wa-web-sidebar-toggle-vX.Y.Z.zip
//
// Runs identically on Linux, macOS, and Windows — no bash, zip, or cp required.
"use strict";

const fs = require("fs");
const path = require("path");
const yazl = require("yazl");

const ROOT_DIR = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "dist");

// Everything Chrome needs in the published extension.
const INCLUDE_PATHS = [
  "manifest.json",
  "background.js",
  "src",
  "icons",
  "popup",
  "welcome",
];

// Files to silently skip anywhere in the tree.
const EXCLUDE_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

/* ── Helpers ───────────────────────────────────────────────────── */

function readManifestVersion() {
  const manifestPath = path.join(ROOT_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error('manifest.json is missing a "version" field');
  }
  return manifest.version;
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
// works on Windows without needing cp/rsync. docs/icons/ is the path that
// docs/index.html and docs/privacy-policy/index.html reference as favicons
// and logo images when served by GitHub Pages (which treats /docs as root).
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

/* ── Main ──────────────────────────────────────────────────────── */

function build() {
  const version = readManifestVersion();
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
      console.warn(`Warning: ${includePath} not found — skipping`);
      continue;
    }
    // Normalise path separators to forward slashes for zip compatibility
    collectEntries(realPath, includePath.split(path.sep).join("/"), entries);
  }

  // 4. Write the zip
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
    console.log(`Built ${rel} (${size} KB)`);
  })
  .catch((err) => {
    console.error("Build failed:", err.message);
    process.exit(1);
  });
