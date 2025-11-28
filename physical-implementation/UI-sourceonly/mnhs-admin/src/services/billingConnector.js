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

  buildFilterParams(filters = {}) {
    const params = {};
    if (filters.hospitalId !== undefined && filters.hospitalId !== null) params.hospital_id = filters.hospitalId;
    if (filters.departmentId !== undefined && filters.departmentId !== null) params.department_id = filters.departmentId;
    if (filters.insuranceId !== undefined) params.insurance_id = filters.insuranceId;
    if (filters.daysBack !== undefined) params.days_back = filters.daysBack;
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
      throw new Error("Expense total must be a positive number");
    }

    const normalized = {
      caid: resolvedCaid,
      total: resolvedTotal,
    };

    const resolvedInsurance = payload.insId ?? payload.insurance?.insId;
    if (resolvedInsurance !== undefined) {
      normalized.insId = resolvedInsurance;
    }

    return normalized;
  }

  async loadDashboard(filters = {}, { forceRefresh = false } = {}) {
    this.assertModelConnector();
    const params = this.buildFilterParams(filters);
    return this.modelConnector.load("Billing", params, { forceRefresh });
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
