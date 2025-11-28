class ModelConnector {
  constructor(backendConnector) {
    if (!backendConnector) {
      throw new Error("ModelConnector requires a backendConnector instance");
    }
    this.backend = backendConnector;
    this.models = new Map();
    this.cache = new Map();
  }

  registerModel(pageKey, definition) {
    if (!pageKey || typeof definition !== "object") {
      throw new Error("registerModel expects a page key and definition object");
    }
    const { resource = pageKey, transform = (payload) => payload, contract } = definition;
    this.models.set(pageKey, { resource, transform, contract });
    return () => this.models.delete(pageKey);
  }

  createCacheKey(pageKey, params = {}) {
    if (!params || typeof params !== "object" || !Object.keys(params).length) {
      return pageKey;
    }

    const normalized = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    return `${pageKey}:${JSON.stringify(normalized)}`;
  }

  async load(pageKey, params = {}, { forceRefresh = false } = {}) {
    const requestParams = { ...params, pageKey };
    const cacheKey = this.createCacheKey(pageKey, requestParams);

    if (!forceRefresh && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const definition = this.models.get(pageKey);
    if (!definition) {
      throw new Error(`No model registered for ${pageKey}`);
    }

    const raw = await this.backend.get(definition.resource, requestParams);
    const transformed = definition.transform(raw, requestParams);
    this.assertContract(pageKey, transformed, definition.contract);
    this.cache.set(cacheKey, transformed);
    return transformed;
  }

  assertContract(pageKey, payload, contract) {
    if (!contract) return;

    const missing = (contract.requiredKeys || []).filter((key) => !(key in payload));
    if (missing.length) {
      throw new Error(`Model ${pageKey} missing keys: ${missing.join(", ")}`);
    }

    if (contract.validators) {
      Object.entries(contract.validators).forEach(([key, validator]) => {
        if (key in payload && !validator(payload[key])) {
          throw new Error(`Model ${pageKey} failed validator for ${key}`);
        }
      });
    }
  }

  clearCache(pageKey) {
    if (typeof pageKey === "string") {
      const prefix = `${pageKey}`;
      Array.from(this.cache.keys()).forEach((key) => {
        if (key === prefix || key.startsWith(`${prefix}:`)) {
          this.cache.delete(key);
        }
      });
      return;
    }
    this.cache.clear();
  }
}

export { ModelConnector };
