/*
 * Multi-Tenant DPS Billing Consolidator
 * ──────────────────────────────────────
 * Paste this into a Dynatrace Notebook TypeScript code cell.
 * Executes billing DQL across multiple tenants via Grail Query API,
 * consolidates into one table.
 *
 * https://developer.dynatrace.com/develop/sdks/client-query/
 */
export default async function () {
  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════

  // ⬇️ CHANGE TIMEFRAME HERE
  const FROM_DATE = "2025-05-11";
  const TO_DATE = "2025-05-31";

  // ⬇️ PLATFORM TOKEN (storage:queries:execute scope across all tenants)
  const PLATFORM_TOKEN = "<Platform Token>";

  // ⬇️ TARGET TENANTS
  const TENANTS = [
    { id: "tenant-id", name: "friendly name for tenant" }
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // DQL QUERY BUILDER
  // ═══════════════════════════════════════════════════════════════════════

  function buildQuery(from: string, to: string): string {
    return `smartscapeNodes "HOST"
| fieldsAdd memory_gib = toDouble(\`host.physical.memory\`) / 1073741824.0
| fieldsAdd AzureRG = coalesce(\`azure.resource.group\`, "N/A")
| fieldsAdd is_k8s = if(isNotNull(\`k8s.node.name\`), "Kubernetes", else: "Non-K8s")
| lookup [
    fetch dt.entity.host
    | fields id, tags, cloudType
    | fieldsAdd id = toSmartscapeId(id)
    | expand tag = tags
    | fieldsAdd cn = if(startsWith(tag, "ClientName:"), substring(tag, from: 11), else: null)
    | fieldsAdd env_val = if(startsWith(tag, "Environment:"), substring(tag, from: 12), else: null)
    | summarize ClientName = min(cn), Environment = min(env_val), cloudType = takeAny(cloudType), by: {id}
  ], sourceField: id, lookupField: id, prefix: "tag."
| fieldsAdd ClientName = coalesce(\`tag.ClientName\`, "NOT_TAGGED")
| fieldsAdd Environment = coalesce(\`tag.Environment\`, "NOT_TAGGED")
| fieldsAdd CloudVendor = coalesce(\`tag.cloudType\`, "UNKNOWN")
| fieldsAdd _k = "k"
| lookup [
    timeseries v = sum(\`dt.billing.full_stack_monitoring.usage\`), from: "${from}", to: "${to}"
    | fieldsAdd fsm_total_gib_hours = toDouble(arraySum(v))
    | fieldsAdd _k = "k"
    | fields _k, fsm_total_gib_hours
  ], sourceField: _k, lookupField: _k, prefix: "billing."
| fieldsAdd fsm_total_gib_hours = toDouble(\`billing.fsm_total_gib_hours\`)
| lookup [
    smartscapeNodes "HOST"
    | summarize total_mem_gib = sum(toDouble(\`host.physical.memory\`) / 1073741824.0)
    | fieldsAdd _k = "k"
    | fields _k, total_mem_gib
  ], sourceField: _k, lookupField: _k, prefix: "mem."
| fieldsAdd total_mem_gib = toDouble(\`mem.total_mem_gib\`)
| fieldsAdd host_billed_gib_hours = memory_gib / total_mem_gib * fsm_total_gib_hours
| summarize usage_qty = sum(host_billed_gib_hours), by: {ClientName, Environment, AzureRG, is_k8s, CloudVendor}
| fieldsAdd Capability = "Full-Stack Monitoring"
| fieldsAdd usage_unit = "memory-GiB-hours"
| fieldsAdd rate_card = "$250 per 100,000 memory-GiB-hours"
| fieldsAdd monthly_cost_usd = toDouble(round(usage_qty / 100000.0 * 250.0, decimals: 2))
| fields Capability, ClientName, Environment, AzureRG, is_k8s, CloudVendor, usage_qty, usage_unit, rate_card, monthly_cost_usd
| append [
    smartscapeNodes "HOST"
    | lookup [
        fetch dt.entity.host
        | fields id, tags, cloudType
        | fieldsAdd id = toSmartscapeId(id)
        | expand tag = tags
        | fieldsAdd cn = if(startsWith(tag, "ClientName:"), substring(tag, from: 11), else: null)
        | fieldsAdd env_val = if(startsWith(tag, "Environment:"), substring(tag, from: 12), else: null)
        | summarize ClientName = min(cn), Environment = min(env_val), cloudType = takeAny(cloudType), by: {id}
      ], sourceField: id, lookupField: id, prefix: "tag."
    | fieldsAdd ClientName = coalesce(\`tag.ClientName\`, "NOT_TAGGED")
    | fieldsAdd Environment = coalesce(\`tag.Environment\`, "NOT_TAGGED")
    | fieldsAdd AzureRG = coalesce(\`azure.resource.group\`, "N/A")
    | fieldsAdd is_k8s = if(isNotNull(\`k8s.node.name\`), "Kubernetes", else: "Non-K8s")
    | fieldsAdd CloudVendor = coalesce(\`tag.cloudType\`, "UNKNOWN")
    | summarize host_count = count(), by: {ClientName, Environment, AzureRG, is_k8s, CloudVendor}
    | fieldsAdd _k = "k"
    | lookup [
        timeseries v = sum(\`dt.billing.infrastructure_monitoring.usage\`), from: "${from}", to: "${to}"
        | fieldsAdd total_host_hours = toDouble(arraySum(v))
        | fieldsAdd _k = "k"
        | fields _k, total_host_hours
      ], sourceField: _k, lookupField: _k, prefix: "billing."
    | fieldsAdd total_host_hours = toDouble(\`billing.total_host_hours\`)
    | lookup [
        smartscapeNodes "HOST"
        | summarize total_hosts = count()
        | fieldsAdd _k = "k"
        | fields _k, total_hosts
      ], sourceField: _k, lookupField: _k, prefix: "hosts."
    | fieldsAdd total_hosts = toDouble(\`hosts.total_hosts\`)
    | fieldsAdd usage_qty = toDouble(host_count) / total_hosts * total_host_hours
    | fieldsAdd Capability = "Infrastructure Monitoring"
    | fieldsAdd usage_unit = "host-hours"
    | fieldsAdd rate_card = "$1,000 per 100,000 host-hours"
    | fieldsAdd monthly_cost_usd = toDouble(round(usage_qty / 100000.0 * 1000.0, decimals: 2))
    | fields Capability, ClientName, Environment, AzureRG, is_k8s, CloudVendor, usage_qty, usage_unit, rate_card, monthly_cost_usd
  ]
| append [
    timeseries steps = sum(\`dt.synthetic.browser.executions\`), from: "${from}", to: "${to}", by: {dt.entity.synthetic_test}
    | summarize total_steps = sum(toDouble(arraySum(steps))), by: {dt.entity.synthetic_test}
    | fieldsAdd monitor_tags = entityAttr(dt.entity.synthetic_test, "tags")
    | expand tag = monitor_tags
    | fieldsAdd cn = if(startsWith(tag, "ClientName:"), substring(tag, from: 11), else: null)
    | fieldsAdd env_val = if(startsWith(tag, "Environment:"), substring(tag, from: 12), else: null)
    | summarize usage_qty = takeAny(total_steps), ClientName = coalesce(min(cn), "NOT_TAGGED"), Environment = coalesce(min(env_val), "NOT_TAGGED"), by: {dt.entity.synthetic_test}
    | summarize usage_qty = sum(usage_qty), by: {ClientName, Environment}
    | fieldsAdd Capability = "Browser Synthetic Monitor"
    | fieldsAdd AzureRG = "N/A"
    | fieldsAdd is_k8s = "N/A"
    | fieldsAdd CloudVendor = "N/A"
    | fieldsAdd usage_unit = "browser-test-executions"
    | fieldsAdd rate_card = "$301 per 100,000 synthetic actions"
    | fieldsAdd monthly_cost_usd = toDouble(round(usage_qty / 100000.0 * 301.0, decimals: 2))
    | fields Capability, ClientName, Environment, AzureRG, is_k8s, CloudVendor, usage_qty, usage_unit, rate_card, monthly_cost_usd
  ]
| append [
    timeseries http_exec = sum(\`dt.synthetic.http.executions\`), from: "${from}", to: "${to}", by: {dt.entity.http_check}
    | summarize total_exec = sum(toDouble(arraySum(http_exec))), by: {dt.entity.http_check}
    | fieldsAdd monitor_tags = entityAttr(dt.entity.http_check, "tags")
    | expand tag = monitor_tags
    | fieldsAdd cn = if(startsWith(tag, "ClientName:"), substring(tag, from: 11), else: null)
    | fieldsAdd env_val = if(startsWith(tag, "Environment:"), substring(tag, from: 12), else: null)
    | summarize usage_qty = takeAny(total_exec), ClientName = coalesce(min(cn), "NOT_TAGGED"), Environment = coalesce(min(env_val), "NOT_TAGGED"), by: {dt.entity.http_check}
    | summarize usage_qty = sum(usage_qty), by: {ClientName, Environment}
    | fieldsAdd Capability = "HTTP Monitor"
    | fieldsAdd AzureRG = "N/A"
    | fieldsAdd is_k8s = "N/A"
    | fieldsAdd CloudVendor = "N/A"
    | fieldsAdd usage_unit = "http-executions"
    | fieldsAdd rate_card = "$33 per 100,000 HTTP requests"
    | fieldsAdd monthly_cost_usd = toDouble(round(usage_qty / 100000.0 * 33.0, decimals: 2))
    | fields Capability, ClientName, Environment, AzureRG, is_k8s, CloudVendor, usage_qty, usage_unit, rate_card, monthly_cost_usd
  ]
| append [
    timeseries val = sum(\`dt.billing.logs.ingest.usage_by_costcenter\`), from: "${from}", to: "${to}", by: {\`usage.bucket\`}
    | summarize total_bytes = sum(toDouble(arraySum(val))), by: {\`usage.bucket\`}
    | fieldsAdd usage_qty = total_bytes / 1073741824.0
    | fieldsAdd ClientName = \`usage.bucket\`
    | fieldsAdd Environment = "see-bucket-name"
    | fieldsAdd Capability = "Log Ingest & Process"
    | fieldsAdd AzureRG = "N/A"
    | fieldsAdd is_k8s = "N/A"
    | fieldsAdd CloudVendor = "N/A"
    | fieldsAdd usage_unit = "GiB"
    | fieldsAdd rate_card = "$700 per 10,000 GiB"
    | fieldsAdd monthly_cost_usd = toDouble(round(usage_qty / 10000.0 * 700.0, decimals: 2))
    | fields Capability, ClientName, Environment, AzureRG, is_k8s, CloudVendor, usage_qty, usage_unit, rate_card, monthly_cost_usd
  ]
| sort monthly_cost_usd desc`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GRAIL QUERY API CALLER
  // ═══════════════════════════════════════════════════════════════════════

  interface GrailResponse {
    state: "SUCCEEDED" | "RUNNING" | "FAILED" | "CANCELLED";
    progress: number;
    result?: { records: Record<string, unknown>[] };
    requestToken?: string;
    error?: { code: number; message: string };
  }

  interface BillingRow {
    Tenant: string;
    TenantId: string;
    Capability: string;
    ClientName: string;
    Environment: string;
    AzureRG: string;
    is_k8s: string;
    CloudVendor: string;
    usage_qty: number;
    usage_unit: string;
    rate_card: string;
    monthly_cost_usd: number;
  }

  async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function executeOnTenant(
    tenantId: string,
    query: string
  ): Promise<Record<string, unknown>[]> {
    const endpoint = `https://${tenantId}.apps.dynatrace.com/platform/storage/query/v1/query:execute`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PLATFORM_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        requestTimeoutMilliseconds: 60000,
        maxResultRecords: 10000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    let data: GrailResponse = await res.json();

    // Poll until query completes
    while (data.state === "RUNNING" && data.requestToken) {
      await sleep(3000);
      const pollRes = await fetch(
        `${endpoint}?request-token=${encodeURIComponent(data.requestToken)}`,
        { headers: { Authorization: `Bearer ${PLATFORM_TOKEN}` } }
      );
      if (!pollRes.ok) {
        throw new Error(`Poll failed: ${pollRes.status}`);
      }
      data = await pollRes.json();
    }

    if (data.state === "FAILED") {
      throw new Error(`Query failed: ${data.error?.message ?? "unknown"}`);
    }

    return data.result?.records ?? [];
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXECUTION
  // ═══════════════════════════════════════════════════════════════════════

  const query = buildQuery(FROM_DATE, TO_DATE);
  const allRows: BillingRow[] = [];

  for (const tenant of TENANTS) {
    try {
      const records = await executeOnTenant(tenant.id, query);

      for (const rec of records) {
        allRows.push({
          Tenant: tenant.name,
          TenantId: tenant.id,
          Capability: String(rec["Capability"] ?? ""),
          ClientName: String(rec["ClientName"] ?? ""),
          Environment: String(rec["Environment"] ?? ""),
          AzureRG: String(rec["AzureRG"] ?? "N/A"),
          is_k8s: String(rec["is_k8s"] ?? "N/A"),
          CloudVendor: String(rec["CloudVendor"] ?? "UNKNOWN"),
          usage_qty: Number(rec["usage_qty"] ?? 0),
          usage_unit: String(rec["usage_unit"] ?? ""),
          rate_card: String(rec["rate_card"] ?? ""),
          monthly_cost_usd: Number(rec["monthly_cost_usd"] ?? 0),
        });
      }
    } catch (err) {
      console.error(`${tenant.name} (${tenant.id}): ${(err as Error).message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONSOLIDATION & RETURN
  // ═══════════════════════════════════════════════════════════════════════

  return allRows
    .sort((a, b) => b.monthly_cost_usd - a.monthly_cost_usd)
    .map((r) => ({
      tenant: r.Tenant,
      tenant_id: r.TenantId,
      capability: r.Capability,
      client: r.ClientName,
      env: r.Environment,
      azure_rg: r.AzureRG,
      cloud_vendor: r.CloudVendor,
      k8s: r.is_k8s,
      usage: Math.round(r.usage_qty),
      unit: r.usage_unit,
      cost_usd: `$${r.monthly_cost_usd.toFixed(2)}`,
    }));
}
