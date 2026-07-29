# Dynatrace Assist — Facilitator Cheat-Sheet

**Session:** Enablement Series · Dynatrace Assist (DUG) · India SDO (Customer Success)
**Tenants used for validation:** `dre63214` + `guu84124` (demo.apps.dynatrace.com) · **Format:** Interactive
**How to run:** Seed each prompt yourself → invite an attendee to send their own variation → read the answer AND its source links together.

> All prompts below were validated live against Davis CoPilot. Answers summarized so you know what to expect on screen.

---

## ⚡ The two prompt modes — know this before you demo

Davis CoPilot chat is a **knowledge assistant grounded in docs + community**, not a live-data engine. Open-ended "impress me" prompts (*"what's the most expensive thing running right now?"*) return **how-to guidance with doc citations — no live numbers**. On stage that's an anticlimax if you expected a chart.

Live numbers come from the **natural-language → DQL → execute** path. Split every demo prompt into one of two buckets and *tell the audience which one you're firing*:

| Bucket | What it's for | What comes back | Stage use |
|---|---|---|---|
| **A · "Teach me"** (chat) | how-do-I, explain-this, what-should-I-look-at | Guidance + source links | The trust / anti-hallucination beat |
| **B · "Show me my data"** (NL→DQL) | top N, sorted by, timeframed | A live table/chart from the tenant | The wow moment |

**Validated example of the difference:** chat prompt *"which workloads are over-provisioned?"* → solid conceptual walkthrough + docs (Bucket A, no numbers). NL→DQL prompt *"top 5 hosts by CPU usage in the last 2 hours"* → five real hosts on screen (Bucket B).

---

## 1. Generate DQL  ·  *Platform / SRE*  ·  Deck slide 10

**Prompt**
```
Generate a DQL query that shows the top 10 hosts by CPU usage
over the last 2 hours, averaged per host.
```
**Expect back**
- A runnable query, roughly:
  ```dql
  timeseries usage = avg(dt.host.cpu.usage, scalar: true), by: {dt.smartscape.host}
  | sort usage desc
  | limit 10
  ```
- Source links to the DQL examples docs.

**Live variation to invite:** "same but for memory" or "top 5 services by response time."
**Talk track:** intent → working query without memorizing field names.

---

## 2. Understand DQL  ·  *Developer*  ·  Deck slide 11

**Prompt**
```
Explain what this query does:
fetch logs | filter loglevel == "ERROR" | summarize count(), by:{dt.source_entity} | sort `count()` desc | limit 5
```
**Expect back**
- Clause-by-clause plain-English breakdown: fetch logs → keep only errors → count per source entity → sort desc → top 5.

**Live variation to invite:** paste a query from a real dashboard tile or alert.
**Talk track:** this is how people actually learn DQL — by reading, not memorizing.

---

## 3. Configuration help  ·  *Platform / SRE*  ·  Deck slide 12

**Prompt**
```
How do I configure a management zone, and what is the difference
between a management zone and a security context?
```
**Expect back**
- Ordered setup steps (Settings → Management zones → rules → save).
- Clear management zone vs security context comparison.
- Note on the Grail migration direction (toward security contexts / segments), with docs + community links.

**Live variation to invite:** any config task specific to your environment.
**Talk track:** config questions answered in context, not by hunting menus.

---

## 4. First line of support  ·  *L1 / NOC*  ·  Deck slide 13

**Prompt**
```
A pod shows "Back-off restarting failed container".
Explain what it means, the common root causes, and what I should check first.
```
**Expect back**
- Plain-English meaning (repeated container start failures → back-off).
- Ranked causes: app errors, resource limits, config/secrets, permissions, network/image pull.
- Ordered checklist (`kubectl logs`, `kubectl describe pod`, resources, config, permissions, connectivity), with community troubleshooting links.

**Live variation to invite:** paste any error string an attendee is staring at right now.
**Talk track:** the "don't open a ticket for small things" moment.

---

## 5. Troubleshoot & correlate  ·  *Developer*  ·  Deck slide 14

**Prompt**
```
My service's failure rate spiked. How can I use Dynatrace to correlate it
with recent deployment events, dependency problems, and error logs
to find the root cause?
```
**Expect back**
- Guided path: Failure Analysis → deployment events correlation → outgoing/downstream dependencies → linked logs on failed traces → Distributed Tracing Explorer → Davis AI root cause.
- Links to Failure Analysis + RCA docs.

**Live variation to invite:** run against a real service in the environment.
**Talk track:** Assist stitches signals already in the platform into one investigation.

---

## 6. Innovative / non-obvious uses  ·  Deck slide 15

