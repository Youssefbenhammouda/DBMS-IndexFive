import { generatePatients } from "./mockData";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const normalizeMockPatient = (patient, index) => {
  const iidNumeric = parseInt(String(patient.iid).replace(/\D/g, ""), 10) || 1000 + index;
  const bloodGroup = BLOOD_GROUPS[index % BLOOD_GROUPS.length];
  return {
    iid: iidNumeric,
    cin: patient.cin,
    name: patient.name,
    sex: patient.sex,
    birthDate: patient.birthDate,
    bloodGroup,
    phone: `+2126${String(1000000 + index * 7).padStart(8, "0")}`,
    email: `patient${index}@mnhs.mock`,
    city: patient.city,
    insurance: patient.insurance,
    status: patient.status,
  };
};

const registerPatientMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let patients = generatePatients(25).map(normalizeMockPatient);

  backendConnector.registerResource(
    "patients",
    async () => ({
      patients,
      lastSyncedAt: new Date().toISOString(),
    }),
    { method: "GET" },
  );

  backendConnector.registerResource(
    "patients",
    async (_params, body = {}) => {
      const requiredFields = ["iid", "cin", "name", "sex"];
      const missing = requiredFields.filter((field) => !body[field] || !String(body[field]).trim());
      if (missing.length) {
        throw new Error(`Missing fields: ${missing.join(", ")}`);
      }

      const iidNumeric = parseInt(String(body.iid).trim(), 10);
      if (Number.isNaN(iidNumeric)) {
        throw new Error("IID must be a numeric value");
      }

      const normalizedCIN = String(body.cin).trim().toUpperCase();
      if (normalizedCIN.length > 10) {
        throw new Error("CIN exceeds maximum length of 10 characters");
      }

      if (patients.some((p) => String(p.iid) === String(iidNumeric))) {
        throw new Error("IID already exists");
      }

      if (patients.some((p) => p.cin?.toUpperCase() === normalizedCIN)) {
        throw new Error("CIN already exists");
      }

      const patientRecord = {
        iid: iidNumeric,
        cin: normalizedCIN,
        name: String(body.name).trim(),
        birthDate: body.birth || body.birthDate || null,
        sex: body.sex,
        bloodGroup: body.bloodGroup || null,
        phone: body.phone || null,
        email: body.email || null,
        city: body.city || "N/A",
        insurance: body.insurance || "None",
        status: body.status || "Outpatient",
      };

      patients = [patientRecord, ...patients];

      return {
        patient: patientRecord,
        message: "Patient created via mock endpoint",
      };
    },
    { method: "POST" },
  );
};

export { registerPatientMockServer };
