# Dynatrace Assist — Prompt Library

**Validated against:** Dynatrace demo tenant `guu84124` (demo.apps.dynatrace.com) · **Last validated:** 2026-07-29
**Companion to:** the Dynatrace Assist enablement deck and cheatsheets.

Every prompt is copy-ready. Legend:

| Mark | Meaning |
|---|---|
| ✅ | Validated live against the demo tenant — expected answer summarized |
| ▶ | Pattern-verified — follows the exact shape of a validated prompt |

---

## How to use this library — the two prompt modes

Dynatrace Assist answers in one of two modes. Know which one you're firing:

| Mode | What you ask | What you get |
|---|---|---|
| **Teach me** (knowledge) | "How do I…", "Explain…", "What should I check…" | Step-by-step guidance grounded in docs + community, **with source links** |
| **Show me my data** (query) | "Top N … sorted by … in the last X hours" | A generated DQL query and, when executed, **live numbers from your tenant** |

Rules that made the difference during validation:

1. **Name the entity** — "checkout-service", not "my app."
2. **Always give a timeframe** — "last 2 hours", "last 24h." Unscoped event queries can silently return nothing.
3. **Use Dynatrace nouns** — problems, failure rate, vulnerabilities, DPS, Smartscape.
4. **Ask for a shape, not a vibe** — "top 5 … sorted by …" works; "is my system healthy?" doesn't.
5. **One question per prompt** — compound phrasing ("… excluding duplicates, sorted by affected entities") *failed* the query generator twice during validation; the simple version succeeded.
6. **Iterate** — if generation fails, simplify and retry. It's a conversation.
7. **End on the "so what"** — follow any data answer with *"…and what should I do about it?"*
8. **Never paste secrets or PII** · keep prompts under 10,000 characters.

---

## 1 · Problem & incident troubleshooting

**✅ Summarize the top problem**
```
Summarize the most impactful active problem in my environment right now.
What is affected and what should I check first?
```
*Expect:* prioritization guidance via the Problems app — root cause marker, affected entities, log perspective, deployment context — with docs sources.

**✅ Live problem counts (query mode)**
```
Active problems in the last 24 hours
```
*Expect:* generated DQL (`fetch dt.davis.problems … | filter event.status == "ACTIVE"`). Executed live: API gateway errors (129), AWS Lambda error rate (88), network monitor violations (60)…
⚠ The compound version *"…excluding duplicates, sorted by count of affected entities"* **fails** the generator — keep it simple, then refine in follow-ups.

**▶ Explain a specific problem**
```
Explain problem P-XXXXXXXX: what does it mean, what is the likely root cause,
and what are the recommended next steps?
```

**▶ First-line triage of an error string**
```
A pod shows "Back-off restarting failed container". Explain what it means,
the common root causes, and what I should check first.
```
*(Validated in an earlier session — returns meaning, ranked causes, ordered checklist.)*

**▶ Deployment correlation**
```
My service's failure rate spiked after a release. How do I correlate it with
recent deployment events, dependency problems, and error logs?
```

---

## 2 · Root cause analysis

**✅ Guided RCA walkthrough**
```
How do I perform a root cause analysis for a recurring high failure rate
problem on a service? Walk me through the investigation path step by step.
```
*Expect:* a 9-step path — Failure Analysis page → filters → failure details → downstream dependencies → database failures → contextual logs → events/changes correlation → root-cause validation → comparison mode.

**✅ Understand (and trust) Davis RCA**
```
Explain how Davis AI determines the root cause of a problem, and how I can
see the evidence behind a root cause claim for a specific problem.
```
*Expect:* fault-tree analysis explanation + where the evidence lives (root-cause markers, event timelines, preview charts, linked logs). Great for building trust with skeptical teams.

**▶ Postmortem draft**
```
Summarize the root cause, timeline, and business impact of problem P-XXXXXXXX
in a format I can paste into a post-incident review.
```

---

## 3 · Entity correlation & blast radius

**✅ Blast radius of a host failure**
```
Which services depend on host <host-name>, and what would be the blast radius
if that host fails? How do I see upstream and downstream dependencies?
```
*Expect:* Smartscape topology guidance **plus a ready-to-run `smartscapeNodes` traversal query** (host → pods → services, ranked by affected pods), plus Service Flow / Backtrace pointers. One of the strongest validated answers.

**▶ Service dependency map**
```
Show me the upstream and downstream dependencies of service <service-name>
and explain which ones are critical for availability.
```

**▶ Runbook rehearsal**
```
What are the upstream and downstream impacts if <service-name> fails?
I want to pressure-test our incident runbook before an incident.
```

---

## 4 · Monitoring blindspots & coverage gaps

**✅ Find the gaps**
```
How do I find monitoring blindspots in my environment — hosts without
OneAgent, services without log ingestion, or applications without RUM?
```
*Expect:* per-gap checklist — unmonitored-hosts view, log viewer sources + OneAgent log module, RUM enablement + injection diagnostics, Smartscape gaps, monitoring coverage settings.

**▶ Unmonitored candidates (query mode)**
```
Which hosts are monitoring candidates without OneAgent installed?
```

**▶ Silent SLIs**
```
How do I get alerted when a critical metric or SLI stops reporting data?
```

---

## 5 · License usage & cost intelligence (DPS)

**✅ Consumption breakdown + chargeback**
```
How do I analyze my Dynatrace Platform Subscription consumption? Which
capabilities consume the most, and how can I break down cost by application
or team for chargeback?
```
*Expect:* Account Management → Cost and Usage Analysis, usage dashboards, DQL on billing events (`event.kind == "BILLING_USAGE_EVENT"` grouped by cost-allocation tags), chargeback export paths.

**▶ Top consumers (query mode)**
```
Which hosts ingested the most log data in the last 7 days?
```

