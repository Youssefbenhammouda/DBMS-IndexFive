class BackendConnector {
  constructor({ baseUrl = "/api", fetchImpl } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    let resolvedFetch = fetchImpl;

    if (!resolvedFetch && typeof fetch === "function") {
      const globalTarget = typeof globalThis !== "undefined" ? globalThis : undefined;
      resolvedFetch = globalTarget ? fetch.bind(globalTarget) : fetch;
    }

    this.fetchImpl = resolvedFetch;
    this.resourceResolvers = new Map();
  }

  registerResource(resourceKey, resolver) {
    if (!resourceKey || typeof resolver !== "function") {
      throw new Error("registerResource expects a key and resolver function");
    }
    this.resourceResolvers.set(resourceKey, resolver);
    return () => this.resourceResolvers.delete(resourceKey);
  }

  async get(resourceKey, params = {}) {
    if (!resourceKey) throw new Error("resourceKey is required");

    if (this.resourceResolvers.has(resourceKey)) {
      return this.resourceResolvers.get(resourceKey)(params);
    }

    if (!this.fetchImpl) {
      throw new Error(`No resolver or fetch implementation available for ${resourceKey}`);
    }

    const query = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) return acc;
        acc[key] = value;
        return acc;
      }, {}),
    ).toString();

    const url = `${this.baseUrl}/${resourceKey}${query ? `?${query}` : ""}`;
    const response = await this.fetchImpl(url, { headers: { "Content-Type": "application/json" } });

    const contentType = response.headers?.get?.("Content-Type") || "";
    const isJson = contentType.includes("application/json");
    let payload = null;

    if (isJson) {
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && !Array.isArray(payload) && payload.message) ||
        `Backend responded with status ${response.status} for ${resourceKey}`;
      throw new Error(message);
    }

    return payload;
  }
}

export default BackendConnector;
