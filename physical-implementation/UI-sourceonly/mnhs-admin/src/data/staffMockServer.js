import { generateStaff } from "./mockData";

const normalizeStaff = (staff, index) => ({
  id: staff.id ?? `S-${200 + index}`,
  name: staff.name ?? `Staff ${index}`,
  role: staff.role ?? "General",
  departments: Array.isArray(staff.departments) && staff.departments.length ? staff.departments : ["General"],
  hospitals: Array.isArray(staff.hospitals) && staff.hospitals.length ? staff.hospitals : ["Rabat Central"],
  status: staff.status || "Active",
});

const registerStaffMockServer = (backendConnector) => {
  if (!backendConnector) return;

  let staff = generateStaff(24).map(normalizeStaff);

  backendConnector.registerResource(
    "staff",
    async () => ({
      staff,
      lastSyncedAt: new Date().toISOString(),
    }),
    { method: "GET" },
  );

};

export { registerStaffMockServer };
