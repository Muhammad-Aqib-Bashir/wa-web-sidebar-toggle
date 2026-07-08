#!/usr/bin/env node
// Bumps the version in manifest.json (the single source of truth - Chrome
// reads it, not package.json), commits it, and tags the commit so the
// release workflow has something to trigger on.
//
// Usage: node scripts/version.js <major|minor|patch>

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const VALID_PARTS = ["major", "minor", "patch"];
const part = process.argv[2];

if (!VALID_PARTS.includes(part)) {
  console.error(`Usage: node scripts/version.js <${VALID_PARTS.join("|")}>`);
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

const manifestPath = path.join(__dirname, "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const [major, minor, patch] = manifest.version.split(".").map(Number);
const next =
  part === "major"
    ? `${major + 1}.0.0`
    : part === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

manifest.version = next;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

run("git add manifest.json");
run(`git commit -m "chore(release): v${next}"`);
run(`git tag v${next}`);

console.log(
  `\nBumped manifest.json to v${next}.\n\nNow push it:\n  git push && git push origin v${next}\n\nPushing the tag is what triggers the Release workflow.\n`,
);
