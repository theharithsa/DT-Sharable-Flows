## Specific error message RCA at a period of time

Analyze and validate the <Namespace>namespace in <cluster>kubernetes cluster over <time range> with <error message>. 
Validate and provide the details as why this issue occurred and share the root cause analysis and proper insights and recommendation steps to fix this issue.

---

## High-level RCA

Analyze the Dynatrace data for <application/service name> in <environment>/ <cluster> during <time window>. Identify the primary root cause of the degradation or outage.
Correlate metrics, events, logs, and dependencies.
Summarize findings with impact, timeline, and triggering factors.

---

## Problem or Service RCA with Dependency Mapping

Perform an end-to-end root cause analysis for <problem ID or service>.
Include:
- Causal chain across services
- Upstream/downstream dependency impact
- Anomalous metrics and events
- Probable root cause with confidence level

---

## Validation of metrics for an entity or service

Run a Dynatrace DQL query to validate <metric name> for <entity/service>.
Compare actual values against baseline and expected thresholds for <time range>.
Highlight anomalies and data gaps

---

## Data consistency check on a service or namespace workload

Validate the consistency of metrics and logs for <service> in <environment>.
Check for missing data, ingestion delays, or abnormal sampling during <time window>.
Provide a data health summary.

---

## Performance trend analysis

Analyze performance trends for <application/service> in <environment> over the last <X hours/days>.
Identify deviations from historical baselines.
Call out leading indicators of performance regression.

---

## Regression Detection

Compare performance metrics of <service> in <environment> before and after <deployment/change>.
Identify regressions in response time, error rate, and throughput. Correlate findings with deployment events.

---

## Error-Centric Log Analysis

Analyze application logs for <service> in <environment> during <time window>.
Identify recurring errors, exceptions, or stack traces.
Group them by frequency and severity. Correlate with service degradation.

---

## Log-to-Metric Correlation

Correlate application logs with CPU, memory, and response time metrics for <service> in <environment>.
Identify log patterns that align with performance anomalies.

---

## CPU Saturation Analysis

Analyze CPU utilization for <host/namespace/ workload/ pod/ container/process> in <environment>.
Identify saturation points, spikes, and abnormal consumption.
Determine whether CPU contention contributed to performance issues.

---

## CPU Capacity Planning

Evaluate CPU utilization trends for <namespace/workload/service> in <environment> over <time range>.
Assess whether current CPU allocation is sufficient. Provide scaling or optimization recommendations.

---

## Memory usage

Analyze Memory usage for <host/namespace/ workload/ pod/ container/process> in <environment>.
Identify average usage, spikes, and abnormal consumption.
Determine whether Memory contention contributed to performance issues.

---

## Memory capacity planning

Evaluate Memory usage trends for <namespace/workload/service> in <environment> over <time range>.
Assess whether current memory allocation is sufficient. Provide scaling or optimization recommendations.

---

## Incident briefing

Create an executive summary for the incident affecting <application/ service> in <environment> over <time range>.
Include:
- Business impact
- Root cause
- Time to detect and resolve
- Preventive recommendations

---

## Kubernetes Instability

Analyze current problems in the Kubernetes cluster and identify the most probable root cause. Correlate service errors, latency, CPU throttling, memory pressure, pod restarts, and recent deployments. Summarize findings and provide recommended remediation steps.

---

## CPU Throttling

Investigate CPU throttling across all Kubernetes workloads in the last 24 hours. Identify top affected pods, services, and nodes. Correlate throttling with request latency, error rates, and scaling behavior. Provide optimization recommendations.

---

## Memory Anomalies

Detect abnormal memory growth patterns across services in the last 48 hours. Identify potential memory leaks, GC pressure, container OOM events, and restart loops. Correlate with traffic spikes and deployment changes.

---

## Error Analysis

Analyze all HTTP 5xx errors in the last 6 hours. Group by service, endpoint, and root exception. Identify common failure patterns and likely root causes.

