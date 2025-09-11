# Dynatrace Operator Prerequisites for AKS

Before deploying the Dynatrace Operator on your AKS clusters, please ensure the following prerequisites are in place:

---

## 1. Dynatrace Environment and Tokens

* **Active Dynatrace Environment**: A SaaS or Managed Dynatrace environment is required to register your AKS cluster and send monitoring data.
* **Access Tokens** (to be created in Dynatrace and stored as Kubernetes Secrets):

  * **Operator Token** – manages the lifecycle and configuration of the Operator in the cluster. Use the template **"Kubernetes: Dynatrace Operator"** when creating the token for automatic scope assignment.
    * Required scopes include: PaaS Installer, Read/Write settings, Create ActiveGate token
  * **Data Ingest Token** – used to inject and ingest monitoring data from workloads. Use the template **"Kubernetes: Data Ingest"** when creating the token.
    * Recommended scopes include: Ingest metrics, Ingest logs, Ingest OpenTelemetry traces

> **💡 Tip**: Use the predefined token templates in Dynatrace (Access Tokens → Generate new token → Template) to automatically apply the correct scopes when generating tokens.

👉 Reference: [Tokens and Permissions Required](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/deployment/tokens-permissions)

---

## 2. Kubernetes / AKS Cluster Requirements

* **Version Compatibility**: The AKS cluster must run a supported Kubernetes version:
  * **Currently Supported**: Kubernetes 1.24 - 1.33
  * **Full Support**: Latest versions receive comprehensive testing and support
  * **Maintenance Support**: Older versions receive limited support for ~1 year after end-of-life
  * Please refer to the [Kubernetes Support Matrix](https://docs.dynatrace.com/docs/ingest-from/technology-support/support-model-for-kubernetes) for detailed version lifecycle information.

* **Architecture Support**: Dynatrace Operator supports multiple architectures:
  * x86 (primary)
  * ARM
  * ppc64le
  * s390x (limited deployment modes)

* **Cluster Access**: Administrative access (`kubectl`) with sufficient privileges (ideally `cluster-admin`) to deploy CRDs, Secrets, and webhooks.

* **Dedicated Namespace**: A namespace (commonly `dynatrace`) should be created to host the Operator's components.

* **Installation Methods**:
  * **Helm v3** (recommended): Direct installation using Helm charts
  * **Marketplace Deployments**: Available via Azure Marketplace, AWS Marketplace, GKE Marketplace
  * **Manual**: Using kubectl with YAML manifests

👉 References:

* [Kubernetes Support Matrix](https://docs.dynatrace.com/docs/ingest-from/technology-support/support-model-for-kubernetes)
* [Deployment Options](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/deployment)

---

## 3. Network and Security

* **Egress Network Access**: Outbound connectivity is required from Operator pods to:
  * Dynatrace environment API endpoint (e.g., `https://<env>.live.dynatrace.com/api`) over port 443
  * Dynatrace container registry: `public.ecr.aws/dynatrace/dynatrace-operator` over port 443
  * Cluster DNS service (`kube-dns`)

* **Webhook Component**: The Dynatrace webhook requires:
  * Ability to receive incoming HTTPS requests from the Kubernetes API server
  * Default deployment with 2 replicas for high availability
  * Validates and mutates Pod and Namespace definitions

* **Private Container Registry (Optional)**: If public registry access is restricted, Dynatrace images can be mirrored to a private registry and accessed via a custom pull secret.

* **Proxy Configuration**: If outbound traffic is restricted, configure proxy settings for:
  * Dynatrace Operator
  * ActiveGate components
  * OneAgent components

* **Security Considerations**:
  * CSI driver requires privileged container permissions for mount operations
  * Webhook requires TLS certificates (automatically managed by the Operator)
  * Network policies should allow required ingress/egress traffic

👉 References:

* [Network Traffic Documentation](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/reference/network)
* [Security Documentation](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/reference/security)

---

## 4. Resource and Storage Requirements

* **Operator Components**:
  * **Operator**: 1 replica per cluster (leader election ensures only one active)
    * Configurable CPU/memory requests and limits via Helm values
  * **Webhook**: 2 replicas per cluster (for high availability)
    * Configurable CPU/memory requests and limits via Helm values
  * **CSI Driver**: 1 replica per node (DaemonSet deployment)
    * No predefined resource limits by default

* **Storage Requirements**:
  * **With CSI Driver** (Recommended):
    * Code modules cached once per node (efficient storage usage)
    * Shared modules across all Pods on the same node via OverlayFS
    * Typical storage requirement: ~1-2GB per node for code modules
    * Writable storage for OneAgent configurations on read-only filesystems
  * **Without CSI Driver**:
    * Each monitored Pod downloads and stores its own code modules
    * Higher storage and network overhead
    * Each Pod requires ephemeral storage for agent binaries/logs

* **Benefits of CSI Driver**:
  * **Storage Efficiency**: 100 Pods across 3 nodes = 3 code module downloads (vs 100 without CSI)
  * **Network Efficiency**: Reduced downloads from Dynatrace environment
  * **Performance**: Faster Pod startup times for subsequent deployments

* **Node Storage Considerations**:
  * Ensure adequate space in kubelet root directory
  * Monitor disk space usage on nodes hosting many monitored workloads
  * Consider node storage capacity when planning deployment scale

👉 References:

* [Dynatrace Operator Components](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/how-it-works/components/dynatrace-operator)
* [Storage Requirements](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/reference/storage)

---

## 5. Deployment Mode Considerations

Dynatrace Operator supports multiple observability modes. Choose based on your monitoring requirements:

* **Platform Monitoring**:
  * Kubernetes cluster health and performance monitoring
  * No application-level instrumentation
  * Minimal resource overhead

* **Application Observability**:
  * Platform monitoring + automatic application instrumentation
  * Code module injection into application Pods
  * Requires CSI driver for optimal performance

* **Full-Stack Observability**:
  * Complete observability stack including infrastructure monitoring
  * Host-level monitoring with OneAgent
  * Maximum visibility with higher resource requirements

> **📋 Recommendation**: Start with Application Observability mode for most use cases, then upgrade to Full-Stack if infrastructure monitoring is required.

---

## 6. Additional Technical Requirements

* **Container Runtime Compatibility**:
  * Supported: containerd, CRI-O, Docker (deprecated)
  * Required for log collection and container insights
  * Ensure runtime socket is accessible for monitoring

* **RBAC Requirements**:
  * Cluster-level permissions for Operator deployment
  * Namespace-level permissions for workload monitoring
  * Custom roles can be defined for security hardening

* **Certificate Management**:
  * Webhook TLS certificates automatically managed by Operator
  * Custom CA certificates supported for enterprise environments
  * Certificate rotation handled automatically

* **Monitoring Scope Configuration**:
  * Namespace labeling for selective monitoring
  * Annotation-based inclusion/exclusion of workloads
  * Custom injection rules via DynaKube configuration

* **FIPS Compliance (Optional)**:
  * FIPS-compliant Dynatrace images available
  * Required for government and regulated environments
  * May impact performance and feature availability

👉 References:

* [Deployment Modes](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/deployment)
* [RBAC Security](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/reference/security)

---

## 7. Pre-Deployment Checklist

Before starting your Dynatrace Operator deployment, verify the following:

* [ ] **Dynatrace Environment**: SaaS/Managed environment is accessible
* [ ] **Tokens Created**: Operator and Data Ingest tokens generated with correct scopes
* [ ] **Kubernetes Version**: Cluster runs supported Kubernetes version (1.24+)
* [ ] **Network Access**: Outbound connectivity to Dynatrace APIs and registries verified
* [ ] **Permissions**: Administrative access to deploy cluster-wide resources confirmed
* [ ] **Deployment Mode**: Selected appropriate observability mode for your requirements
* [ ] **Storage Planning**: Node storage capacity assessed for CSI driver requirements
* [ ] **Resource Limits**: Resource quotas and limits reviewed for Operator components

---

## 🚀 Next Steps

Once prerequisites are satisfied:

1. **Choose Deployment Method**: Helm, Marketplace, or manual YAML
2. **Create Namespace**: `kubectl create namespace dynatrace`
3. **Store Tokens**: Create Kubernetes secrets for Operator and Data Ingest tokens
4. **Deploy Operator**: Follow the selected deployment method
5. **Configure DynaKube**: Create DynaKube custom resource for your monitoring requirements
6. **Verify Deployment**: Check Operator logs and monitor rollout status

✅ **Success Criteria**: With these prerequisites in place, the Dynatrace Operator can be deployed seamlessly on your AKS cluster, providing comprehensive observability for your Kubernetes workloads.

👉 **Getting Started**: [Dynatrace Operator Deployment Guide](https://docs.dynatrace.com/docs/ingest-from/setup-on-k8s/deployment)
