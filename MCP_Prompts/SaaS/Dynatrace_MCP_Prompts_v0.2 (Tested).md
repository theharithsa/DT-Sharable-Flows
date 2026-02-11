# Dynatrace MCP Prompts v0.2 — Enhanced & Fine-Tuned

> **Changelog from v0.1:**
> - Added explicit DQL metric names and entity types for higher success rates
> - Restructured prompts into numbered steps for multi-tool orchestration
> - Added "Expected Output" sections so responses are structured and verifiable
> - Fixed all failed prompts (percentiles, pod lifecycle, queue depth, HPA, SLO, network)
> - Added scope anchors (`namespace`, `cluster`, `entity ID`) to eliminate ambiguity
> - Introduced `### Context` blocks for prompts that need pre-conditions
> - Grouped prompts by operational workflow instead of loose categories
> - **Rate Limiting:** Dynatrace MCP server enforces a maximum of 5 tool calls per 20 seconds — avoid calling multiple MCP tools in rapid parallel; sequence them with short pauses to prevent rate-limit errors

---

## Table of Contents

1. [Root Cause Analysis](#1-root-cause-analysis)
2. [Kubernetes Operations](#2-kubernetes-operations)
3. [Performance & Latency](#3-performance--latency)
4. [Resource Optimization](#4-resource-optimization)
5. [Error & Log Analysis](#5-error--log-analysis)
6. [Deployment & Release Management](#6-deployment--release-management)
7. [Security & Compliance](#7-security--compliance)
8. [Capacity Planning & Forecasting](#8-capacity-planning--forecasting)
9. [Observability Reporting](#9-observability-reporting)
10. [Proactive & Autonomous Operations](#10-proactive--autonomous-operations)
11. [Network & Connectivity](#11-network--connectivity)

---

# 1. Root Cause Analysis

---

## 1.1 Error-Specific RCA for a Namespace

### Context
Use when a known error message is occurring in a specific Kubernetes namespace.

### Prompt

```
Step 1: Find the Kubernetes cluster entity for "<cluster_name>" and retrieve its entity ID.

Step 2: List all problems in the last <time_range> filtered by namespace "<namespace>" 
        and error message containing "<error_message>".

Step 3: For each problem found, fetch full problem details including:
        event.description, event.status, event.category, event.start, event.end,
        root_cause_entity_id, root_cause_entity_name, k8s.namespace.name,
        k8s.workload.name, k8s.pod.name, duration, affected_entities_count.

Step 4: Query error logs in namespace "<namespace>" over the last <time_range>:
        fetch logs, from:now() - <time_range>
        | filter k8s.namespace.name == "<namespace>" AND loglevel == "ERROR"
        | filter content contains "<error_message>"
        | summarize count = count(), by:{k8s.workload.name, k8s.pod.name}

Step 5: Correlate the problems and log patterns. Provide:
        - Root cause analysis with probable cause
        - Timeline of events
        - Affected workloads and pods
        - Recommended remediation steps
```

### Expected Output
- Problem IDs and descriptions
- Error log counts grouped by workload/pod
- Root cause with corrective actions

---

## 1.2 High-Level Service/Application RCA

### Context
Use when a service or application shows degradation or outage and root cause is unknown.

### Prompt

```
Step 1: Find the entity ID for service "<service_name>" or application "<app_name>".

Step 2: List all problems for this entity over the last <time_range>.

Step 3: Query response time and error rate metrics:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        filter:dt.entity.service == "<SERVICE-ID>",
        {
          avg_response = avg(dt.service.request.response_time),
          error_count = sum(dt.service.request.failure_count),
          total_count = sum(dt.service.request.count)
        }

Step 4: Query error logs for this service:
        fetch logs, from:now() - <time_range>
        | filter dt.entity.service == "<SERVICE-ID>" AND loglevel == "ERROR"
        | summarize count = count(), by:{content}
        | sort count desc
        | limit 10

Step 5: Map upstream and downstream dependencies:
        smartscapeEdges "*"
        | filter source_id == "<SERVICE-ID>" or target_id == "<SERVICE-ID>"

Step 6: Correlate findings and provide:
        - Primary root cause
        - Impact timeline
        - Triggering factors
        - Dependency chain analysis
        - Remediation recommendations
```

### Expected Output
- Root cause identification
- Metrics correlation (response time, error rate)
- Dependency map with impacted services
- Remediation steps

---

## 1.3 Problem-Centric RCA with Dependency Chain

### Context
Use when you have a specific Dynatrace problem ID and need full causal analysis.

### Prompt

```
Step 1: Fetch full details for problem "<problem_id>":
        fetch dt.davis.problems, from:now() - <time_range>
        | filter problem_id == "<problem_id>"
        | fields event.description, event.status, event.category,
          event.start, event.end, root_cause_entity_id, root_cause_entity_name,
          duration, affected_entities_count, event_count,
          k8s.cluster.name, k8s.namespace.name, k8s.workload.name,
          entity_tags, maintenance.is_under_maintenance

Step 2: Map the causal chain using Smartscape:
        smartscapeEdges "*"
        | filter source_id == "<root_cause_entity_id>"
           or target_id == "<root_cause_entity_id>"

Step 3: Check for related problems in the same time window:
        List all problems from <event.start - 30min> to <event.end + 30min>
        filtered by the same cluster or namespace.

Step 4: Provide:
        - Causal chain across services (upstream → root cause → downstream)
        - Upstream dependency impact
        - Downstream dependency impact
        - Anomalous metrics and events at each hop
        - Probable root cause with confidence level (HIGH/MEDIUM/LOW)
        - Recommended remediation
```

### Expected Output
- Causal chain diagram (textual)
- Confidence level for root cause
- Impact scope and blast radius

---

# 2. Kubernetes Operations

---

## 2.1 Cluster Health Overview

### Prompt

```
Step 1: Find the Kubernetes cluster entity for "<cluster_name>".

Step 2: Query node-level resource utilization:
        timeseries from:now() - <time_range>,
        by:{k8s.node.name},
        {
          cpu_usage = avg(dt.host.cpu.usage),
          memory_usage = avg(dt.host.memory.usage)
        }

Step 3: Query workload health:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        filter:k8s.cluster.name == "<cluster_name>",
        {
          pods_ready = avg(dt.kubernetes.workload.pods_ready),
          pods_desired = avg(dt.kubernetes.workload.pods_desired)
        }

Step 4: List all active problems for this cluster.

Step 5: Summarize:
        - Overall cluster health status (Healthy / Degraded / Critical)
        - Node utilization summary (CPU, Memory per node)
        - Workload stability (pods ready vs desired)
        - Active problems and their severity
        - Resource saturation warnings
        - Recommendations for improvement
```

---

## 2.2 Kubernetes Instability Analysis

### Prompt

```
Step 1: List all active problems for the Kubernetes cluster in the last <time_range>.
        Focus on categories: ERROR, RESOURCE_CONTENTION, AVAILABILITY.

Step 2: Query CPU throttling across workloads:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          throttled_time = avg(dt.containers.cpu.throttled_time),
          throttling_ratio = avg(dt.containers.cpu.throttling_ratio)
        }

Step 3: Query memory pressure:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          memory_usage = avg(dt.containers.memory.resident_set_bytes),
          memory_limit = avg(dt.kubernetes.container.limits_memory)
        }

Step 4: Query pod restart counts:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        restarts = sum(dt.kubernetes.container.restarts)

Step 5: Check for recent deployment events:
        fetch dt.davis.events, from:now() - <time_range>
        | filter event.type in ("CUSTOM_DEPLOYMENT", "CUSTOM_CONFIGURATION")
        | fields timestamp, event.type, affected_entity_ids

Step 6: Correlate all signals and provide:
        - Most probable root cause ranked by evidence strength
        - Service errors correlated with resource pressure
        - Pod restarts linked to OOM or throttling
        - Deployment correlation timeline
        - Remediation steps prioritized by impact
```

---

## 2.3 Pod Startup & Initialization Bottlenecks

### Context
v1 prompt failed because "pod lifecycle metrics" is too vague. This version uses Kubernetes events and container metrics.

### Prompt

```
Step 1: Query Kubernetes events for pod lifecycle in namespace "<namespace>":
        fetch events, from:now() - <time_range>
        | filter k8s.namespace.name == "<namespace>"
        | filter event.kind == "K8S"
        | summarize count = count(), by:{k8s.pod.name, event.type}
        | sort count desc

Step 2: Query container startup time:
        timeseries from:now() - <time_range>,
        by:{k8s.pod.name, k8s.container.name},
        filter:k8s.namespace.name == "<namespace>",
        {
          cpu_usage = avg(dt.containers.cpu.usage_user_time),
          memory_usage = avg(dt.containers.memory.resident_set_bytes)
        }

Step 3: Check for pods in pending or crash-loop state:
        fetch dt.davis.problems, from:now() - <time_range>
        | filter k8s.namespace.name == "<namespace>"
        | filter event.category in ("ERROR", "AVAILABILITY")
        | fields k8s.pod.name, k8s.workload.name, event.description, duration

Step 4: Provide:
        - Pods with slowest startup times
        - Init container bottlenecks (if any)
        - CrashLoopBackOff patterns
        - Resource contention during startup
        - Recommendations to accelerate pod startup
```

---

## 2.4 Noisy Neighbor Detection

### Prompt

```
Step 1: Query CPU usage by namespace:
        timeseries from:now() - <time_range>,
        by:{k8s.namespace.name},
        {
          cpu_used = avg(dt.containers.cpu.usage_user_time),
          cpu_requested = avg(dt.kubernetes.container.requests_cpu)
        }

Step 2: Query memory usage by namespace:
        timeseries from:now() - <time_range>,
        by:{k8s.namespace.name},
        {
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_requested = avg(dt.kubernetes.container.requests_memory)
        }

Step 3: Identify workloads where usage significantly exceeds requests:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          cpu_used = avg(dt.containers.cpu.usage_user_time),
          cpu_limit = avg(dt.kubernetes.container.limits_cpu),
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_limit = avg(dt.kubernetes.container.limits_memory)
        }

Step 4: Correlate with problems affecting co-located workloads.

Step 5: Provide:
        - Top 5 resource-consuming namespaces
        - Top 10 workloads with highest resource overcommit
        - Workloads missing resource requests or limits
        - Impact on neighboring workloads
        - Remediation: resource limit adjustments, namespace quotas
```

---

# 3. Performance & Latency

---

## 3.1 Response Time Percentile Analysis

### Context
v1 prompt failed because "P95/P99" was too vague. This version uses explicit DQL percentile functions.

### Prompt

```
Step 1: Query service response time distribution:
        fetch spans, from:now() - <time_range>
        | filter isNotNull(service.name)
        | summarize
            request_count = count(),
            avg_duration = avg(duration),
            p50 = percentile(duration, 50),
            p90 = percentile(duration, 90),
            p95 = percentile(duration, 95),
            p99 = percentile(duration, 99),
            max_duration = max(duration),
          by:{service.name}
        | sort p99 desc

Step 2: For the top 5 services with highest P99 latency, drill into endpoints:
        fetch spans, from:now() - <time_range>
        | filter service.name == "<top_service>"
        | summarize
            p95 = percentile(duration, 95),
            p99 = percentile(duration, 99),
            error_count = countIf(http.response.status_code >= 500),
          by:{http.route}
        | sort p99 desc

Step 3: Provide:
        - Services ranked by P99 latency
        - Endpoints with highest tail latency
        - Correlation between latency and error rates
        - Saturation signals contributing to latency
        - Recommendations for latency reduction
```

### Expected Output
- Table of services with P50/P90/P95/P99 values
- Top slow endpoints per service
- Actionable optimization recommendations

---

## 3.2 Service Dependency Health & Cascading Failure Risk

### Prompt

```
Step 1: Map dependencies for service "<service_name>":
        smartscapeEdges "*"
        | filter source_id == "<SERVICE-ID>" or target_id == "<SERVICE-ID>"

Step 2: Query error rates and response times for all connected services:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        {
          error_rate = avg(dt.service.request.failure_rate),
          response_time = avg(dt.service.request.response_time)
        }

Step 3: List problems affecting any service in the dependency chain.

Step 4: Provide:
        - Service dependency graph (text representation)
        - Health status of each dependency (Healthy / Degraded / Down)
        - Error propagation path
        - Cascading failure risk assessment
        - Recommended circuit breaker or fallback strategies
```

---

## 3.3 Performance Trend Analysis

### Prompt

```
Step 1: Query response time trend for "<service_name>":
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        filter:dt.entity.service == "<SERVICE-ID>",
        {
          avg_response = avg(dt.service.request.response_time),
          max_response = max(dt.service.request.response_time),
          request_count = sum(dt.service.request.count),
          failure_count = sum(dt.service.request.failure_count)
        }

Step 2: Compare current values against the same period last week:
        Repeat Step 1 with from:now() - <time_range> - 7d, to:now() - 7d

Step 3: Provide:
        - Trend direction (improving / stable / degrading)
        - Percentage change in response time vs. baseline
        - Error rate trend
        - Throughput changes
        - Leading indicators of regression
        - Recommendations if degrading
```

---

# 4. Resource Optimization

---

## 4.1 CPU Saturation & Throttling Analysis

### Prompt

```
Step 1: Query CPU throttling metrics:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          throttled_time = avg(dt.containers.cpu.throttled_time),
          throttle_ratio = avg(dt.containers.cpu.throttling_ratio),
          cpu_usage = avg(dt.containers.cpu.usage_user_time),
          cpu_limit = avg(dt.kubernetes.container.limits_cpu)
        }

Step 2: Identify the top 10 workloads by throttle ratio.

Step 3: Correlate throttled workloads with service response time:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        avg_response = avg(dt.service.request.response_time)

Step 4: Provide:
        - Top 10 CPU-throttled workloads
        - CPU requests vs. limits vs. actual usage per workload
        - Impact on service response time
        - Recommended CPU limit adjustments
        - Estimated improvement after adjustment
```

---

## 4.2 Memory Usage & OOM Risk Analysis

### Prompt

```
Step 1: Query memory metrics:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_limit = avg(dt.kubernetes.container.limits_memory),
          memory_requested = avg(dt.kubernetes.container.requests_memory)
        }

Step 2: Calculate memory utilization percentage and identify workloads above 85%.

Step 3: Query OOM events:
        fetch dt.davis.problems, from:now() - <time_range>
        | filter event.description contains "OOM" or event.description contains "memory"
        | fields k8s.workload.name, k8s.namespace.name, event.description, duration

Step 4: Query container restart patterns:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        restarts = sum(dt.kubernetes.container.restarts)

Step 5: Provide:
        - Workloads with memory above 85% of limit
        - OOM events and affected workloads
        - Container restart patterns linked to memory pressure
        - Memory request vs. limit vs. actual usage
        - Recommended memory adjustments
        - Candidates for memory leak investigation
```

---

## 4.3 Cost Optimization & Resource Right-Sizing

### Prompt

```
Step 1: Query CPU slack (requested minus used):
        timeseries from:now() - 7d,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          cpu_used = avg(dt.containers.cpu.usage_user_time),
          cpu_requested = avg(dt.kubernetes.container.requests_cpu),
          cpu_limit = avg(dt.kubernetes.container.limits_cpu)
        }

Step 2: Query memory slack (requested minus used):
        timeseries from:now() - 7d,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_requested = avg(dt.kubernetes.container.requests_memory),
          memory_limit = avg(dt.kubernetes.container.limits_memory)
        }

Step 3: Identify:
        - Workloads with >50% CPU slack (over-provisioned)
        - Workloads with >50% memory slack (over-provisioned)
        - Workloads with negative slack (under-provisioned / risk)
        - Workloads missing requests or limits entirely

Step 4: Provide:
        - Top 10 over-provisioned workloads with savings potential
        - Top 10 under-provisioned workloads with risk assessment
        - Recommended right-sized CPU/memory requests and limits
        - HPA tuning recommendations
        - Estimated cost savings (qualitative)
```

---

## 4.4 HPA & Autoscaling Effectiveness

### Context
v1 prompt failed — too vague. This version queries concrete metrics and events.

### Prompt

```
Step 1: Query workload replica counts over time:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          pods_ready = avg(dt.kubernetes.workload.pods_ready),
          pods_desired = avg(dt.kubernetes.workload.pods_desired)
        }

Step 2: Query CPU and memory utilization for scaling correlation:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          cpu_usage = avg(dt.containers.cpu.usage_user_time),
          memory_usage = avg(dt.containers.memory.resident_set_bytes)
        }

Step 3: Check for scaling-related events:
        fetch events, from:now() - <time_range>
        | filter event.kind == "K8S"
        | filter matchesPhrase(content, "scale") or matchesPhrase(content, "HPA") or matchesPhrase(content, "autoscal")
        | summarize count = count(), by:{k8s.workload.name, event.type}

Step 4: Provide:
        - Workloads with scaling activity
        - Scaling delay analysis (time between load spike and scale-up)
        - Scaling oscillation detection (frequent scale-up/down cycles)
        - Workloads where pods_ready < pods_desired
        - Recommendations for HPA min/max replicas and target utilization
```

---

# 5. Error & Log Analysis

---

## 5.1 HTTP 5xx Error Analysis

### Prompt

```
Step 1: Query 5xx errors from spans:
        fetch spans, from:now() - <time_range>
        | filter http.response.status_code >= 500 AND http.response.status_code < 600
        | summarize
            error_count = count(),
          by:{service.name, http.route, http.response.status_code}
        | sort error_count desc
        | limit 20

Step 2: For the top 5 error-producing endpoints, analyze exceptions:
        fetch spans, from:now() - <time_range>
        | filter service.name == "<top_service>"
          AND http.route == "<top_route>"
          AND http.response.status_code >= 500
        | fields service.name, http.route, http.response.status_code,
          exception.type, exception.message, duration
        | limit 20

Step 3: Correlate error trends over time:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        {
          failure_count = sum(dt.service.request.failure_count),
          total_count = sum(dt.service.request.count)
        }

Step 4: Provide:
        - Top 20 error-producing service + endpoint combinations
        - Common exception types and messages
        - Error rate trend (increasing / stable / decreasing)
        - Probable root causes
        - Recommended fixes
```

---

## 5.2 Error-Centric Log Analysis

### Prompt

```
Step 1: Query error logs grouped by service and pattern:
        fetch logs, from:now() - <time_range>
        | filter loglevel == "ERROR"
        | filter isNotNull(dt.entity.service)
        | summarize count = count(), by:{dt.entity.service, content}
        | sort count desc
        | limit 20

Step 2: Identify recurring exception stack traces:
        fetch logs, from:now() - <time_range>
        | filter loglevel == "ERROR"
        | filter matchesPhrase(content, "Exception") or matchesPhrase(content, "Error") or matchesPhrase(content, "Traceback")
        | summarize count = count(), by:{k8s.workload.name, content}
        | sort count desc
        | limit 10

Step 3: Correlate with service performance:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        {
          error_rate = avg(dt.service.request.failure_rate),
          response_time = avg(dt.service.request.response_time)
        }

Step 4: Provide:
        - Top 20 recurring errors grouped by frequency
        - Exception patterns with stack trace summaries
        - Services with error rate spikes
        - Correlation between log errors and performance degradation
        - Prioritized remediation actions
```

---

## 5.3 Log-to-Metric Correlation

### Prompt

```
Step 1: Query error log count per service over time:
        fetch logs, from:now() - <time_range>
        | filter loglevel == "ERROR"
        | makeTimeseries count = count(), interval:10m, by:{dt.entity.service}

Step 2: Query CPU and memory metrics for same entities:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        {
          cpu_usage = avg(dt.containers.cpu.usage_user_time),
          memory_usage = avg(dt.containers.memory.resident_set_bytes)
        }

Step 3: Query response time for same entities:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        avg_response = avg(dt.service.request.response_time)

Step 4: Provide:
        - Time-aligned comparison of error logs vs. resource metrics
        - Services where error spikes coincide with CPU or memory spikes
        - Services where errors correlate with response time degradation
        - Probable causation chains
        - Recommendations
```

---

## 5.4 Application Exception Investigation

### Prompt

```
Step 1: List all recent exceptions:
        List exceptions for the last <time_range>.

Step 2: For each unique error.id, query full details:
        fetch user.events, from:now() - <time_range>
        | filter error.id == "<error_id>"
        | fields error.type, error.id, exception.message,
          exception.stack_trace, dt.rum.application.id, os.name
        | limit 5

Step 3: Provide:
        - Unique exception types with frequency
        - Full stack trace analysis
        - Affected applications and platforms
        - Root cause assessment
        - Fix recommendations with code-level pointers
```

---

# 6. Deployment & Release Management

---

## 6.1 Deployment Regression Detection

### Prompt

```
Step 1: Check for deployment events:
        fetch events, from:now() - <time_range>
        | filter event.type == "CUSTOM_DEPLOYMENT"
        | fields timestamp, affected_entity_ids, event.type

Step 2: Query service metrics BEFORE deployment (1 hour before):
        timeseries from:<deployment_time> - 1h, to:<deployment_time>,
        by:{dt.entity.service},
        filter:dt.entity.service == "<SERVICE-ID>",
        {
          avg_response = avg(dt.service.request.response_time),
          failure_rate = avg(dt.service.request.failure_rate),
          throughput = sum(dt.service.request.count)
        }

Step 3: Query service metrics AFTER deployment (1 hour after):
        Repeat Step 2 with from:<deployment_time>, to:<deployment_time> + 1h

Step 4: Query resource consumption before and after deployment:
        timeseries for CPU and memory with same before/after windows.

Step 5: Provide:
        - Before vs. After comparison table:
          | Metric         | Before | After | Change % |
          |----------------|--------|-------|----------|
          | Response Time  |        |       |          |
          | Error Rate     |        |       |          |
          | Throughput     |        |       |          |
          | CPU Usage      |        |       |          |
          | Memory Usage   |        |       |          |
        - Regression detected: YES / NO
        - Severity: CRITICAL / HIGH / MEDIUM / LOW
        - Rollback recommendation: YES / NO
        - Specific degradation details
```

---

## 6.2 Canary Validation

### Context
v1 prompt failed — too vague. This version compares metrics between labeled versions.

### Prompt

```
Step 1: Identify canary and stable versions of "<service_name>":
        fetch spans, from:now() - <time_range>
        | filter service.name == "<service_name>"
        | summarize count = count(), by:{service.version}

Step 2: Compare response times between versions:
        fetch spans, from:now() - <time_range>
        | filter service.name == "<service_name>"
        | summarize
            avg_duration = avg(duration),
            p95 = percentile(duration, 95),
            p99 = percentile(duration, 99),
            error_rate = countIf(http.response.status_code >= 500) / count() * 100.0,
          by:{service.version}

Step 3: Compare resource consumption between versions:
        timeseries from:now() - <time_range>,
        by:{k8s.workload.name},
        {
          cpu = avg(dt.containers.cpu.usage_user_time),
          memory = avg(dt.containers.memory.resident_set_bytes)
        }
        (Filter to canary vs stable workload names.)

Step 4: Provide:
        - Side-by-side comparison of canary vs stable:
          | Metric      | Stable  | Canary  | Difference |
          |-------------|---------|---------|------------|
          | Avg Latency |         |         |            |
          | P95 Latency |         |         |            |
          | P99 Latency |         |         |            |
          | Error Rate  |         |         |            |
          | CPU Usage   |         |         |            |
          | Memory      |         |         |            |
        - Canary health: HEALTHY / DEGRADED / FAILING
        - Promotion recommendation: PROMOTE / HOLD / ROLLBACK
        - Anomalies isolated to canary: YES / NO
```

---

## 6.3 Change-Incident Correlation

### Prompt

```
Step 1: Query all change and deployment events:
        fetch events, from:now() - <time_range>
        | filter event.type in ("CUSTOM_DEPLOYMENT", "CUSTOM_CONFIGURATION",
          "CUSTOM_ANNOTATION", "CUSTOM_INFO")
        | fields timestamp, event.type, event.name, affected_entity_ids

Step 2: Query all problems in the same window:
        List all problems for the last <time_range>.

Step 3: Build a timeline placing changes and problems chronologically.

Step 4: Provide:
        - Combined timeline of changes and incidents
        - Changes that occurred within 30 minutes before an incident
        - Correlation strength (STRONG / MODERATE / WEAK / NONE)
        - Recommended preventive actions
```

---

# 7. Security & Compliance

---

## 7.1 Vulnerability Assessment

### Prompt

```
Step 1: List all vulnerabilities with risk score >= <min_score>
        over the last <time_range>.

Step 2: For each CRITICAL vulnerability, fetch details:
        fetch security.events, from:now() - <time_range>
        | filter event.provider == "Dynatrace"
          AND event.type == "VULNERABILITY_STATE_REPORT_EVENT"
          AND event.level == "ENTITY"
        | filter vulnerability.id == "<vuln_id>"
        | dedup {vulnerability.display_id, affected_entity.id},
          sort:{timestamp desc}
        | fields vulnerability.external_id, vulnerability.display_id,
          vulnerability.cvss.vector, vulnerability.risk.score,
          vulnerability.stack, vulnerability.remediation.description,
          affected_entity.name, affected_entity.vulnerable_functions,
          related_entities.hosts.names, related_entities.kubernetes_clusters.names,
          vulnerability.description, vulnerability.technology

Step 3: Provide:
        - Vulnerability inventory sorted by risk score
        - CRITICAL items requiring immediate action
        - Affected entities and their exposure level
        - Remediation steps for top 5 vulnerabilities
        - Patch priority matrix
```

---

## 7.2 Security Event & Auth Log Analysis

### Context
v1 prompt failed — need to use log queries with security-specific filters.

### Prompt

```
Step 1: Query security-related logs:
        fetch logs, from:now() - <time_range>
        | filter loglevel == "ERROR" or loglevel == "WARN"
        | filter matchesPhrase(content, "auth") or matchesPhrase(content, "login")
          or matchesPhrase(content, "unauthorized") or matchesPhrase(content, "forbidden")
          or matchesPhrase(content, "denied") or matchesPhrase(content, "401")
          or matchesPhrase(content, "403") or matchesPhrase(content, "certificate")
        | summarize count = count(),
          by:{dt.entity.service, k8s.namespace.name, loglevel}
        | sort count desc

Step 2: Query HTTP 401 and 403 errors from spans:
        fetch spans, from:now() - <time_range>
        | filter http.response.status_code in (401, 403)
        | summarize count = count(),
          by:{service.name, http.route, http.response.status_code}
        | sort count desc

Step 3: Provide:
        - Auth failure patterns grouped by service and endpoint
        - Unusual spikes in 401/403 errors
        - Potential brute force or credential stuffing patterns
        - Services with certificate issues
        - Recommendations for security hardening
```

---

# 8. Capacity Planning & Forecasting

---

## 8.1 CPU Capacity Planning

### Prompt

```
Step 1: Query CPU utilization for the last 7 days:
        timeseries from:now() - 7d,
        by:{k8s.workload.name, k8s.namespace.name},
        filter:k8s.namespace.name == "<namespace>",
        {
          cpu_used = avg(dt.containers.cpu.usage_user_time),
          cpu_limit = avg(dt.kubernetes.container.limits_cpu),
          cpu_requested = avg(dt.kubernetes.container.requests_cpu)
        }

Step 2: Run a forecast analysis using Davis Analyzer:
        Execute analyzer "dt.statistics.GenericForecastAnalyzer" with
        the CPU utilization timeseries as input.

Step 3: Provide:
        - Current CPU utilization vs. capacity
        - 7-day usage trend (growing / stable / declining)
        - Forecasted CPU requirements for the next 7 and 30 days
        - Workloads approaching CPU limits
        - Scaling recommendations (vertical vs. horizontal)
        - Timeline for when capacity will be exhausted (if applicable)
```

---

## 8.2 Memory Capacity Planning

### Prompt

```
Step 1: Query memory utilization for the last 7 days:
        timeseries from:now() - 7d,
        by:{k8s.workload.name, k8s.namespace.name},
        filter:k8s.namespace.name == "<namespace>",
        {
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_limit = avg(dt.kubernetes.container.limits_memory),
          memory_requested = avg(dt.kubernetes.container.requests_memory)
        }

Step 2: Run a forecast analysis using Davis Analyzer:
        Execute analyzer "dt.statistics.GenericForecastAnalyzer" with
        the memory utilization timeseries as input.

Step 3: Provide:
        - Current memory utilization vs. capacity
        - 7-day usage trend (growing / stable / declining)
        - Forecasted memory requirements for next 7 and 30 days
        - Workloads approaching memory limits
        - OOM risk assessment
        - Scaling or limit adjustment recommendations
```

---

## 8.3 Saturation & Throughput Analysis

### Context
v1 prompt failed — too abstract. This version uses concrete metrics.

### Prompt

```
Step 1: Query CPU saturation:
        timeseries from:now() - <time_range>,
        {
          cpu_usage = avg(dt.host.cpu.usage),
          cpu_system = avg(dt.host.cpu.system),
          cpu_iowait = avg(dt.host.cpu.iowait)
        }

Step 2: Query memory saturation:
        timeseries from:now() - <time_range>,
        {
          memory_used = avg(dt.host.memory.usage),
          memory_avail = avg(dt.host.memory.avail)
        }

Step 3: Query service throughput:
        timeseries from:now() - <time_range>,
        by:{dt.entity.service},
        {
          request_count = sum(dt.service.request.count),
          response_time = avg(dt.service.request.response_time)
        }

Step 4: Provide:
        - Resources approaching saturation (>80% utilization)
        - Throughput trends per service
        - Correlation between saturation and response time
        - Early saturation warning signals
        - Capacity headroom per resource type
```

---

# 9. Observability Reporting

---

## 9.1 Daily Operational Summary

### Prompt

```
Step 1: List all problems in the last 24 hours (both ACTIVE and CLOSED).

Step 2: Query overall error rate trend:
        timeseries from:now() - 24h,
        {
          failure_count = sum(dt.service.request.failure_count),
          total_count = sum(dt.service.request.count)
        }

Step 3: List all exceptions in the last 24 hours.

Step 4: Query resource utilization summary:
        timeseries from:now() - 24h,
        {
          avg_cpu = avg(dt.host.cpu.usage),
          avg_memory = avg(dt.host.memory.usage)
        }

Step 5: Generate a summary report:
        ## Daily Ops Summary — <date>

        ### Incidents
        - Active problems: <count>
        - Closed problems: <count>
        - Most critical: <problem_description>

        ### Performance
        - Average error rate: <value>
        - Average response time: <value>

        ### Resources
        - Cluster CPU utilization: <value>%
        - Cluster Memory utilization: <value>%

        ### Risks & Warnings
        - <list any capacity warnings, security issues, or anomalies>

        ### Recommended Actions
        - <prioritized list of actions>
```

---

## 9.2 Executive Summary

### Prompt

```
Step 1: List all active problems.

Step 2: List all critical/high vulnerabilities.

Step 3: Query overall service health:
        timeseries from:now() - 24h,
        {
          total_requests = sum(dt.service.request.count),
          total_failures = sum(dt.service.request.failure_count),
          avg_response_time = avg(dt.service.request.response_time)
        }

Step 4: Generate an executive-friendly summary:
        ## System Health — <date>

        **Overall Status:** 🟢 Healthy / 🟡 Degraded / 🔴 Critical

        ### Key Metrics (Last 24 Hours)
        | Metric | Value |
        |--------|-------|
        | Total Requests | |
        | Success Rate | |
        | Avg Response Time | |
        | Active Incidents | |
        | Active Vulnerabilities | |

        ### Top Risks
        1. <risk_description>

        ### Actions in Progress
        1. <action_description>

        (Avoid technical jargon. Focus on business impact.)
```

---

## 9.3 Weekly Reliability Review

### Prompt

```
Step 1: List all problems from the last 7 days.
        Group by event.category and count.

Step 2: Query response time and error rate over 7 days:
        timeseries from:now() - 7d,
        by:{dt.entity.service},
        {
          avg_response = avg(dt.service.request.response_time),
          failure_rate = avg(dt.service.request.failure_rate)
        }

Step 3: List top recurring problems (same root_cause_entity):
        fetch dt.davis.problems, from:now() - 7d
        | summarize count = count(),
          by:{root_cause_entity_name, event.category}
        | sort count desc

Step 4: Generate report:
        ## Weekly Reliability Report — Week of <date>

        ### Incident Summary
        - Total incidents: <count>
        - Mean time to detect (MTTD): <value>
        - Mean time to resolve (MTTR): <value>

        ### Recurring Failures
        | Entity | Category | Occurrences |
        |--------|----------|-------------|

        ### Performance Trends
        - Services improving: <list>
        - Services degrading: <list>

        ### Resource Bottlenecks
        - <list>

        ### Optimization Opportunities
        - <list>
```

---

## 9.4 Incident Briefing Document

### Prompt

```
Step 1: Fetch full details for problem "<problem_id>":
        (Use detailed problem query from prompt 1.3 Step 1)

Step 2: Map affected entities and dependency chain.

Step 3: Query user impact if applicable:
        Check affected_users_count from problem details.

Step 4: Generate incident brief:
        ## Incident Brief — <problem_id>

        ### Timeline
        | Time | Event |
        |------|-------|
        | <start> | Incident detected |
        | <end> | Incident resolved |

        ### Business Impact
        - Affected users: <count>
        - Affected services: <list>
        - Severity: <level>
        - Duration: <minutes> minutes

        ### Root Cause
        <root_cause_description>

        ### Resolution
        <what was done to resolve>

        ### Prevention
        1. <action to prevent recurrence>
        2.
        3.
```

---

# 10. Proactive & Autonomous Operations

---

## 10.1 Early Warning Signal Detection

### Prompt

```
Step 1: Run anomaly detection on service response times:
        Execute the "dt.statistics.anomaly_detection.SeasonalBaselineAnomalyDetectionAnalyzer"
        on service response time data for the last 24 hours.

Step 2: Query error rate changes:
        timeseries from:now() - 6h,
        by:{dt.entity.service},
        failure_rate = avg(dt.service.request.failure_rate)
        (Look for services where error rate is trending upward)

Step 3: Query resource utilization approaching limits:
        timeseries from:now() - 6h,
        by:{k8s.workload.name, k8s.namespace.name},
        {
          cpu_ratio = avg(dt.containers.cpu.throttling_ratio),
          memory_used = avg(dt.containers.memory.resident_set_bytes),
          memory_limit = avg(dt.kubernetes.container.limits_memory)
        }
        (Flag workloads with cpu_ratio > 1.5 or memory > 80% of limit)

Step 4: Query container restart trends:
        timeseries from:now() - 6h,
        by:{k8s.workload.name},
        restarts = sum(dt.kubernetes.container.restarts)
        (Flag workloads with increasing restart count)

Step 5: Provide:
        - Weak signals detected (ranked by severity)
        - Services showing early degradation signs
        - Resources approaching saturation
        - Restart patterns indicating instability
        - Recommended preemptive actions
```

---

## 10.2 Self-Healing Candidate Identification

### Prompt

```
Step 1: Query recurring problems over 30 days:
        fetch dt.davis.problems, from:now() - 30d
        | summarize
            occurrence_count = count(),
            avg_duration = avg(duration),
          by:{root_cause_entity_name, event.category, event.description}
        | filter occurrence_count >= 3
        | sort occurrence_count desc

Step 2: Categorize by automation potential:
        - Pod restarts → auto-restart or auto-scale
        - Resource limits → auto-tune requests/limits
        - No pod ready → auto-rollback or scale-up
        - Memory pressure → auto-scale or evict

Step 3: Provide:
        - Top 10 recurring incident patterns
        - Self-healing automation candidates with:
          | Pattern | Occurrences | Avg Duration | Automation Type |
          |---------|-------------|--------------|-----------------|
        - Recommended Dynatrace Workflow automations
        - Estimated operational hours saved per month
```

---

## 10.3 Autonomous SRE Agent Summary

### Prompt

```
Step 1: List all active problems.
Step 2: List all vulnerabilities with risk score >= 8.
Step 3: List all exceptions in the last 6 hours.
Step 4: Query CPU throttling:
        timeseries from:now() - 6h,
        avg_throttle = avg(dt.containers.cpu.throttling_ratio)
Step 5: Query memory utilization:
        timeseries from:now() - 6h,
        avg_memory = avg(dt.host.memory.usage)
Step 6: Query error rate:
        timeseries from:now() - 6h,
        failure_rate = avg(dt.service.request.failure_rate)

Compile all findings into a prioritized action list:

## SRE Agent Report — <timestamp>

### 🔴 Immediate Action Required
1. <highest priority issue>

### 🟡 Attention Needed
1. <moderate priority issue>

### 🟢 Monitoring
1. <low priority / tracking items>

### 📊 Health Metrics
| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| CPU Throttling Ratio | | <1.5 | |
| Memory Utilization | | <85% | |
| Error Rate | | <1% | |
| Active Problems | | 0 | |
| Critical Vulnerabilities | | 0 | |

### Recommended Automations
1. <suggestion>
```

---

# 11. Network & Connectivity

---

## 11.1 Network Latency & Connectivity Analysis

### Context
v1 prompt failed — too vague. This version uses service-level spans and TCP metrics.

### Prompt

```
Step 1: Query inter-service call latency:
        fetch spans, from:now() - <time_range>
        | filter span.kind == "client" or span.kind == "producer"
        | summarize
            avg_duration = avg(duration),
            p95 = percentile(duration, 95),
            error_count = countIf(otel.status_code == "ERROR"),
          by:{service.name, peer.service}
        | sort p95 desc

Step 2: Query service-level error rates for connectivity issues:
        fetch spans, from:now() - <time_range>
        | filter exception.type contains "Connect" or exception.type contains "Timeout"
          or exception.type contains "DNS" or exception.type contains "Socket"
          or exception.message contains "connection reset"
          or exception.message contains "connection refused"
        | summarize count = count(), by:{service.name, exception.type, exception.message}
        | sort count desc

Step 3: Query error logs related to network issues:
        fetch logs, from:now() - <time_range>
        | filter loglevel == "ERROR"
        | filter matchesPhrase(content, "connection reset") or matchesPhrase(content, "timeout")
          or matchesPhrase(content, "connection refused") or matchesPhrase(content, "DNS")
          or matchesPhrase(content, "socket") or matchesPhrase(content, "ECONNREFUSED")
        | summarize count = count(), by:{k8s.workload.name, content}
        | sort count desc
        | limit 10

Step 4: Provide:
        - Inter-service latency map (service → dependency → P95 latency)
        - Connection failures by type
        - DNS resolution issues
        - Timeout patterns
        - Network-related error logs
        - Recommendations for connectivity improvements
```

---

## 11.2 SLO Compliance & Error Budget Tracking

### Context
v1 prompt failed — requires pre-configured SLOs. This version constructs SLO-like metrics from raw data.

### Prompt

```
Step 1: Calculate availability SLO for "<service_name>" (target: 99.9%):
        fetch spans, from:now() - <time_range>
        | filter service.name == "<service_name>"
        | summarize
            total = count(),
            successful = countIf(http.response.status_code < 500),
            failed = countIf(http.response.status_code >= 500)
        | fieldsAdd availability = successful / total * 100.0,
          error_budget_total = total * 0.001,
          error_budget_remaining = (total * 0.001) - failed

Step 2: Calculate latency SLO (target: P95 < 500ms):
        fetch spans, from:now() - <time_range>
        | filter service.name == "<service_name>"
        | summarize
            p95 = percentile(duration, 95),
            within_slo = countIf(duration <= 500000000) / count() * 100.0

Step 3: Track burn rate (errors over time):
        fetch spans, from:now() - <time_range>
        | filter service.name == "<service_name>"
        | makeTimeseries
            error_count = countIf(http.response.status_code >= 500),
            total_count = count(),
          interval:1h

Step 4: Provide:
        - Availability SLO: <value>% (target: 99.9%)
        - Error Budget Remaining: <value> errors
        - Error Budget Burn Rate: <value> errors/hour
        - Latency SLO: <p95_value>ms (target: 500ms)
        - Requests within latency SLO: <value>%
        - Burn rate trend: SAFE / WARNING / CRITICAL
        - Estimated time to error budget exhaustion
        - Recommendations to protect error budget
```

---

## 11.3 Alert Noise Analysis

### Context
v1 prompt failed — alert metadata not directly queryable. This version uses problem frequency analysis.

### Prompt

```
Step 1: Query problem frequency by root cause entity:
        fetch dt.davis.problems, from:now() - 7d
        | summarize
            occurrence_count = count(),
            avg_duration = avg(duration),
          by:{root_cause_entity_name, event.category}
        | sort occurrence_count desc

Step 2: Identify rapid open/close cycles (flapping):
        fetch dt.davis.problems, from:now() - 7d
        | filter duration < 300000000000
        | summarize
            short_lived_count = count(),
          by:{root_cause_entity_name, event.category}
        | filter short_lived_count >= 5
        | sort short_lived_count desc

Step 3: Provide:
        - Top 10 most frequent problem sources
        - Flapping entities (problems lasting < 5 minutes, occurring 5+ times)
        - Recommended alert tuning:
          | Entity | Current Behavior | Recommendation |
          |--------|-----------------|----------------|
        - Muting candidates
        - Anomaly detection sensitivity adjustments
        - Estimated alert reduction percentage
```

---

# Appendix

## A. Placeholder Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `<cluster_name>` | Kubernetes cluster name | qtygkeclp01 |
| `<namespace>` | Kubernetes namespace | imp, liveeng, agtest |
| `<service_name>` | Service display name | DashboardService |
| `<SERVICE-ID>` | Dynatrace entity ID | SERVICE-80108432AE306C69 |
| `<problem_id>` | Problem display ID | P-26022551 |
| `<time_range>` | DQL time expression | 6h, 24h, 7d, 30d |
| `<error_message>` | Error text to search for | "No pod ready" |
| `<min_score>` | Minimum vulnerability score | 8.0 |
| `<deployment_time>` | ISO timestamp of deploy | 2026-02-10T14:00:00Z |
| `<top_service>` | Service from prior results | DashboardService |
| `<top_route>` | Route from prior results | /dashboard/v1/graphql |
| `<vuln_id>` | Vulnerability ID | 1814791744714760537 |
| `<error_id>` | Exception error ID | f22dfbe069ca7262 |

---

## B. Key DQL Metrics Reference

### Container Metrics
| Metric | Description |
|--------|-------------|
| `dt.containers.cpu.usage_user_time` | Container CPU user time |
| `dt.containers.cpu.usage_system_time` | Container CPU system time |
| `dt.containers.cpu.throttled_time` | CPU throttled time |
| `dt.containers.cpu.throttling_ratio` | CPU throttling ratio |
| `dt.containers.memory.resident_set_bytes` | Container memory RSS |

### Kubernetes Metrics
| Metric | Description |
|--------|-------------|
| `dt.kubernetes.container.limits_cpu` | CPU limit |
| `dt.kubernetes.container.limits_memory` | Memory limit |
| `dt.kubernetes.container.requests_cpu` | CPU request |
| `dt.kubernetes.container.requests_memory` | Memory request |
| `dt.kubernetes.container.restarts` | Container restarts |
| `dt.kubernetes.workload.pods_ready` | Ready pod count |
| `dt.kubernetes.workload.pods_desired` | Desired pod count |

### Host Metrics
| Metric | Description |
|--------|-------------|
| `dt.host.cpu.usage` | Host CPU usage % |
| `dt.host.cpu.system` | Host CPU system % |
| `dt.host.cpu.iowait` | Host CPU I/O wait % |
| `dt.host.memory.usage` | Host memory usage % |
| `dt.host.memory.avail` | Host available memory |

### Service Metrics
| Metric | Description |
|--------|-------------|
| `dt.service.request.response_time` | Response time |
| `dt.service.request.count` | Request count |
| `dt.service.request.failure_count` | Failure count |
| `dt.service.request.failure_rate` | Failure rate |

---

## C. Davis Analyzers Available

| Analyzer | Name |
|----------|------|
| Forecast | `dt.statistics.GenericForecastAnalyzer` |
| Anomaly Detection (Adaptive) | `dt.statistics.anomaly_detection.AutoAdaptiveAnomalyDetectionAnalyzer` |
| Anomaly Detection (Seasonal) | `dt.statistics.anomaly_detection.SeasonalBaselineAnomalyDetectionAnalyzer` |
| Anomaly Detection (Static) | `dt.statistics.anomaly_detection.StaticThresholdAnomalyDetectionAnalyzer` |
| Novelty Score | `dt.statistics.NoveltyScoreAnalyzer` |

---

## D. Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Original | Initial 43 prompts |
| **v0.2** | **2026-02-11** | **Enhanced & fine-tuned: 34 prompts covering all 43 original use cases. Added DQL metrics, step-by-step orchestration, expected outputs, fixed 11 failed prompts, added appendix with metric reference.** |

---

*End of Dynatrace MCP Prompts v0.2*
