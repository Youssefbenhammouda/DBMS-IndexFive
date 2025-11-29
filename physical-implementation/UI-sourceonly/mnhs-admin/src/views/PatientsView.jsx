import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import Badge from "../components/common/Badge";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const APPOINTMENT_STATUS_OPTIONS = ["Scheduled", "Completed", "Cancelled", "No Show"];
const DEFAULT_HOSPITAL_OPTIONS = ["Rabat Central", "Casablanca General", "Marrakech Health", "Tangier Med"];
const DEFAULT_DEPARTMENT_OPTIONS = ["Cardiology", "Emergency", "Oncology", "Radiology", "Pediatrics"];
const normalizeQuery = (value) => (value || "").toString().trim().toLowerCase();
const filterStringOptions = (options, query) => {
  if (!Array.isArray(options) || !options.length) return [];
  const normalized = normalizeQuery(query);
  const source = normalized ? options.filter((option) => option.toLowerCase().includes(normalized)) : options;
  return source.slice(0, 8);
};
const INITIAL_FORM_STATE = {
  iid: "",
  cin: "",
  fullName: "",
  birth: "",
  sex: "M",
  bloodGroup: "",
  phone: "",
  email: "",
  city: "",
};

const buildDefaultAppointmentForm = (patientName) => ({
  date: new Date().toISOString().split("T")[0],
  time: "09:00",
  hospital: "",
  department: "",
  staff: "",
  reason: patientName ? `Consultation for ${patientName}` : "",
  status: "Scheduled",
});

