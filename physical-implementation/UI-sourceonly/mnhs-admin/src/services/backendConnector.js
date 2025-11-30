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

  buildResolverKey(resourceKey, method = "GET") {
    return `${method.toUpperCase()}::${resourceKey}`;
  }

  registerResource(resourceKey, resolver, { method = "GET" } = {}) {
    if (!resourceKey || typeof resolver !== "function") {
      throw new Error("registerResource expects a key and resolver function");
    }
    const resolverKey = this.buildResolverKey(resourceKey, method);
    this.resourceResolvers.set(resolverKey, resolver);
    return () => this.resourceResolvers.delete(resolverKey);
  }

  getResolver(resourceKey, method = "GET") {
    return this.resourceResolvers.get(this.buildResolverKey(resourceKey, method));
  }

  buildQueryString(params = {}) {
    return new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value === undefined || value === null) return acc;
        acc[key] = value;
        return acc;
      }, {}),
    ).toString();
  }

  async request(method, resourceKey, { params = {}, body } = {}) {
    if (!resourceKey) throw new Error("resourceKey is required");

    const resolver = this.getResolver(resourceKey, method);
    if (resolver) {
      return resolver(params, body);
    }

    if (!this.fetchImpl) {
      throw new Error(`No resolver or fetch implementation available for ${resourceKey}`);
    }

    const query = this.buildQueryString(params);
    const url = `${this.baseUrl}/${resourceKey}${query ? `?${query}` : ""}`;
    const headers = { "Content-Type": "application/json" };
    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });

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

  async get(resourceKey, params = {}) {
    return this.request("GET", resourceKey, { params });
  }

  async post(resourceKey, body = {}, params = {}) {
    return this.request("POST", resourceKey, { params, body });
  }
}

export default BackendConnector;
