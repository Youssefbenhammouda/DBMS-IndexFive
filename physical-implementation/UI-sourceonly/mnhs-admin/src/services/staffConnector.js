class StaffConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
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
