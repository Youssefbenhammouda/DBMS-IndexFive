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

  invalidateDashboard() {
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Billing");
    }
  }

  async createExpense(payload) {
    this.assertBackend();
    const response = await this.backend.post("billing/expense", payload);
    this.invalidateDashboard();
    return response;
  }

  async recordInsurancePayment(payload) {
    this.assertBackend();
    const response = await this.backend.post("billing/insurance-payment", payload);
    this.invalidateDashboard();
    return response;
  }
}

export default BillingConnector;
