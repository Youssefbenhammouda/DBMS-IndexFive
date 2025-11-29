const DEFAULT_DAYS_BACK = 90;

const INSURANCE_SCOPES = {
  ALL: "all",
  SELF: "self",
  INSURER: "insurer",
};

const normalizeInsuranceFilter = (value) => {
  if (value === undefined || value === "" || value === "none") {
    return { insuranceScope: INSURANCE_SCOPES.ALL, insuranceId: undefined };
  }

  if (value === null || value === "self") {
    return { insuranceScope: INSURANCE_SCOPES.SELF, insuranceId: null };
  }

  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "none") {
      return { insuranceScope: INSURANCE_SCOPES.ALL, insuranceId: undefined };
    }
    if (lowered === "self") {
      return { insuranceScope: INSURANCE_SCOPES.SELF, insuranceId: null };
    }
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 0) {
    return { insuranceScope: INSURANCE_SCOPES.INSURER, insuranceId: numeric };
  }

  return { insuranceScope: INSURANCE_SCOPES.ALL, insuranceId: undefined };
};

class BillingConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
  }

  assertBackend() {
    if (!this.backend) {
      throw new Error("BillingConnector requires a backend instance");
    }
  }

  assertModelConnector() {
    if (!this.modelConnector) {
      throw new Error("BillingConnector requires a modelConnector instance for data loads");
    }
  }

  invalidateDashboard() {
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Billing");
    }
  }

  resolveFilters(filters = {}) {
    const resolved = {
      hospitalId: filters.hospitalId ?? null,
      departmentId: filters.departmentId ?? null,
      insuranceScope: INSURANCE_SCOPES.ALL,
      insuranceId: undefined,
      daysBack: filters.daysBack ?? DEFAULT_DAYS_BACK,
    };

    const normalizeNumeric = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const numeric = Number(value);
      return Number.isNaN(numeric) ? null : numeric;
    };

    resolved.hospitalId = normalizeNumeric(resolved.hospitalId);
    resolved.departmentId = normalizeNumeric(resolved.departmentId);

    const insuranceResolution = normalizeInsuranceFilter(filters.insuranceId);
    resolved.insuranceScope = insuranceResolution.insuranceScope;
    resolved.insuranceId = insuranceResolution.insuranceId;

    const numericDays = Number(resolved.daysBack);
    resolved.daysBack = Number.isNaN(numericDays) || numericDays <= 0 ? DEFAULT_DAYS_BACK : Math.floor(numericDays);

    return resolved;
  }

  buildFilterParams(filters = {}) {
    const resolved = this.resolveFilters(filters);
    const params = { days_back: resolved.daysBack };
    if (resolved.hospitalId !== null && resolved.hospitalId !== undefined) params.hospital_id = resolved.hospitalId;
    if (resolved.departmentId !== null && resolved.departmentId !== undefined) params.department_id = resolved.departmentId;
    if (resolved.insuranceScope === INSURANCE_SCOPES.SELF) {
      params.insurance_id = "self";
    } else if (resolved.insuranceScope === INSURANCE_SCOPES.INSURER && resolved.insuranceId !== undefined) {
      params.insurance_id = resolved.insuranceId;
    } else {
      params.insurance_id = "none";
    }
    return params;
  }

  normalizeExpensePayload(payload = {}) {
    if (!payload || typeof payload !== "object") {
      throw new Error("Expense payload must be an object");
    }

    const caid = payload.caid ?? payload.activityId ?? payload.activity?.caid;
    if (caid === undefined || caid === null) {
      throw new Error("Expense payload requires a caid value");
    }

    const totalValue = payload.total ?? payload.amount;
    if (totalValue === undefined || totalValue === null) {
      throw new Error("Expense payload requires a total amount");
    }

    const resolvedCaid = Number(caid);
    const resolvedTotal = Number(totalValue);

    if (Number.isNaN(resolvedCaid)) {
      throw new Error("Expense payload caid must be numeric");
    }

    if (Number.isNaN(resolvedTotal) || resolvedTotal < 0) {
      throw new Error("Expense total must be a non-negative number");
    }

    const normalized = {
      caid: resolvedCaid,
      total: resolvedTotal,
    };

    const resolvedInsurance = payload.insId ?? payload.insurance?.insId;
    if (resolvedInsurance !== undefined) {
      if (resolvedInsurance === null) {
        normalized.insId = null;
      } else {
        const numericInsurance = Number(resolvedInsurance);
        if (Number.isNaN(numericInsurance)) {
          throw new Error("Expense payload insId must be numeric when provided");
        }
        normalized.insId = numericInsurance;
      }
    }

    return normalized;
  }

  async loadDashboard(filters = {}, { forceRefresh = false } = {}) {
    this.assertModelConnector();
    const params = this.buildFilterParams(filters);
    return this.modelConnector.load("Billing", params, { forceRefresh });
  }

  async refreshDashboard(filters = {}) {
    return this.loadDashboard(filters, { forceRefresh: true });
  }

  async fetchActivityOptions({ forceRefresh = false } = {}) {
    this.assertModelConnector();
    const payload = await this.modelConnector.load("Appointments", {}, { forceRefresh });
    if (!payload || !Array.isArray(payload.appointments)) {
      return [];
    }
    return payload.appointments;
  }

  async createExpense(payload) {
    this.assertBackend();
    const normalized = this.normalizeExpensePayload(payload);
    const response = await this.backend.post("billing/expense", normalized);
    this.invalidateDashboard();
    return response;
  }
}

export default BillingConnector;
