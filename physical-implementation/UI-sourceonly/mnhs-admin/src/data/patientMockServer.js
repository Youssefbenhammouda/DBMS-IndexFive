import { generatePatients, HOSPITALS, DEPARTMENTS } from "./mockData";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const buildNextVisit = (index) => {
  const dayOffset = (index % 7) + 2;
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const hospital = HOSPITALS[index % HOSPITALS.length];
  const department = DEPARTMENTS[index % DEPARTMENTS.length];
  const hour = 8 + (index % 6);
  const time = `${String(hour).padStart(2, "0")}:00`;
  return {
    date: date.toISOString().split("T")[0],
    time,
    hospital,
    department,
    reason: `${department} follow-up`,
  };
};

const normalizeNextVisit = (payload, fallbackIndex) => {
  if (payload && typeof payload === "object") {
    return {
      date: payload.date || null,
      time: payload.time || null,
      hospital: payload.hospital || "To be assigned",
      department: payload.department || null,
      reason: payload.reason || null,
    };
  }
  return buildNextVisit(fallbackIndex);
};

const normalizeMockPatient = (patient, index) => {
  const iidNumeric = parseInt(String(patient.iid).replace(/\D/g, ""), 10) || 1000 + index;
  const bloodGroup = BLOOD_GROUPS[index % BLOOD_GROUPS.length];
  const nextVisit = normalizeNextVisit(patient.nextVisit, index);
  const insuranceStatus = patient.insurance === "None" ? "Self-Pay" : "Active";
  const policyNumber = patient.policyNumber || `MAR-${202300 + index}`;
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
    insuranceStatus,
    policyNumber,
    nextVisit,
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

      const insurance = body.insurance || "None";
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
        insurance,
        status: body.status || "Outpatient",
        insuranceStatus: body.insuranceStatus || (insurance === "None" ? "Self-Pay" : "Active"),
        policyNumber: body.policyNumber || `MAR-${iidNumeric}`,
        nextVisit: normalizeNextVisit(body.nextVisit, patients.length + 1),
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
