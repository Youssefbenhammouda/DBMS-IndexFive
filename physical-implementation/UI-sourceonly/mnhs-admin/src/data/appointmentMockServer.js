import { generateAppointments } from "./mockData";

const STATUS_OPTIONS = ["Scheduled", "Completed", "Cancelled", "No Show"];

const normalizeAppointment = (appointment, index) => ({
  id: appointment.id ?? `APT-${5000 + index}`,
  date: appointment.date ?? new Date().toISOString().split("T")[0],
  time: appointment.time ?? "09:00",
  hospital: appointment.hospital ?? "Rabat Central",
  department: appointment.department ?? "General",
  patient: appointment.patient || appointment.patientName || `Patient ${index}`,
  staff: appointment.staff || appointment.doctor || `Dr. Staff ${index}`,
  reason: appointment.reason || "Consultation",
  status: STATUS_OPTIONS.includes(appointment.status) ? appointment.status : "Scheduled",
});

const registerAppointmentMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let appointments = generateAppointments(30).map(normalizeAppointment);

  backendConnector.registerResource(
    "appointments",
    async () => ({
      appointments,
      lastSyncedAt: new Date().toISOString(),
    }),
    { method: "GET" },
  );

  backendConnector.registerResource(
    "appointments",
    async (_params, body = {}) => {
      const requiredFields = ["date", "time", "hospital", "department", "patient", "staff", "reason", "status"];
      const missing = requiredFields.filter((field) => !body[field] || !String(body[field]).trim());
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const normalizedStatus = STATUS_OPTIONS.includes(body.status) ? body.status : null;
      if (!normalizedStatus) {
        throw new Error(`Status must be one of: ${STATUS_OPTIONS.join(", ")}`);
      }

      const nextId = body.id?.toString().trim() || `APT-${5000 + appointments.length + 1}`;
      if (appointments.some((apt) => apt.id === nextId)) {
        throw new Error("Appointment ID already exists");
      }

      const record = {
        id: nextId,
        date: body.date,
        time: body.time,
        hospital: body.hospital,
        department: body.department,
        patient: body.patient,
        staff: body.staff,
        reason: body.reason,
        status: normalizedStatus,
      };

      appointments = [record, ...appointments];

      return {
        appointment: record,
        message: "Appointment created via mock endpoint",
      };
    },
    { method: "POST" },
  );
};

export { registerAppointmentMockServer };
