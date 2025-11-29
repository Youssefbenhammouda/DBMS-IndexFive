import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Pill,
  CreditCard,
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
} from "lucide-react";
import OverviewView from "./views/OverviewView";
import PatientsView from "./views/PatientsView";
import AppointmentsView from "./views/AppointmentsView";
import StaffView from "./views/StaffView";
import MedicationsView from "./views/MedicationsView";
import BillingView from "./views/BillingView";
import SidebarItem from "./components/navigation/SidebarItem";
import BackendConnector from "./services/backendConnector";
import PatientConnector from "./services/patientConnector";
import AppointmentConnector from "./services/appointmentConnector";
import StaffConnector from "./services/staffConnector";
import MedicationsConnector from "./services/medicationsConnector";
import BillingConnector from "./services/billingConnector";
import { registerPatientMockServer } from "./data/patientMockServer";
import { registerAppointmentMockServer } from "./data/appointmentMockServer";
import { registerMedicationsMockServer } from "./data/medicationsMockServer";
import { ModelConnector } from "./models/modelConnector";
import { registerCoreModels } from "./models/pageModelRegistry";

export default function MNHSAdmin() {
  const [activePage, setActivePage] = useState("Overview");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  const [pageData, setPageData] = useState({});
  const [loadingPageKey, setLoadingPageKey] = useState(null);
  const [pageErrors, setPageErrors] = useState({});

  const apiBaseUrl = useMemo(() => {
    const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL;
    return (configuredBaseUrl && configuredBaseUrl.trim()) || "http://127.0.0.1:8000/api";
  }, []);

  const backendConnector = useMemo(() => {
    const connector = new BackendConnector({ baseUrl: apiBaseUrl });
    registerPatientMockServer(connector);
    registerAppointmentMockServer(connector);
    registerMedicationsMockServer(connector);
    return connector;
  }, [apiBaseUrl]);

  const modelConnector = useMemo(() => {
    const connector = new ModelConnector(backendConnector);
    registerCoreModels(connector);
    return connector;
  }, [backendConnector]);

  const patientConnector = useMemo(
    () => new PatientConnector(backendConnector, modelConnector),
    [backendConnector, modelConnector],
  );

  const appointmentConnector = useMemo(
    () => new AppointmentConnector(backendConnector, modelConnector),
    [backendConnector, modelConnector],
  );

  const staffConnector = useMemo(
    () => new StaffConnector(backendConnector, modelConnector),
    [backendConnector, modelConnector],
  );

  const medicationsConnector = useMemo(
    () => new MedicationsConnector(backendConnector, modelConnector),
    [backendConnector, modelConnector],
  );

  const billingConnector = useMemo(
    () => new BillingConnector(backendConnector, modelConnector),
    [backendConnector, modelConnector],
  );

  const loadPageData = useCallback(
    async (pageKey, params = {}) => {
      setLoadingPageKey(pageKey);
      setPageErrors((prev) => {
        if (!prev[pageKey]) return prev;
        const next = { ...prev };
        delete next[pageKey];
        return next;
      });
      try {
        const payload = await modelConnector.load(pageKey, params);
        setPageData((prev) => ({ ...prev, [pageKey]: payload }));
      } catch (error) {
        console.error(`Failed to load ${pageKey} data`, error);
        setPageErrors((prev) => ({ ...prev, [pageKey]: error.message }));
      } finally {
        setLoadingPageKey((current) => (current === pageKey ? null : current));
      }
    },
    [modelConnector],
  );

  const refreshBilling = useCallback(
    (filters = {}) => {
      const params = billingConnector?.buildFilterParams ? billingConnector.buildFilterParams(filters) : filters;
      return loadPageData("Billing", params);
    },
    [billingConnector, loadPageData],
  );

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    if (!pageData[activePage]) {
      loadPageData(activePage);
    }
  }, [activePage, loadPageData, pageData]);

  const renderContent = () => {
    const dataForPage = pageData[activePage];
    const errorForPage = pageErrors[activePage];

    if (errorForPage && !dataForPage) {
      if (activePage === "Overview") {
        return <OverviewView data={null} error={errorForPage} onNavigate={setActivePage} />;
      }
      return (
        <div className="p-10 text-center text-red-500">
          Failed to load {activePage} data: {errorForPage}
        </div>
      );
    }

    const isActivePageLoading = loadingPageKey === activePage;

    if (!dataForPage || isActivePageLoading) {
      return <div className="p-10 text-center text-slate-500">Loading {activePage} data...</div>;
    }

    switch (activePage) {
      case "Overview":
          return <OverviewView data={dataForPage} error={errorForPage} onNavigate={setActivePage} />;
      case "Patients":
        return <PatientsView data={dataForPage} error={errorForPage} patientConnector={patientConnector} />;
      case "Appointments":
        return (
          <AppointmentsView
            data={dataForPage}
            error={errorForPage}
            appointmentConnector={appointmentConnector}
          />
        );
      case "Staff":
        return <StaffView data={dataForPage} error={errorForPage} staffConnector={staffConnector} />;
      case "Medications":
        return (
          <MedicationsView
            data={dataForPage}
            error={errorForPage}
            medicationsConnector={medicationsConnector}
          />
        );
      case "Billing":
        return (
          <BillingView
            data={dataForPage}
            error={errorForPage}
            billingConnector={billingConnector}
            onRequestRefresh={refreshBilling}
          />
        );
      default:
        return <div className="p-10 text-center text-slate-500">Module Under Construction</div>;
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-200 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-30 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
          <div className="w-17 h-17 rounded-lg flex items-center justify-center mr-3">
            <img src="/mnhs_logo.png" alt="MNHS Logo" className="w-17 h-17 object-contain" />
          </div>
          <span className="text-xl font-bold text-slate-700 dark:text-white tracking-tight">MNHS Admin</span>
        </div>

        <div className="p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-4">
            Main Menu
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            active={activePage === "Overview"}
            onClick={() => {
              setActivePage("Overview");
              setSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={Users}
            label="Patients"
            active={activePage === "Patients"}
            onClick={() => {
              setActivePage("Patients");
              setSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={Calendar}
            label="Appointments"
            active={activePage === "Appointments"}
            onClick={() => {
              setActivePage("Appointments");
              setSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={Stethoscope}
            label="Staff"
            active={activePage === "Staff"}
            onClick={() => {
              setActivePage("Staff");
              setSidebarOpen(false);
            }}
          />

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-6">
            Resources
          </div>
          <SidebarItem
            icon={Pill}
            label="Medications & Stock"
            active={activePage === "Medications"}
            onClick={() => {
              setActivePage("Medications");
              setSidebarOpen(false);
            }}
          />
          <SidebarItem
            icon={CreditCard}
            label="Billing & Insurance"
            active={activePage === "Billing"}
            onClick={() => {
              setActivePage("Billing");
              setSidebarOpen(false);
            }}
          />
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img src="/mnhs_logo.png" alt="MNHS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
              <p className="text-xs text-slate-500">admin@mnhs.gov.ma</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen flex flex-col transition-all duration-200">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">{activePage}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Global Search..."
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-slate-200"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              onClick={() => setDarkMode(!isDarkMode)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1 overflow-x-hidden">{renderContent()}</div>
      </main>
    </div>
  );
}
