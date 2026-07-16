#!/usr/bin/env node
// scripts/version.js — bump manifest.json version, commit, and tag.
//
// Usage:  node scripts/version.js <major|minor|patch>
//   or:   npm run release:patch
//
// The tag push is intentionally left to you:
//   git push && git push origin vX.Y.Z
// Pushing the tag is what triggers the Release workflow — keeping it
// separate means you can review the commit before anything goes public.
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

/* ── Config ─────────────────────────────────────────────────────── */

const VALID_PARTS = ["major", "minor", "patch"];
const part = process.argv[2];

if (!VALID_PARTS.includes(part)) {
  console.error(`Usage: node scripts/version.js <${VALID_PARTS.join("|")}>`);
  process.exit(1);
}

/* ── Helpers ─────────────────────────────────────────────────────── */

// Run a shell command, streaming output. Throws on non-zero exit.
function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

// Return stdout of a command as a trimmed string, or "" on error.
// Never throws — used for status checks.
function query(cmd) {
  const result = spawnSync(cmd, { shell: true, encoding: "utf8" });
  return (result.stdout || "").trim();
}

// True if there are staged or unstaged changes to tracked files.
function hasUncommittedChanges() {
  return query("git status --porcelain") !== "";
}

// True if the tag exists locally.
function tagExists(tag) {
  return query(`git tag -l "${tag}"`) === tag;
}

/* ── Main ────────────────────────────────────────────────────────── */

const manifestPath = path.join(__dirname, "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const current = manifest.version;

const [major, minor, patch] = current.split(".").map(Number);
const next =
  part === "major"
    ? `${major + 1}.0.0`
    : part === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

const tag = `v${next}`;

console.log(`\nCurrent version : ${current}`);
console.log(`Next version    : ${next}`);
console.log(`Tag             : ${tag}\n`);

// ── Guard: already at target version ─────────────────────────────
// Happens when a previous run bumped the manifest but crashed before
// tagging. In that case skip the bump+commit and jump to tagging.
if (current === next) {
  console.log("manifest.json is already at this version — skipping bump.");
} else {
  // ── Guard: uncommitted changes ──────────────────────────────────
  // A dirty working tree would pollute the release commit.
  if (hasUncommittedChanges()) {
    console.error(
      "Error: you have uncommitted changes.\n" +
        "Commit or stash them before releasing.",
    );
    process.exit(1);
  }

  // ── Bump manifest.json ──────────────────────────────────────────
  manifest.version = next;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  run("git add manifest.json");
  run(`git commit -m "chore(release): ${tag}"`);
  console.log("");
}

// ── Guard: tag already exists ───────────────────────────────────
// Can happen if the commit succeeded but the tag line crashed, or if
// the script is run twice. Offer to reuse the existing tag instead of
// hard-failing so a retry is painless.
if (tagExists(tag)) {
  console.log(`Tag ${tag} already exists locally.`);
  console.log("If it has not been pushed yet, just run:\n");
  console.log(`  git push && git push origin ${tag}\n`);
  console.log(
    "If it was already pushed and the workflow ran, " +
      "you are already done.\n",
  );
  process.exit(0);
}

// ── Create tag ───────────────────────────────────────────────────
run(`git tag ${tag}`);

console.log(`\n✓ Bumped to ${tag}.`);
console.log("\nPush with:\n");
console.log(`  git push && git push origin ${tag}\n`);
console.log(
  "Pushing the tag triggers the Release workflow (build → publish → GitHub Release).\n",
);
