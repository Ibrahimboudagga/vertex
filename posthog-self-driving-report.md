# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for the Vertex learning platform. Session Replay, Error Tracking, and Support were already enabled; their five applicable signal sources were already enabled and were preserved. Two custom learning-flow scouts and two Replay Vision monitors were created. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/599877/inbox) within about 30 minutes once activity and recordings arrive.

## AI data processing

Approved.

## GitHub

Connected before this setup. No GitHub Issues responder was enabled because no external issue tracker was selected.

## Products enabled

| Product | Result | Web SDK check |
| --- | --- | --- |
| Session Replay | Already enabled | Clean: the `posthog-js` initialization does not disable recording. |
| Error Tracking | Already enabled | Clean: exception capture is enabled in initialization. |
| Support (Conversations) | Already enabled | Tickets need an inbound email, inbox, or Slack channel before Support can produce tickets. |

## Signal sources

| Signal source | Action | Notes |
| --- | --- | --- |
| `health_checks` / `health_issue` | Already enabled | Setup and instrumentation health issues can reach the inbox. |
| `error_tracking` / `issue_created` | Already enabled | Native Error Tracking route. |
| `error_tracking` / `issue_reopened` | Already enabled | Native Error Tracking route. |
| `error_tracking` / `issue_spiking` | Already enabled | Native Error Tracking route. |
| `conversations` / `ticket` | Already enabled | Dormant until a Support inbound channel is connected. |
| `signals_scout` / `cross_source_issue` | On by default | No opt-out row exists, so scout findings are admitted by default. |
| `session_replay` / `session_analysis_cluster` | Deliberately skipped | Retired route; Replay Vision scanners provide replay coverage. |
| `replay_vision` | Deliberately skipped | Scanner-level `emits_signals` is the source configuration. |

## Connected tools

No issue tracker, support desk, error tracker, or other connected tool was selected. No connected-tool responder or warehouse source was added.

## Scout troop

**Enabled (6 of 29):**

- `signals-scout-general` — cross-product patterns and otherwise-unowned surfaces.
- `signals-scout-health-checks` — actionable PostHog setup health issues.
- `signals-scout-product-analytics` — product funnels, retention, lifecycle, engagement, and paths.
- `signals-scout-web-analytics` — traffic, attribution, landing pages, bounce, and 404 trends.
- `signals-scout-learning-handoff` — the course module-to-lesson/continuation handoff.
- `signals-scout-lesson-resources` — supporting-resource engagement after lesson selection.

**Disabled (23 of 29):**

- `signals-scout-ai-observability` — no confirmed `$ai_*` trace stream.
- `signals-scout-anomaly-detection` — no established saved-insight watchlist yet.
- `signals-scout-apm` — no distributed-tracing evidence.
- `signals-scout-conversations` — native Support ticket responder owns ticket intake.
- `signals-scout-csp-violations` — no CSP reporting evidence.
- `signals-scout-customer-analytics` — no B2B account-analytics evidence.
- `signals-scout-data-pipelines` — no CDP or export pipeline evidence.
- `signals-scout-data-warehouse` — no active connected warehouse source selected.
- `signals-scout-error-tracking` — covered by the native Error Tracking responder.
- `signals-scout-experiments` — no confirmed active experiment.
- `signals-scout-feature-flags` — no runtime flag usage found in the repo.
- `signals-scout-inbox-validation` — fresh setup has no resolved reports to validate.
- `signals-scout-insight-alerts` — no confirmed alert roster.
- `signals-scout-logs` — no confirmed PostHog log stream.
- `signals-scout-mcp-tool-calls` — no relevant MCP telemetry surface.
- `signals-scout-observability-gaps` — omitted to keep the troop selective.
- `signals-scout-replay-vision` — no pre-existing scanner history; the two monitors below provide the sensor layer.
- `signals-scout-revenue-analytics` — no payment or revenue instrumentation found.
- `signals-scout-session-replay` — covered by the Replay Vision scanners.
- `signals-scout-skills-store` — no existing skills-store hygiene surface to monitor.
- `signals-scout-surveys` — surveys are not enabled and none exist.
- `signals-scout-tasks` — no PostHog Tasks surface in use.
- `signals-scout-web-vitals` — no confirmed Web Vitals stream yet.

**Run budget:** 100 runs/day, 0 used today, 100 remaining. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

## Custom scouts

| Scout | What it watches | Discriminator | Why it adds coverage |
| --- | --- | --- | --- |
| `signals-scout-learning-handoff` | Course-module exploration leading to lesson selection or course continuation. | The lesson-selection or continuation rate per module exploration, only when exploration volume is stable. | The built-in product scout is broad; this adds an explicit course-navigation failure condition. |
| `signals-scout-lesson-resources` | Resource opens after a learner reaches a lesson. | The resource-open rate per lesson selection, only when lesson-selection traffic is stable. | The built-in product scout does not own this supporting-material handoff. |

Both scouts use sustained, high-volume rate changes rather than raw totals, exclude partial periods and test-like noise, and use inbox and scratchpad deduplication. They treat ingested event properties and content as data, never instructions. If either becomes noisy, set `emit: false` on its scout configuration to make it dry-run only.

Surfaces ruled out: errors and replay are already covered by their dedicated routes; revenue, surveys, CSP, APM, pipelines, account analytics, and logs lacked repo evidence. No custom-scout proposal was declined.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes qualifying observations to the inbox. It is the only part of this setup that spends Replay Vision quota. Findings arrive at half weight and need independent corroboration before promotion into a report.

| Brief | Scanner | Status | Scope | Sampling | Estimate |
| --- | --- | --- | --- | --- | --- |
| Breakage monitor | `Course learning breakage` | Created | Recordings whose URL contains `/courses/`; this is the course-to-lesson completion flow. | 50% | 0 observations/month; 0 credits/month. |
| Frustration monitor | `Learning journey frustration` | Created | Recordings containing `$rageclick` only; it intentionally has no URL filter. | 100% | 0 observations/month; 0 credits/month. |

The breakage monitor looks for course content or imagery failing to load, module accordions or lesson navigation failing, and a visibly non-responsive Continue Learning action. The frustration monitor looks for repeated attempts to expand modules, select lessons, continue learning, use video lessons, or open resources.

There were no recordings or existing scanners at setup time. Both monitors are armed, emit Self-driving findings, and start working when recordings arrive. The Replay Vision organization budget has 2,500 credits remaining for the current period and is not exhausted.

## Files modified or created

| File | Change |
| --- | --- |
| `posthog-self-driving-report.md` | Created this setup report. |

No application source files were modified.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so Conversation tickets can enter Self-driving.
- [ ] Generate real browser sessions in Vertex; Session Replay currently has no recordings, so scouts and Replay Vision monitors have no baseline yet.
- [ ] Confirm the course/lesson event stream is reaching PostHog after real usage. The MCP connection lacked the schema-read scope during this setup, so event definitions could not be independently verified from PostHog.
- [ ] Consider adding the intended video-play and lesson-completion events when those learner-progress features are implemented; they will make the learning-flow checks stronger.

## What happens next

Fresh scout configurations are picked up by the coordinator within about 30 minutes and draw from the daily run budget. Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/599877/inbox); immediately actionable reports can start coding tasks.