class PatientConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
  }

  async fetchPatients({ params = {}, forceRefresh = false } = {}) {
    if (!this.modelConnector) {
      throw new Error("PatientConnector requires a modelConnector instance for data loads");
    }

    return this.modelConnector.load("Patients", params, { forceRefresh });
  }

  async addPatient(payload) {
    if (!this.backend) {
      throw new Error("PatientConnector is missing a backend instance");
    }

    const response = await this.backend.post("patients", payload);
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Patients");
    }
    return response;
  }
}

export default PatientConnector;