---

## Configuration Drift

Analyze recent configuration changes, ConfigMap updates, and Secret rotations. Identify whether any configuration drift correlates with service instability.

---

## Deployment Regression

Analyze the system behavior after the latest deployment. Compare performance, error rate, and resource usage before and after the release. Detect regressions and provide rollout risk assessment.

---

## Version Comparison

Compare health metrics between old and new versions of the service. Highlight differences in response time, failure rate, CPU, memory, and throughput. Recommend whether rollout is safe.

---

## Build Impact

Identify whether the latest build introduced performance regressions or stability risks. Correlate build version with incidents, latency spikes, and resource consumption.

---

## Canary Validation

Validate canary deployment behavior and confirm whether observed anomalies are isolated to the canary group.

---

## Cluster Health

Provide a holistic health overview of the Kubernetes cluster. Include workload stability, node utilization, pod density, scheduling efficiency, and resource saturation.

---

## Resource Optimization

Analyze current workload patterns and recommend optimal CPU and memory requests and limits. Suggest HPA tuning and node scaling strategies.

---

## Noisy Neighbors

Detect workloads causing noisy neighbor effects. Identify pods or namespaces consuming disproportionate resources and impacting cluster stability.

---

## Cost Optimization

Identify underutilized resources and over-provisioned workloads for cost and efficiency optimization.

---

## Impact Analysis

If a critical service fails, analyze dependent services, applications, and user journeys that would be impacted. Estimate technical and business impact.

---

## User Correlation

Correlate infrastructure and service problems with real user sessions. Quantify affected users and impacted user actions.

---

## Early Warnings

Detect early warning signals of instability using weak signals such as rising latency variance, queue buildup, retry storms, and garbage collection pressure.

---

## Operational Summary

Generate a daily operational health summary including incidents, risks, performance trends, capacity signals, and recommended preventive actions.

---

## Reliability Review

Provide a weekly reliability and performance analysis highlighting recurring failure patterns, resource bottlenecks, and optimization opportunities.

---

## Executive Summary

Summarize system health in business-friendly language suitable for executive stakeholders.

---

## Autonomous SRE

Act as an autonomous SRE agent. Continuously monitor system behavior and proactively surface anomalies, probable incidents, and optimization recommendations.

---

## Automated Remediation

Analyze failures and propose automated remediation steps including scaling actions, resource tuning, rollback triggers, and rollout safety controls.

---

## Self-Healing Candidates

Identify repetitive incident patterns and suggest candidates for self-healing automation.

---

## Latency metrics, service dependency map, anomaly detection

Detect tail latency (P95/P99) across services and correlate with dependencies and saturation signals

---

## Service flow, dependency health, error propagation

Analyze downstream dependency health and cascading failure risks

---

## HPA metrics, scaling events, workload load patterns

Evaluate autoscaling effectiveness and detect scaling delays or oscillations

---

## Trend analysis, capacity forecast charts

Predict future capacity requirements using historical trends

---

## Saturation metrics, throughput correlation

Detect early saturation across CPU, memory, disk, and network

---

## SLO dashboards, burn rate alerts

Track SLO compliance and error budget burn rate

---

## Deployment comparison, anomaly scores

Assess deployment safety and recommend rollout decisions

---

## Change events, incident timeline

Correlate incidents with recent changes and deployments

---

## Network metrics, service communication map

Detect abnormal network latency, packet loss, and DNS failures

---

## Pod lifecycle metrics, init container timing

Identify slow pod startups and initialization bottlenecks

---

## Queue metrics, backlog trends

Analyze queue depth and consumer lag patterns

---

## Auth logs, security events

Detect abnormal auth failures and access patterns

---

## Topology map, failure simulations

Identify single points of failure and missing redundancy

---

## Alert frequency analysis, noise reduction insights

Detect noisy alerts and recommend alert tuning

---

