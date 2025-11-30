const HOSPITALS = ["Rabat Central", "Casablanca General", "Marrakech Health", "Tangier Med"];
const DEPARTMENTS = ["Cardiology", "Neurology", "Pediatrics", "Emergency", "General Surgery"];
const INSURANCE_TYPES = ["CNOPS", "CNSS", "RAMED", "Private", "None"];
const MED_CLASSES = ["Antibiotics", "Analgesics", "Cardiovascular", "Diabetic"];

const generatePatients = (count) => {
  const names = ["Mohammed", "Fatima", "Youssef", "Amina", "Omar", "Khadija", "Hassan", "Zineb", "Karim", "Latifa"];
  const lastNames = ["Benali", "Alami", "Idrissi", "Tazi", "Berrada", "Chraibi", "Fassi", "Mansouri"];
  const cities = ["Rabat", "Casablanca", "Fes", "Tangier", "Agadir"];

  return Array.from({ length: count }, (_, i) => ({
    iid: `P-${1000 + i}`,
    cin: `${["AB", "BE", "CD"][Math.floor(Math.random() * 3)]}${10000 + i}`,
    name: `${names[Math.floor(Math.random() * names.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    sex: Math.random() > 0.5 ? "M" : "F",
    birthDate: `19${Math.floor(Math.random() * 50) + 40}-${Math.floor(Math.random() * 12) + 1}-15`,
    city: cities[Math.floor(Math.random() * cities.length)],
    insurance: INSURANCE_TYPES[Math.floor(Math.random() * INSURANCE_TYPES.length)],
    lastVisit: "2023-10-15",
    status: Math.random() > 0.8 ? "Admitted" : "Outpatient",
  }));
};

const generateStaff = (count) => {
  const roles = ["Doctor", "Nurse", "Specialist", "Admin"];
  return Array.from({ length: count }, (_, i) => ({
    id: `S-${200 + i}`,
    name: `Dr. ${["Alami", "Bennani", "Daoudi"][Math.floor(Math.random() * 3)]} ${i}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    departments: [DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]],
    hospitals: [HOSPITALS[Math.floor(Math.random() * HOSPITALS.length)]],
    status: "Active",
    workload: Math.floor(Math.random() * 100),
  }));
};

const generateAppointments = (count) => {
  const statuses = ["Scheduled", "Completed", "Cancelled", "No Show"];
  return Array.from({ length: count }, (_, i) => ({
    id: `APT-${5000 + i}`,
    date: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    time: `${Math.floor(Math.random() * 9) + 8}:00`,
    hospital: HOSPITALS[Math.floor(Math.random() * HOSPITALS.length)],
    department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
    patient: `Patient ${i}`,
    staff: `Dr. Staff ${i}`,
    reason: "Regular Checkup",
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
};

const generateMeds = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `MED-${i}`,
    name: `Medication ${String.fromCharCode(65 + i)}`,
    class: MED_CLASSES[Math.floor(Math.random() * MED_CLASSES.length)],
    hospital: HOSPITALS[Math.floor(Math.random() * HOSPITALS.length)],
    qty: Math.floor(Math.random() * 500),
    reorderLevel: 100,
    price: (Math.random() * 200 + 50).toFixed(2),
  }));

const generateMockData = () => ({
  patients: generatePatients(50),
  staff: generateStaff(20),
  appointments: generateAppointments(30),
  medications: generateMeds(20),
});

export {
  HOSPITALS,
  DEPARTMENTS,
  INSURANCE_TYPES,
  MED_CLASSES,
  generatePatients,
  generateStaff,
  generateAppointments,
  generateMeds,
  generateMockData,
};
