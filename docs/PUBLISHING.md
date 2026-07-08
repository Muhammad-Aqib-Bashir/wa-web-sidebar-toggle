# Publishing releases

Releases are automated via GitHub Actions: pushing a `vX.Y.Z` tag builds the extension, uploads it to the Chrome Web Store, publishes it, and creates a matching GitHub release. This doc covers the one-time setup that automation can't do for you, plus the day-to-day release flow once it's set up.

## One-time setup

### 1. Publish the extension manually, once

The Chrome Web Store API can only *update* an extension that already exists — Google requires the first submission (store listing, screenshots, privacy practices, icon, etc.) to go through the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) by hand. Do that first if you haven't already; you'll get a 32-character **extension ID** out of it, which you'll need below.

### 2. Create Google OAuth credentials

The upload API authenticates as you, via OAuth, not via the extension's own identity. The package this workflow uses ([`chrome-webstore-upload-cli`](https://github.com/fregante/chrome-webstore-upload-cli)) has a maintained walkthrough for this — follow its ["How to generate Google API keys"](https://github.com/fregante/chrome-webstore-upload/blob/main/How%20to%20generate%20Google%20API%20keys.md) guide. Broadly, it has you:

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/) and enable the **Chrome Web Store API**.
2. Create an OAuth **Client ID** (type: Desktop app) → gives you a `CLIENT_ID` and `CLIENT_SECRET`.
3. Use the OAuth Playground (or the script in the guide) to exchange that for a `REFRESH_TOKEN`.
4. Note your **Publisher ID** from the Developer Dashboard URL while logged in.

Credential setup steps for third-party APIs occasionally change on Google's end — if anything above looks out of date, the linked guide is the source of truth.

### 3. Add the secrets to GitHub

In your repo: **Settings → Secrets and variables → Actions → New repository secret**. Add all five:

| Secret name | Value |
|---|---|
| `CWS_EXTENSION_ID` | The 32-character ID from step 1 |
| `CWS_CLIENT_ID` | From step 2 |
| `CWS_CLIENT_SECRET` | From step 2 |
| `CWS_REFRESH_TOKEN` | From step 2 |
| `CWS_PUBLISHER_ID` | From step 2 |

That's it — this only needs to be done once per repo.

## Releasing a new version

1. Make sure `main` is in the state you want to ship.
2. Bump the version and tag it in one step:
   ```bash
   npm run release:patch   # 0.2.0 -> 0.2.1, bug fixes
   npm run release:minor   # 0.2.0 -> 0.3.0, new features
   npm run release:major   # 0.2.0 -> 1.0.0, breaking changes
   ```
   This updates `manifest.json`, commits it as `chore(release): vX.Y.Z`, and creates a matching git tag — manifest version and tag are guaranteed to match because the same script writes both.
3. Push both the commit and the tag:
   ```bash
   git push && git push origin vX.Y.Z
   ```
4. Pushing the tag triggers the **Release** workflow, which builds, verifies the tag matches `manifest.json`, uploads to the Chrome Web Store, publishes it, and attaches the built `.zip` to a new GitHub release.

A normal `git push` (without a tag) never publishes anything — only pushing a `v*.*.*` tag does. The **CI** workflow runs on every push/PR regardless, but only validates and builds; it never touches the Chrome Web Store.

## Notes

- Chrome Web Store reviews can take anywhere from a few hours to a few days for substantial changes; the workflow finishing successfully means the update was *submitted*, not necessarily that it's already live for users.
- If `npx chrome-webstore-upload-cli` ever changes its required flags/env vars in a future major version, check its README before assuming `release.yml` is still accurate — pin a specific version in `package.json` if you want to control upgrades deliberately.
