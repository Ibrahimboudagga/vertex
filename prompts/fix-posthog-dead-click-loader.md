# Stop the PostHog dead-clicks loader console error

## Goal

Prevent the browser console error emitted when PostHog cannot load its optional dead-click autocapture script, without disabling Vertex analytics, exception capture, or the learning events implemented in the PostHog analytics feature.

## Evidence and root cause

- The user’s console trace ends in PostHog’s `dead-clicks-autocapture` extension and `external-scripts-loader`.
- Vertex initializes `posthog-js` in `instrumentation-client.ts` with no explicit `capture_dead_clicks` setting.
- The installed SDK’s `isDeadClicksEnabledForAutocapture()` enables the feature when its remote configuration stores `captureDeadClicks`; it then asks the external script loader for `dead-clicks-autocapture`.
- The SDK injects a separate static dependency for that feature. On the local Vertex page, the PostHog asset URL was successfully injected and loaded from `us-assets.i.posthog.com`, and the local browser console contained no PostHog error.
- Therefore the application’s PostHog host and analytics initialization are valid. The reported failure is specific to the user’s browsing environment—commonly a privacy shield, content blocker, or network policy blocking the optional static asset.
- PostHog’s current JavaScript configuration documents `capture_dead_clicks` as an optional boolean/object setting that defaults to enabled. Setting it to `false` explicitly disables the feature and prevents its loader from running.

## Verification result and revised root cause

The first minimal change, `capture_dead_clicks: false`, was applied and the local app reloaded. The `dead-clicks-autocapture.js` asset was still injected, so the direct dead-click configuration is not the complete source.

The installed SDK's `Heatmaps` extension independently constructs a `DeadClicksAutocapture` instance whenever heatmaps are enabled. Its `isEnabled` logic gives an explicit `capture_heatmaps: false` setting precedence over the project remote configuration. Vertex has no heatmap feature requirement, so the only complete, targeted fix is to opt out of both optional collectors.

## Revised decision

Set both `capture_dead_clicks: false` and `capture_heatmaps: false` in the existing `posthog.init()` configuration.

Dead-click detection and heatmaps are not Vertex product requirements. The change keeps all custom search, result-open, video play/watch-depth/resume/completion, resource, bookmark, and navigation events. It also preserves the existing exception capture setting and automatic page events.

## Files expected to change

- `instrumentation-client.ts`
- `prompts/fix-posthog-dead-click-loader.md`

## Requirements

- Do not change the PostHog project token, host, server analytics client, or environment variables.
- Do not disable `capture_exceptions`.
- Do not disable `capture_exceptions`, custom event capture, or automatic page events.
- Do not disable custom analytics, automatic page views, or YouTube lesson telemetry.
- Do not modify unrelated user work, including `next-env.d.ts`, design references, ingestion files, or reports.
- Add only the single, documented SDK option needed to prevent this optional external dependency from loading.

## Acceptance criteria

- PostHog is still initialized when its public environment variables are configured.
- Neither the Heatmaps collector nor the dead-clicks extension is requested by the browser after a reload.
- The console no longer contains `[PostHog.js] [Dead Clicks] failed to load script`.
- Existing PostHog events and exception capture remain enabled.

## Checks

1. `npx tsc --noEmit`.
2. `npm run lint`.
3. Start or reuse the dev server and reload a Vertex page.
4. Inspect script resources and browser console: no `dead-clicks-autocapture.js` request and no dead-click loader error.
5. Confirm `instrumentation-client.ts` still includes `capture_exceptions: true` and that PostHog remains configured.
