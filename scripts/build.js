#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const yazl = require("yazl");

const ROOT_DIR = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT_DIR, "dist");

const INCLUDE_PATHS = ["manifest.json", "src", "icons", "popup"];
const EXCLUDE_NAMES = new Set([".DS_Store", "Thumbs.db"]);

function readManifestVersion() {
  const manifestPath = path.join(ROOT_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error('manifest.json is missing a "version" field');
  }
  return manifest.version;
}

function collectEntries(realPath, zipRelativePath, entries) {
  const baseName = path.basename(realPath);
  if (EXCLUDE_NAMES.has(baseName)) return;

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

function build() {
  const version = readManifestVersion();
  const outFile = path.join(OUT_DIR, `wa-web-sidebar-toggle-v${version}.zip`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (fs.existsSync(outFile)) fs.rmSync(outFile);

  const entries = [];
  for (const includePath of INCLUDE_PATHS) {
    const realPath = path.join(ROOT_DIR, includePath);
    collectEntries(realPath, includePath.split(path.sep).join("/"), entries);
  }

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
    console.log(`Built ${path.relative(ROOT_DIR, outFile)}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
