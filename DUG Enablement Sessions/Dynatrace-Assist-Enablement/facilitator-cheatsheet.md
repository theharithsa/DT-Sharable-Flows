# Dynatrace Assist — Facilitator Cheat-Sheet

**Session:** Enablement Series · Dynatrace Assist (DUG) · India SDO (Customer Success)
**Tenant used for validation:** `dre63214` · **Format:** Interactive
**How to run:** Seed each prompt yourself → invite an attendee to send their own variation → read the answer AND its source links together.

> All prompts below were validated live against Davis CoPilot. Answers summarized so you know what to expect on screen.

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

## Facilitator reminders

- **Always open the source links** on screen — "trust, then verify" is the session's core message.
- **If Assist misreads intent**, treat it as a phrasing lesson, not a failure.
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
