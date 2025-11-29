class StaffConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
  }

  async fetchStaff({ params = {}, forceRefresh = false } = {}) {
    if (!this.modelConnector) {
      throw new Error("StaffConnector requires a modelConnector instance for data loads");
    }

    return this.modelConnector.load("Staff", params, { forceRefresh });
  }

  async addStaff(payload) {
    if (!this.backend) {
      throw new Error("StaffConnector requires a backend instance");
    }

    const response = await this.backend.post("staff", payload);
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Staff");
    }
    return response;
  }
}

export default StaffConnector;
