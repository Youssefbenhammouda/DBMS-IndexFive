class AppointmentConnector {
  constructor(backendConnector, modelConnector) {
    this.backend = backendConnector;
    this.modelConnector = modelConnector;
  }

  async addAppointment(payload) {
    if (!this.backend) {
      throw new Error("AppointmentConnector requires a backend instance");
    }

    const response = await this.backend.post("appointments", payload);
    if (this.modelConnector?.clearCache) {
      this.modelConnector.clearCache("Appointments");
    }
    return response;
  }
}

export default AppointmentConnector;
