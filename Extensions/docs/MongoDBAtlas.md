# MongoDB Atlas Monitoring with Dynatrace

## Overview

This document provides a comprehensive guide on integrating MongoDB Atlas with Dynatrace using the official Dynatrace MongoDB Atlas extension. This integration enables real-time monitoring, observability, and automated anomaly detection powered by Dynatrace's Davis AI.

**For detailed extension content, visit:** [Dynatrace MongoDB Atlas Extension](https://www.dynatrace.com/hub/detail/mongodb-atlas/)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Pre-requisites](#pre-requisites)
3. [Architecture and Data Flow](#architecture-and-data-flow)
4. [API Endpoints and Data Collection](#api-endpoints-and-data-collection)
5. [API Key Creation & Security](#api-key-creation--security)
6. [Configuring Dynatrace Extension](#configuring-dynatrace-extension)
7. [Dynatrace Metrics & Events](#dynatrace-metrics--events)
8. [Troubleshooting & Best Practices](#troubleshooting--best-practices)
9. [Security and Compliance Considerations](#security-and-compliance-considerations)
10. [FAQ](#faq)
11. [Supporting Links](#supporting-links)

---

## Introduction

The MongoDB Atlas Dynatrace extension enables seamless observability of MongoDB Atlas deployments within Dynatrace environments, providing visibility into performance metrics, operational insights, and anomaly detection capabilities. Dynatrace's AI-driven insights and dashboards enhance operational efficiency and proactive issue resolution.

---

## Pre-requisites

Ensure the following before starting the integration:

* Active Dynatrace environment (SaaS/Managed)
* Access to MongoDB Atlas environment with necessary administrative permissions
* MongoDB Atlas Admin API key (read-only preferred)
* Dynatrace ActiveGate with outbound internet connectivity
* MongoDB Atlas Project ID

---

## Architecture and Data Flow

Diagram showing the integration architecture between Dynatrace and MongoDB Atlas. On the left, a purple box labeled Dynatrace contains an icon for Dashboards and the word Dashboards. In the center, a purple box labeled Dynatrace ActiveGate connects Dynatrace to MongoDB Atlas. Arrows indicate data flow: an API key connects Dashboards to Dynatrace ActiveGate, and Dynatrace ActiveGate communicates with MongoDB Atlas using the MongoDB Atlas Administration API. On the right, a white box labeled MongoDB Atlas lists Projects, Clusters, Nodes, Metrics, and Events, with each item marked by a green dot. The diagram visually explains how Dynatrace ActiveGate securely collects monitoring data from MongoDB Atlas and makes it available for analysis and visualization in Dynatrace dashboards. The tone is neutral and informative, focusing on technical clarity.

![MogoDB Architecture](assets/mongodb-atlas-architecture.png)

### Architectural Overview

* **Dynatrace ActiveGate**: The central component facilitating secure API communication.
* **MongoDB Atlas API**: Dynatrace fetches monitoring data via secure API calls.
* **Data Flow**: ActiveGate securely pulls data from MongoDB Atlas API and pushes it into Dynatrace for analysis.

### Step-by-Step Data Flow

1. Dynatrace securely stores Atlas Admin API keys.
2. ActiveGate initiates secure API calls (HTTPS GET) to MongoDB Atlas.
3. Atlas responds with JSON-formatted metrics and event data.
4. Dynatrace converts and ingests data, visualizing it on dashboards and processing it for Davis AI.

---

## API Endpoints and Data Collection

Dynatrace extension fetches data from the following MongoDB Atlas Admin API endpoints:

| Purpose                    | API Endpoint                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| List Projects              | `GET /groups`                                                      |
| Get Clusters               | `GET /groups/{projectId}/clusters`                                 |
| Get Processes              | `GET /groups/{projectId}/processes`                                |
| Process Metrics            | `GET /groups/{projectId}/processes/{hostname}:{port}/measurements` |
| Disk Partitions (optional) | `GET /groups/{projectId}/processes/{hostname}:{port}/disks`        |
| Project Events (optional)  | `GET /groups/{projectId}/events`                                   |

These endpoints are read-only, ensuring no modification to MongoDB data or configuration.

---

## API Key Creation & Security

### Recommended API Key Permissions

* `ORG_READ_ONLY` for org-wide metrics [For more details about Org API](https://www.mongodb.com/docs/atlas/configure-api-access/#std-label-create-org-api-key).
* `PROJECT_READ_ONLY` for single-project monitoring
* `PROJECT_DATA_ACCESS_ADMIN` for detailed metrics collection (recommended)

### Security Best Practices

* Securely store API keys in Dynatrace configuration.
* Regularly rotate API keys based on company policies.
* Restrict IP whitelist in Atlas to ActiveGate IP addresses.

---

## Configuring Dynatrace Extension

Follow these steps in Dynatrace:

1. Navigate to Dynatrace Hub → MongoDB Atlas Extension.
2. Install the extension on an ActiveGate.
3. Configure the following:

   * Project ID
   * Atlas API Public and Private keys
   * Polling interval (default: 1 min recommended)
   * Optionally enable disk partition and event monitoring.
4. Save configuration and verify the connection status.

---

## Dynatrace Metrics & Events

### Collected Metrics

* CPU, memory, network, connections, and storage usage
* Disk performance metrics (if enabled)

### Collected Events (if enabled)

* Authentication events
* Cluster changes (creation, deletion)
* Backup and restore operations
* Operational alerts from MongoDB Atlas

All events appear as log events in Dynatrace, allowing custom log analytics.

---

## Troubleshooting & Best Practices

### Common Issues

* **API access errors**: Validate API key roles and IP whitelisting.
* **Missing metrics/events**: Ensure correct API permissions.

### Best Practices

* Use dedicated monitoring-only API keys.
* Regularly validate data ingestion and dashboards.
* Monitor ActiveGate health and connectivity.

---

## Security and Compliance Considerations

* Data transferred is read-only.
* API keys stored securely in Dynatrace.
* Ensure compliance with organizational security policies (GDPR, ISO 27001).

---

## FAQ

Absolutely, here are expanded FAQs you can add (all answers are Dynatrace-context, forward-looking, and clear):

---

### **Additional FAQs for MongoDB Atlas Dynatrace Integration**

---

**Q: How does DDU licensing work for the MongoDB Atlas Dynatrace extension?**

A: The metrics and events collected through this extension consume Dynatrace Davis Data Units (DDUs).
For details, see: [DDUs for metrics](https://www.dynatrace.com/support/help/shortlink/metrics-ddu).

* The extension monitors **all clusters** (deployments) within a MongoDB Atlas project.
* Each cluster has a number of nodes (processes), which is where process metrics are collected.
* If you enable disk metrics, those are collected from each node’s disk partition(s).

**General formula for DDU metric count:**

* **Process Metrics (Total = 108 per node):**
  `num_process_metrics = Number of projects × Clusters per project × Nodes per cluster × 108`

* **Disk Metrics (Total = 18 per partition):**
  `num_disk_metrics = Number of projects × Clusters per project × Nodes per cluster × Partitions per node × 18`

* **Total metrics:**
  `Total_metrics = num_process_metrics + num_disk_metrics`

The total DDU consumption depends on the number of clusters, nodes, partitions, and how many metrics you enable. Monitor your DDU usage in Dynatrace to optimize costs.

---

**Q: What is the business value of integrating MongoDB Atlas with Dynatrace?**

A: This integration brings real-time visibility and proactive monitoring to your cloud MongoDB environment. It helps teams quickly detect performance issues, anomalies, and potential risks before they impact users or critical business processes. With Dynatrace’s dashboards, AI-powered root cause analysis, and alerting, you minimize downtime, improve customer experience, and get actionable insights for both technical and business decisions.

---

**Q: How does this integration help the database team?**

A: The database team benefits by:

* Getting a unified view of MongoDB Atlas health, performance, and events alongside other monitored apps and infrastructure
* Receiving AI-driven problem detection and correlation (no more manual log digging)
* Accelerating incident response and root cause analysis, thanks to precise anomaly alerts and dashboards
* Reducing silos between DB, app, and ops teams, so everyone works from the same data and context

---

**Q: Will MongoDB logs be ingested into Dynatrace along with metrics?**

A: As of now, the official MongoDB Atlas Dynatrace extension ingests **metrics** and **Atlas platform events** (like cluster changes, alerts, and snapshots) as Dynatrace log events. It **does not directly collect full database logs** (such as slow query logs or audit logs) from MongoDB Atlas itself, because MongoDB Atlas does not expose raw database logs over its Admin API.
However, you can ingest Atlas “event” information—which covers high-level operational events—into Dynatrace log analytics.
If you require raw database log ingestion, you would need to export logs from Atlas separately (using Atlas automation or external storage integrations), and then use Dynatrace’s log ingest APIs to bring those in.

---

**Q: Can I limit which MongoDB Atlas projects or metrics are monitored to save on licensing?**

A: Yes, you can scope API keys to specific projects, and configure the Dynatrace extension to collect only the data you need. Adjust polling intervals and disable disk/event monitoring if not needed to control DDU consumption.

---

**Q: Is data collection secure and compliant?**

A: All data transfers are read-only, encrypted in transit, and API keys are securely stored within Dynatrace. You can restrict API key scope, IP whitelist, and revoke keys at any time for security compliance.

---

**Q: Is setup reversible? What if we want to disconnect later?**

A: Yes, you can disable or remove the Dynatrace extension at any time, revoke API keys in Atlas, and all data collection will immediately stop.

---

**Q: Who can access the MongoDB Atlas data inside Dynatrace?**

A: Access to ingested metrics/events is governed by Dynatrace user permissions and management zones, so you can restrict visibility as needed.

---

## Supporting Links

* [Dynatrace MongoDB Atlas Extension Documentation](https://www.dynatrace.com/hub/detail/mongodb-atlas/)
* [MongoDB Atlas API Documentation](https://www.mongodb.com/docs/atlas/api/)
* [Dynatrace ActiveGate Documentation](https://www.dynatrace.com/support/help/setup-and-configuration/dynatrace-activegate/)
* [Dynatrace Security Overview](https://www.dynatrace.com/security/)

---

This document ensures secure and efficient integration of MongoDB Atlas with Dynatrace, leveraging industry best practices for monitoring and observability.