**▶ Cost driver hunt**
```
My DPS consumption increased this month. How do I find which capability
and which entities drove the increase?
```

---

## 6 · Configuration gaps & audit

**✅ Config audit sweep**
```
How do I audit configuration gaps in my environment — missing anomaly
detection tuning, alerting profiles that notify nobody, or settings changed
recently that I should review?
```
*Expect:* anomaly-detection API review, alerting-profile assignment check, **audit log** under Settings → Preferences, config-as-code drift comparison, missing-data alerts for SLIs.

**▶ Alert noise tuning**
```
One service generates too many alerts. How do I reduce overalerting and tune
anomaly detection so I only get meaningful problems?
```
*(Validated in an earlier session — returns cited, step-by-step tuning guidance.)*

**▶ Recent changes review**
```
What configuration settings changed in my environment in the last 7 days,
and how do I review who changed them?
```

---

## 7 · Gen3 (new Dynatrace) adoption

**✅ Adoption tracking**
```
How can I track adoption of the new Dynatrace experience in my organization —
which apps are used the most, who are the most active users, and who is still
on the classic experience?
```
*Expect:* **Lens → Adoption** — user activity chart, feature usage chart, classic-vs-Gen3 comparison for targeting training.

**▶ Onboarding by conversation**
```
I'm new to this environment. What are the key services, how do they depend
on each other, and where should I start exploring?
```

**▶ Learn the data model**
```
Explain the difference between logs, spans, events, and metrics in Grail,
and when I should query each one.
```

---

## 8 · Security findings & vulnerabilities

**✅ Prioritize what matters**
```
What are my most critical vulnerabilities right now? How do I prioritize
them by risk — internet exposure, reachable data assets, public exploit
availability — and see which are actively being targeted?
```
*Expect:* Vulnerabilities app filters, **Davis Security Score** (CVSS + runtime context), CISA KEV catalog filter, Security Advisor remediation steps.

**✅ Live vulnerability data (query mode)**
```
Top 10 vulnerabilities by risk score
```
*Expect:* generated DQL against vulnerability state report events.
⚠ **Demo-tenant catch, worth teaching:** the generated query targets `fetch events` and returned **0 records**; the security data actually lives in the **`security.events`** table (validated live: 3.1M `VULNERABILITY_STATE_REPORT_EVENT` records there). If a security query returns nothing, re-ask with *"…from the security.events table"* — and always add a timeframe.

**▶ Compliance posture**
```
Summarize my latest compliance findings and which rules fail most often.
```

**▶ Third-party exposure**
```
Which of my services use a library affected by CVE-XXXX-XXXXX, and are any
of them exposed to the internet?
```

---

## 9 · Kubernetes

**✅ OOMKill investigation**
```
A Kubernetes pod keeps restarting with OOMKilled events. How do I investigate
this and find which workloads are affected and whether memory limits are
misconfigured?
```
*Expect:* Kubernetes app workload view → Problems section → Utilization tab (usage vs limits) → Events tab sequence → limit remediation.

**▶ Cluster health sweep**
```
How do I assess the overall health of my Kubernetes cluster and find nodes
under resource pressure?
```

**▶ Live workload data (query mode)**
```
Top 10 Kubernetes workloads by memory usage in the last 2 hours
```

---

## 10 · Predictive & capacity

**✅ Disk saturation forecast**
```
How can I forecast disk usage for my hosts and get alerted before disks run
full? Can Davis AI predict capacity saturation?
```
*Expect:* forecast workflow recipe — Analyze-data action on `dt.host.disk.free`, threshold check via JavaScript action, Davis problem/Slack alert, plus auto-adaptive anomaly detection for sudden changes.

**▶ Capacity trend (query mode)**
```
Show the disk usage trend for my top 5 hosts over the last 7 days
```

---

## 11 · SLOs & reliability

**✅ SLO design from scratch**
```
Help me define an SLO for a checkout service: which SLI should I pick,
what is a reasonable target, and how do I measure it in Dynatrace?
```
*Expect:* SLI options (success rate, latency, availability), realistic targets (99.9% / 30 days), and the SLO wizard path with concrete metrics.

**✅ Live failure-rate data (query mode)**
```
Top 10 services by failure rate in the last 4 hours
```
*Expect:* generated `timeseries` DQL with failure/request counts. Executed live — returned real services with failure rates up to 100%.

**▶ Error budget check**
```
How much error budget does my SLO for <service-name> have left this period,
and what is burning it fastest?
```

---

## 12 · Everyday extras

**▶ Dashboards by describing them**
```
Give me a DQL query for average response time per service over the last
24 hours that I can put on a dashboard tile.
```

**▶ Explain inherited DQL**
```
Explain what this query does: <paste any DQL>
```

**▶ Speak to the business**
```
Explain this payment-service slowdown to a non-technical stakeholder in
three plain sentences — impact and status only.
```

**▶ Docs without leaving the platform**
```
How do I create a workflow that runs a DQL query on a schedule and sends
the result to Slack?
```

---

## Validation methodology

- Tenant: `guu84124` (demo.apps.dynatrace.com), via the Dynatrace MCP server tools — the same Davis CoPilot capabilities that power Dynatrace Assist (chat, natural-language-to-DQL, DQL execution).
- Each ✅ chat prompt returned a `SUCCESSFUL` grounded answer **with source links** (docs + community).
- Query-mode prompts were generated from natural language and executed against live Grail data; failures (compound phrasing, wrong table, missing timeframe) are documented inline — they're the teaching moments.
- Chat answers may end with "ask your admin to enable Agentic AI" — expected; that's the generative vs agentic distinction.

*Prompts behave the same in the in-product Dynatrace Assist chat — that's the primary audience for this library.*