**Prompt**
```
Give me 3 creative ways a platform engineer or SRE could use Dynatrace Assist
beyond basic querying — onboarding, learning the data model, building dashboards.
```
**Expect back**
1. Guided onboarding — "what are the key services and their dependencies?" → learn topology by conversation.
2. Faster dashboards — describe a KPI → get DQL → drop onto a tile.
3. Incident/runbook rehearsal — "upstream and downstream impact if service X fails?" → blast-radius map.

**Live variation to invite:** ask the room for one creative use for their own team.

---

## 7. Privacy, security & data controls  ·  Deck slides 21–22

**Prompt (safe to run live)**
```
For Dynatrace Assist: how is my data handled for privacy and security?
Is my observability data used to train the AI models?
What data controls and access controls do administrators have?
```
**Expect back (key points to reinforce)**
- **Not used for training** — your metrics/logs/traces/topology answer questions; they do not train the model.
- **Data isolation** — stays within your environment; not shared across customers.
- **Encryption** in transit and at rest.
- **RBAC** applies — users only reason over data they can already see.
- **Admin controls** — Settings › Dynatrace Intelligence › Generative and agentic AI (on/off), granular permissions, opt-in for new features, data residency options.
- **Auditable** — interactions are logged.

---

## Creative add-on prompts — validated against the demo tenant

Use these beyond the default use-case prompts above. Bucket labels tell you what to expect on screen.

### Bucket B — live-data prompts (these return real numbers)

```
Top 5 hosts by CPU usage in the last 2 hours
```
✅ tested — generated valid DQL, executed, returned 5 real hosts.

```
Active problems in the last 24 hours, sorted by count
```
✅ tested — **use this exact phrasing.** The compound version *"active problems … grouped by problem name"* failed the NL→DQL generator. Live result on `guu84124`: API gateway errors (137), AWS Lambda error rate (80), Network monitor (57)…

```
Top 10 services by failure rate in the last 4 hours
```
```
Which log sources produced the most errors today?
```
```
Slowest 10 user actions in the last hour by median duration
```

### Bucket A — teaching prompts (great narration + sources, no live numbers)

```
How do I find over-provisioned Kubernetes workloads and estimate savings?
```
✅ tested — strong conceptual answer with docs.

```
What is the best way to identify my most resource-expensive processes?
```
✅ tested.

```
Explain what this problem means and how to fix it
```
(paste a real problem from the environment)

---

## Backup / overflow prompts (if the room wants more)

```
What are the top 5 services with the highest response time right now?
```
```
Explain the Apdex score and how it is calculated.
```
```
Summarize the most impactful problem in my environment in the last 24 hours.
```
```
Write a DQL query to find the top 10 Kubernetes pods by memory usage.
```
```
What does the metric dt.host.cpu.usage represent and how is it measured?
```

---

## Prompting best practices (validated + sourced from Davis itself)

1. **Name the entity.** "checkout-service" beats "my app."
2. **Always give a timeframe.** "last 2 hours", "last 24h" — NL→DQL only worked cleanly when scoped.
3. **Use Dynatrace nouns.** "problems", "PurePath", "hosts by CPU", "failure rate" map directly to Grail — vague verbs don't.
4. **Ask for a shape, not a vibe.** "Top 5 … sorted by …" generates clean DQL. "Is my system healthy?" does not.
5. **One question per prompt.** The compound "active problems … grouped by name" *failed* the generator; the simpler rewording succeeded.
6. **Iterate out loud.** If a prompt fails on stage, reword and retry live — it reinforces that it's conversational, not magic.
7. **End on the "so what."** After any data answer, follow with *"…and what should I do about it?"* — recommendation > finding.

---

## Facilitator reminders

- **Always open the source links** on screen — "trust, then verify" is the session's core message.
- **Announce the bucket before each prompt** — "this one teaches" vs "this one shows your data" — so nobody expects live numbers from a chat question.
- **If Assist misreads intent**, treat it as a phrasing lesson, not a failure — reword and retry out loud.
- **DQL generation help** may prompt "ask your admin to enable Agentic AI" — that's expected; explain the generative vs agentic distinction.
- **Goal for the hour:** everyone leaves having asked at least one question that saves them a future ticket.

---

## Industry stats on the deck (Stack Overflow · 2025 Developer Survey)

| Stat | Use |
|---|---|
| 84% use/plan AI tools (up from 76%) | Adoption — slide 19 |
| 51% of pros use AI daily | Adoption — slide 19 |
| 54% rely on AI to "search for answers" | Adoption — slide 19 |
| 66% frustrated by "almost right, not quite" | Counter-beat — slide 20 |
| 46% distrust accuracy vs 33% trust | Counter-beat — slide 20 |
| 75% still ask a human when they distrust an answer | Counter-beat — slide 20 |
| 81% concerned about AI data privacy | Data controls — slide 22 |
