class MedicationsConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
  }

  async addMedication(payload) {
    if (!this.backend) {
      throw new Error("MedicationsConnector requires a backend instance");
    }

    const response = await this.backend.post("medications", payload);
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Medications");
    }
    return response;
  }

  async addStockEntry(payload) {
    if (!this.backend) {
      throw new Error("MedicationsConnector requires a backend instance");
    }

    const response = await this.backend.post("medications/stock", payload);
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Medications");
    }
    return response;
  }
}

export default MedicationsConnector;