const PatientsView = ({ data, error, patientConnector, appointmentConnector, staffConnector }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState(() => data?.patients ?? []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [syncedAt, setSyncedAt] = useState(data?.lastSyncedAt ?? null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleValues, setScheduleValues] = useState(() => buildDefaultAppointmentForm());
  const [scheduleErrors, setScheduleErrors] = useState({});
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleSubmissionError, setScheduleSubmissionError] = useState(null);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [isLoadingStaffDirectory, setIsLoadingStaffDirectory] = useState(false);
  const [staffDirectoryError, setStaffDirectoryError] = useState(null);
  const [hasRequestedStaffDirectory, setHasRequestedStaffDirectory] = useState(false);
  const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
  const hospitalDropdownRef = useRef(null);
  const departmentDropdownRef = useRef(null);
  const staffDropdownRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(data?.patients)) {
      setPatients(data.patients);
      if (!selectedPatient && data.patients.length) {
        setSelectedPatient(data.patients[0]);
      }
      setSyncedAt(data.lastSyncedAt ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (selectedPatient && !patients.some((p) => p.iid === selectedPatient.iid)) {
      setSelectedPatient(patients[0] ?? null);
    }
  }, [patients, selectedPatient]);

  useEffect(() => {
    if (error) {
      setBanner({ type: "error", message: error, id: Date.now() });
    }
  }, [error]);

  const refreshPatients = useCallback(
    async ({ forceRefresh = false, silent = false } = {}) => {
      if (!patientConnector) return null;

      if (!silent) {
        setIsLoadingPatients(true);
        setFetchError(null);
      }

      try {
        const payload = await patientConnector.fetchPatients({ forceRefresh });
        const nextPatients = Array.isArray(payload?.patients) ? payload.patients : [];
        setPatients(nextPatients);
        setSyncedAt(payload?.lastSyncedAt ?? null);
        setFetchError(null);
        return payload;
      } catch (loadError) {
        const message = loadError?.message || "Failed to load patients from backend.";
        setFetchError(message);
        return null;
      } finally {
        if (!silent) {
          setIsLoadingPatients(false);
        }
      }
    },
    [patientConnector],
  );

  // staff_requirements.md exposes /api/staff, so reuse that payload for search dropdowns.
  const loadStaffDirectory = useCallback(
    async ({ forceRefresh = false } = {}) => {
      if (!staffConnector) return null;
      setIsLoadingStaffDirectory(true);
      setStaffDirectoryError(null);
      setHasRequestedStaffDirectory(true);
      try {
        const payload = await staffConnector.fetchStaff({ forceRefresh });
        const list = Array.isArray(payload?.staff) ? payload.staff : [];
        setStaffDirectory(list);
        return list;
      } catch (staffError) {
        const message = staffError?.message || "Unable to load staff directory.";
        setStaffDirectoryError(message);
        return null;
      } finally {
        setIsLoadingStaffDirectory(false);
      }
    },
    [staffConnector],
  );

  const hasInitialPatients = Array.isArray(data?.patients) && data.patients.length > 0;

  useEffect(() => {
    if (!patientConnector) return;
    refreshPatients({ silent: hasInitialPatients });
  }, [patientConnector, refreshPatients, hasInitialPatients]);

  useEffect(() => {
    if (!isScheduleModalOpen || !staffConnector) return;
    if (staffDirectory.length || isLoadingStaffDirectory) return;
    loadStaffDirectory();
  }, [isScheduleModalOpen, staffConnector, staffDirectory.length, isLoadingStaffDirectory, loadStaffDirectory]);

  useEffect(() => {
    if (!isHospitalDropdownOpen) return;
    const handleClick = (event) => {
      if (hospitalDropdownRef.current && !hospitalDropdownRef.current.contains(event.target)) {
        setIsHospitalDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isHospitalDropdownOpen]);

  useEffect(() => {
    if (!isDepartmentDropdownOpen) return;
    const handleClick = (event) => {
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target)) {
        setIsDepartmentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isDepartmentDropdownOpen]);

  useEffect(() => {
    if (!isStaffDropdownOpen) return;
    const handleClick = (event) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
        setIsStaffDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isStaffDropdownOpen]);

  useEffect(() => {
    if (isScheduleModalOpen) return;
    setIsHospitalDropdownOpen(false);
    setIsDepartmentDropdownOpen(false);
    setIsStaffDropdownOpen(false);
  }, [isScheduleModalOpen]);

  const showBanner = (type, message) => {
    setBanner({ type, message, id: Date.now() });
  };

  const handleOpenModal = () => {
    setFormValues(INITIAL_FORM_STATE);
    setFormErrors({});
    setSubmissionError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSubmissionError(null);
    setIsModalOpen(false);
  };

  const handleOpenScheduleModal = () => {
    if (!selectedPatient) return;
    setScheduleValues(buildDefaultAppointmentForm(selectedPatient.name));
    setScheduleErrors({});
    setScheduleSubmissionError(null);
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleErrors({});
    setScheduleSubmissionError(null);
    setIsScheduleModalOpen(false);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      [field]: field === "cin" ? value.toUpperCase() : value,
    }));
  };

  const updateScheduleFieldValue = (field, value) => {
    setScheduleValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (scheduleErrors[field]) {
      setScheduleErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleHospitalSelect = (value) => {
    if (!value) return;
    updateScheduleFieldValue("hospital", value);
    setIsHospitalDropdownOpen(false);
  };

  const handleDepartmentSelect = (value) => {
    if (!value) return;
    updateScheduleFieldValue("department", value);
    setIsDepartmentDropdownOpen(false);
  };

  const handleStaffSelect = (staff) => {
    if (!staff) return;
    let hospitalAssigned = false;
    let departmentAssigned = false;
    setScheduleValues((prev) => {
      const next = { ...prev, staff: staff.name };
      if (!prev.hospital && staff.hospitals.length) {
        next.hospital = staff.hospitals[0];
        hospitalAssigned = true;
      }
      if (!prev.department && staff.departments.length) {
        next.department = staff.departments[0];
        departmentAssigned = true;
      }
      return next;
    });
    setScheduleErrors((prev) => {
      const next = { ...prev };
      delete next.staff;
      if (hospitalAssigned) delete next.hospital;
      if (departmentAssigned) delete next.department;
      return next;
    });
    setIsStaffDropdownOpen(false);
  };

  const handleRefreshStaffDirectory = () => {
    loadStaffDirectory({ forceRefresh: true });
  };

  const handleScheduleInputChange = (field) => (event) => {
    const value = event.target.value;
    updateScheduleFieldValue(field, value);
  };

  const validateForm = () => {
    const errors = {};
    const trimmedIID = formValues.iid.trim();
    const trimmedName = formValues.fullName.trim();
    const trimmedPhone = formValues.phone.trim();
    const trimmedEmail = formValues.email.trim();
    const trimmedCity = formValues.city.trim();
    const normalizedCIN = formValues.cin.trim().toUpperCase();

    if (!trimmedIID) errors.iid = "IID is required";
    else if (!/^\d+$/.test(trimmedIID)) errors.iid = "IID must be numeric";
    else if (patients.some((p) => String(p.iid).toUpperCase() === trimmedIID.toUpperCase())) errors.iid = "IID already exists";

    if (!normalizedCIN) errors.cin = "CIN is required";
    else if (normalizedCIN.length > 10) errors.cin = "Max length is 10";
    else if (patients.some((p) => p.cin?.toUpperCase() === normalizedCIN)) errors.cin = "CIN already exists";

    if (!trimmedName) errors.fullName = "Full name is required";

    if (!formValues.sex) errors.sex = "Sex is required";

    if (formValues.bloodGroup && !BLOOD_GROUP_OPTIONS.includes(formValues.bloodGroup)) {
      errors.bloodGroup = "Invalid blood group";
    }

    if (trimmedPhone && !/^\+?[0-9\s-]{6,15}$/.test(trimmedPhone)) {
      errors.phone = "Invalid phone";
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Invalid email";
    }

    if (trimmedCity.length > 80) {
      errors.city = "City must be 80 characters max";
    }

    return { errors, normalizedCIN, trimmedIID, trimmedName, trimmedPhone, trimmedEmail, trimmedCity };
  };

  const validateScheduleForm = () => {
    const errors = {};
    if (!scheduleValues.date) errors.date = "Date is required";
    if (!scheduleValues.time) errors.time = "Time is required";
    if (!scheduleValues.hospital.trim()) errors.hospital = "Hospital is required";
    if (!scheduleValues.department.trim()) errors.department = "Department is required";
    if (!scheduleValues.staff.trim()) errors.staff = "Staff is required";
    if (!scheduleValues.reason.trim()) errors.reason = "Reason is required";
    if (!APPOINTMENT_STATUS_OPTIONS.includes(scheduleValues.status)) errors.status = "Invalid status";
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { errors, normalizedCIN, trimmedIID, trimmedName, trimmedPhone, trimmedEmail, trimmedCity } = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setSubmissionError(null);
      return;
    }

    if (!patientConnector) {
      showBanner("error", "Patient connector not available. Please reload and try again.");
      return;
    }

    const requestPayload = {
      iid: Number(trimmedIID),
      cin: normalizedCIN,
      name: trimmedName,
      birth: formValues.birth || null,
      sex: formValues.sex,
      bloodGroup: formValues.bloodGroup || null,
      phone: trimmedPhone || null,
      email: trimmedEmail || null,
      city: trimmedCity || null,
    };

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await patientConnector.addPatient(requestPayload);
      const created = response?.patient || requestPayload;
      const fallbackInsurance = created.insurance ?? requestPayload.insurance ?? "None";
      const normalized = {
        iid: created.iid ?? trimmedIID,
        cin: created.cin ?? normalizedCIN,
        name: created.name ?? trimmedName,
        sex: created.sex ?? formValues.sex,
        birthDate: created.birthDate || created.birth || formValues.birth || "Not specified",
        city: created.city || trimmedCity || "N/A",
        insurance: created.insurance || "None",
        status: created.status || "Outpatient",
        bloodGroup: created.bloodGroup || requestPayload.bloodGroup,
        phone: created.phone || requestPayload.phone,
        email: created.email || requestPayload.email,
        insuranceStatus: created.insuranceStatus || (fallbackInsurance === "None" ? "Self-Pay" : "Active"),
        policyNumber: created.policyNumber || null,
        nextVisit: created.nextVisit || null,
      };

      setPatients((prev) => [normalized, ...prev]);
      setSelectedPatient(normalized);
      setFormValues(INITIAL_FORM_STATE);
      setFormErrors({});
      setSubmissionError(null);
      setIsModalOpen(false);
      showBanner("success", response?.message || "Patient added successfully.");
      refreshPatients({ forceRefresh: true, silent: true });
    } catch (apiError) {
      setSubmissionError(apiError?.message || "Failed to add patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPatient) {
      setScheduleSubmissionError("Please select a patient first.");
      return;
    }

    const errors = validateScheduleForm();
    if (Object.keys(errors).length) {
      setScheduleErrors(errors);
      setScheduleSubmissionError(null);
      return;
    }
    setScheduleErrors({});

    if (!appointmentConnector) {
      setScheduleSubmissionError("Appointment connector not available. Please reload and try again.");
      return;
    }

    const targetPatientId = selectedPatient.iid;
    const patientName = selectedPatient.name;

    const trimmedHospital = scheduleValues.hospital.trim();
    const trimmedDepartment = scheduleValues.department.trim();
    const trimmedStaff = scheduleValues.staff.trim();
    const trimmedReason = scheduleValues.reason.trim();

    const payload = {
      ...scheduleValues,
      hospital: trimmedHospital,
      department: trimmedDepartment,
      staff: trimmedStaff,
      reason: trimmedReason,
      patient: patientName,
    };

    setIsScheduling(true);
    setScheduleSubmissionError(null);

    try {
      const response = await appointmentConnector.addAppointment(payload);
      const nextVisit = {
        date: scheduleValues.date,
        time: scheduleValues.time,
        hospital: trimmedHospital,
        department: trimmedDepartment,
        reason: trimmedReason,
      };
      setPatients((prev) => prev.map((p) => (p.iid === targetPatientId ? { ...p, nextVisit } : p)));
      setSelectedPatient((prev) => (prev && prev.iid === targetPatientId ? { ...prev, nextVisit } : prev));
      setScheduleValues(buildDefaultAppointmentForm(patientName));
      setScheduleErrors({});
      showBanner("success", response?.message || "Appointment scheduled successfully.");
      setIsScheduleModalOpen(false);
      refreshPatients({ forceRefresh: true, silent: true });
    } catch (scheduleError) {
      setScheduleSubmissionError(scheduleError?.message || "Failed to schedule appointment.");
    } finally {
      setIsScheduling(false);
    }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(normalizedSearch) ||
        (p.cin || "").toLowerCase().includes(normalizedSearch) ||
        (p.city || "").toLowerCase().includes(normalizedSearch),
    );
  }, [patients, searchTerm]);

  const hasConnector = Boolean(patientConnector);
  const lastSyncedLabel = useMemo(() => (syncedAt ? new Date(syncedAt).toLocaleString() : null), [syncedAt]);
  const nextVisitInfo = useMemo(() => {
    if (!selectedPatient?.nextVisit?.date) return null;
    const time = selectedPatient.nextVisit.time || "09:00";
    const jsDate = new Date(`${selectedPatient.nextVisit.date}T${time}`);
    return {
      month: jsDate.toLocaleString("en-US", { month: "short" }),
      day: jsDate.getDate(),
      reason: selectedPatient.nextVisit.reason || "Scheduled visit",
      hospital: selectedPatient.nextVisit.hospital || "To be assigned",
      department: selectedPatient.nextVisit.department || null,
      timeLabel: time,
    };
  }, [selectedPatient]);
  const availableHospitalOptions = useMemo(() => {
    const set = new Set();
    staffDirectory.forEach((staff) => {
      (Array.isArray(staff.hospitals) ? staff.hospitals : []).forEach((hospital) => {
        if (hospital) set.add(hospital);
      });
    });
    return set.size ? Array.from(set).sort((a, b) => a.localeCompare(b)) : DEFAULT_HOSPITAL_OPTIONS;
  }, [staffDirectory]);
  const availableDepartmentOptions = useMemo(() => {
    const set = new Set();
    staffDirectory.forEach((staff) => {
      (Array.isArray(staff.departments) ? staff.departments : []).forEach((dept) => {
        if (dept) set.add(dept);
      });
    });
    return set.size ? Array.from(set).sort((a, b) => a.localeCompare(b)) : DEFAULT_DEPARTMENT_OPTIONS;
  }, [staffDirectory]);
  const staffLookup = useMemo(
    () =>
      staffDirectory.map((staff, index) => ({
        key: staff.id ?? `staff-${index}`,
        name: staff.name || `Staff ${index + 1}`,
        role: staff.role || "Staff",
        hospitals: Array.isArray(staff.hospitals) ? staff.hospitals.filter(Boolean) : [],
        departments: Array.isArray(staff.departments) ? staff.departments.filter(Boolean) : [],
      })),
    [staffDirectory],
  );
  const hospitalMatches = useMemo(
    () => filterStringOptions(availableHospitalOptions, scheduleValues.hospital),
    [availableHospitalOptions, scheduleValues.hospital],
  );
  const departmentMatches = useMemo(
    () => filterStringOptions(availableDepartmentOptions, scheduleValues.department),
    [availableDepartmentOptions, scheduleValues.department],
  );
  const staffMatches = useMemo(() => {
    let list = staffLookup;
    const normalizedHospitalQuery = normalizeQuery(scheduleValues.hospital);
    const normalizedDepartmentQuery = normalizeQuery(scheduleValues.department);
    const hospitalFilter = availableHospitalOptions.find(
      (option) => normalizeQuery(option) === normalizedHospitalQuery,
    );
    const departmentFilter = availableDepartmentOptions.find(
      (option) => normalizeQuery(option) === normalizedDepartmentQuery,
    );
    if (hospitalFilter) {
      list = list.filter((entry) =>
        entry.hospitals.some((hospital) => normalizeQuery(hospital) === normalizedHospitalQuery),
      );
    }
    if (departmentFilter) {
      list = list.filter((entry) =>
        entry.departments.some((dept) => normalizeQuery(dept) === normalizedDepartmentQuery),
      );
    }
    const normalizedStaff = normalizeQuery(scheduleValues.staff);
    if (normalizedStaff) {
      list = list.filter((entry) => entry.name.toLowerCase().includes(normalizedStaff));
    }
    return list.slice(0, 8);
  }, [
    staffLookup,
    availableHospitalOptions,
    availableDepartmentOptions,
    scheduleValues.hospital,
    scheduleValues.department,
    scheduleValues.staff,
  ]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search CIN or Name..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Patient
          </button>
        </div>

        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              banner.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {banner.message}
          </div>
        )}

        {fetchError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to sync patients from backend: {fetchError}
          </div>
        )}

        {hasConnector && !fetchError && (
          <div className="text-xs text-emerald-600">
            {lastSyncedLabel ? `Last synced ${lastSyncedLabel}` : ""}
            {isLoadingPatients && <span className="ml-2 text-slate-500">Updating...</span>}
          </div>
        )}

        {hasConnector && fetchError && lastSyncedLabel && (
          <div className="text-xs text-slate-500">Last successful sync: {lastSyncedLabel}</div>
        )}

        <Card className="flex-1 overflow-hidden p-0">
          <div className="overflow-y-auto h-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">CIN</th>
                  <th className="px-6 py-3 font-medium">City</th>
                  <th className="px-6 py-3 font-medium">Insurance</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((p) => (
                  <tr
                    key={p.iid}
                    onClick={() => setSelectedPatient(p)}
                    className={`cursor-pointer transition-colors ${
                      selectedPatient?.iid === p.iid
                        ? "bg-teal-50 dark:bg-teal-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-3 text-slate-500">{p.cin}</td>
                    <td className="px-6 py-3 text-slate-500">{p.city}</td>
                    <td className="px-6 py-3">
                      <Badge color={p.insurance === "None" ? "red" : "blue"}>{p.insurance}</Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.status === "Admitted" ? "bg-orange-500" : "bg-emerald-500"}`} />
                        <span className="text-slate-600 dark:text-slate-400">{p.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {selectedPatient && (
        <div className="w-96 flex flex-col gap-4 animate-in slide-in-from-right duration-300">
          <Card className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-slate-700">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold mb-3">
                {selectedPatient.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPatient.name}</h2>
              <p className="text-slate-500 text-sm">
                {selectedPatient.iid} • {selectedPatient.cin}
              </p>
            </div>

            <div className="py-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Demographics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gender</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedPatient.sex === "M" ? "Male" : "Female"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Birth Date</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.birthDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Blood Group</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedPatient.bloodGroup || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">City</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPatient.email || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Insurance</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">{selectedPatient.insurance}</span>
                    <Badge color={selectedPatient.insuranceStatus === "Active" ? "green" : "orange"}>
                      {selectedPatient.insuranceStatus || "Unknown"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedPatient.policyNumber ? `Policy ${selectedPatient.policyNumber}` : "Policy pending assignment"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-wider">Next Visit</h4>
                {nextVisitInfo ? (
                  <div className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-col leading-none border border-blue-100">
                      <span className="text-[10px] font-bold uppercase">{nextVisitInfo.month}</span>
                      <span className="text-lg font-bold">{nextVisitInfo.day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{nextVisitInfo.reason}</p>
                      <p className="text-xs text-slate-500">
                        {nextVisitInfo.hospital}
                        {nextVisitInfo.department ? ` • ${nextVisitInfo.department}` : ""}
                        {` • ${nextVisitInfo.timeLabel}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No upcoming visits scheduled.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenScheduleModal}
              disabled={!selectedPatient || !appointmentConnector}
              className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-opacity ${
                !selectedPatient || !appointmentConnector
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90"
              }`}
            >
              Schedule Appointment
            </button>
          </Card>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add New Patient">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {submissionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {submissionError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IID *</label>
              <input
                type="text"
                value={formValues.iid}
                onChange={handleInputChange("iid")}
                placeholder="Numeric identifier"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  formErrors.iid ? "border-red-500" : ""
                }`}
              />
              {formErrors.iid && <p className="text-xs text-red-500 mt-1">{formErrors.iid}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CIN *</label>
              <input
                type="text"
                value={formValues.cin}
                onChange={handleInputChange("cin")}
                placeholder="National ID"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 uppercase ${
                  formErrors.cin ? "border-red-500" : ""
                }`}
              />
              {formErrors.cin && <p className="text-xs text-red-500 mt-1">{formErrors.cin}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={formValues.fullName}
              onChange={handleInputChange("fullName")}
              placeholder="Patient full name"
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                formErrors.fullName ? "border-red-500" : ""
              }`}
            />
            {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Birth Date</label>
              <input
                type="date"
                value={formValues.birth}
                onChange={handleInputChange("birth")}
                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sex *</label>
              <select
                value={formValues.sex}
                onChange={handleInputChange("sex")}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  formErrors.sex ? "border-red-500" : ""
                }`}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              {formErrors.sex && <p className="text-xs text-red-500 mt-1">{formErrors.sex}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
              <select
                value={formValues.bloodGroup}
                onChange={handleInputChange("bloodGroup")}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  formErrors.bloodGroup ? "border-red-500" : ""
                }`}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUP_OPTIONS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {formErrors.bloodGroup && <p className="text-xs text-red-500 mt-1">{formErrors.bloodGroup}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={formValues.phone}
                onChange={handleInputChange("phone")}
                placeholder="+212 600-000000"
                maxLength={15}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  formErrors.phone ? "border-red-500" : ""
                }`}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
            <input
              type="text"
              value={formValues.city}
              onChange={handleInputChange("city")}
              placeholder="Primary city"
              maxLength={80}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                formErrors.city ? "border-red-500" : ""
              }`}
            />
            {formErrors.city && <p className="text-xs text-red-500 mt-1">{formErrors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={formValues.email}
              onChange={handleInputChange("email")}
              placeholder="patient@example.com"
              maxLength={160}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                formErrors.email ? "border-red-500" : ""
              }`}
            />
            {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
          </div>

          <p className="text-xs text-slate-500">Fields marked with * are required.</p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg font-medium text-white ${
                isSubmitting ? "bg-teal-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Patient"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isScheduleModalOpen} onClose={handleCloseScheduleModal} title="Schedule Appointment">
        <form className="space-y-4" onSubmit={handleScheduleSubmit}>
          {scheduleSubmissionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {scheduleSubmissionError}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 px-4 py-3 text-sm">
            <p className="font-medium text-slate-800 dark:text-slate-100">{selectedPatient?.name}</p>
            <p className="text-slate-500 text-xs">IID {selectedPatient?.iid} • CIN {selectedPatient?.cin}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                value={scheduleValues.date}
                onChange={handleScheduleInputChange("date")}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  scheduleErrors.date ? "border-red-500" : ""
                }`}
              />
              {scheduleErrors.date && <p className="text-xs text-red-500 mt-1">{scheduleErrors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time *</label>
              <input
                type="time"
                value={scheduleValues.time}
                onChange={handleScheduleInputChange("time")}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  scheduleErrors.time ? "border-red-500" : ""
                }`}
              />
              {scheduleErrors.time && <p className="text-xs text-red-500 mt-1">{scheduleErrors.time}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hospital *</label>
            <div className="relative" ref={hospitalDropdownRef}>
              <input
                type="text"
                value={scheduleValues.hospital}
                onChange={(event) => {
                  handleScheduleInputChange("hospital")(event);
                  setIsHospitalDropdownOpen(true);
                }}
                onFocus={() => setIsHospitalDropdownOpen(true)}
                placeholder="Search or select a hospital"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  scheduleErrors.hospital ? "border-red-500" : ""
                }`}
                autoComplete="off"
              />
              {isHospitalDropdownOpen && availableHospitalOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-10">
                  {hospitalMatches.length ? (
                    hospitalMatches.map((hospital) => (
                      <button
                        type="button"
                        key={`hospital-${hospital}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleHospitalSelect(hospital);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {hospital}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">No hospitals found.</div>
                  )}
                </div>
              )}
            </div>
            {scheduleErrors.hospital && <p className="text-xs text-red-500 mt-1">{scheduleErrors.hospital}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
            <div className="relative" ref={departmentDropdownRef}>
              <input
                type="text"
                value={scheduleValues.department}
                onChange={(event) => {
                  handleScheduleInputChange("department")(event);
                  setIsDepartmentDropdownOpen(true);
                }}
                onFocus={() => setIsDepartmentDropdownOpen(true)}
                placeholder="Search or select a department"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  scheduleErrors.department ? "border-red-500" : ""
                }`}
                autoComplete="off"
              />
              {isDepartmentDropdownOpen && availableDepartmentOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-10">
                  {departmentMatches.length ? (
                    departmentMatches.map((department) => (
                      <button
                        type="button"
                        key={`department-${department}`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleDepartmentSelect(department);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {department}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">No departments found.</div>
                  )}
                </div>
              )}
            </div>
            {scheduleErrors.department && <p className="text-xs text-red-500 mt-1">{scheduleErrors.department}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Staff *</label>
              {staffConnector && (
                <button
                  type="button"
                  onClick={handleRefreshStaffDirectory}
                  disabled={isLoadingStaffDirectory}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 disabled:text-slate-400"
                >
                  {isLoadingStaffDirectory ? "Refreshing..." : "Refresh list"}
                </button>
              )}
            </div>
            <div className="relative" ref={staffDropdownRef}>
              <input
                type="text"
                value={scheduleValues.staff}
                onChange={(event) => {
                  handleScheduleInputChange("staff")(event);
                  setIsStaffDropdownOpen(true);
                }}
                onFocus={() => setIsStaffDropdownOpen(true)}
                placeholder={staffConnector ? "Search by name" : "Enter staff name"}
                className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                  scheduleErrors.staff ? "border-red-500" : ""
                }`}
                autoComplete="off"
              />
              {isStaffDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg z-10">
                  {isLoadingStaffDirectory ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Loading staff directory...</div>
                  ) : staffMatches.length ? (
                    staffMatches.map((staff) => (
                      <button
                        type="button"
                        key={staff.key}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleStaffSelect(staff);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{staff.name}</div>
                        <div className="text-xs text-slate-500">
                          {staff.role}
                          {staff.hospitals.length ? ` • ${staff.hospitals[0]}` : ""}
                          {staff.departments.length ? ` • ${staff.departments[0]}` : ""}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      {staffConnector ? "No staff match this search." : "Enter staff manually."}
                    </div>
                  )}
                </div>
              )}
            </div>
            {scheduleErrors.staff && <p className="text-xs text-red-500 mt-1">{scheduleErrors.staff}</p>}
            {staffDirectoryError && (
              <p className="text-xs text-red-500 mt-1">{staffDirectoryError}</p>
            )}
            {staffConnector && hasRequestedStaffDirectory && !isLoadingStaffDirectory && !staffDirectoryError && staffDirectory.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">No staff data yet—refresh once the backend is ready.</p>
            )}
            {!staffConnector && (
              <p className="text-xs text-slate-500 mt-1">Connect to the staff API to browse available clinicians.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason *</label>
            <textarea
              value={scheduleValues.reason}
              onChange={handleScheduleInputChange("reason")}
              rows={3}
              placeholder="Follow-up, consultation, etc."
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                scheduleErrors.reason ? "border-red-500" : ""
              }`}
            />
            {scheduleErrors.reason && <p className="text-xs text-red-500 mt-1">{scheduleErrors.reason}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
            <select
              value={scheduleValues.status}
              onChange={handleScheduleInputChange("status")}
              className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 ${
                scheduleErrors.status ? "border-red-500" : ""
              }`}
            >
              {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {scheduleErrors.status && <p className="text-xs text-red-500 mt-1">{scheduleErrors.status}</p>}
          </div>

          <p className="text-xs text-slate-500">All fields are required to create an appointment.</p>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleCloseScheduleModal} className="px-4 py-2 text-slate-600 font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScheduling}
              className={`px-4 py-2 rounded-lg font-medium text-white ${
                isScheduling ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {isScheduling ? "Scheduling..." : "Confirm"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientsView;
