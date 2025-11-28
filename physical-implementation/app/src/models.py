from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Annotated, List, Literal, Optional
from datetime import date, time


# Patient model
class Patient(BaseModel):
    iid: int
    cin: str
    full_name: str
    birth: Optional[date] = None
    sex: Literal["M", "F"]
    blood_group: Optional[
        Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
    ] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class Staff(BaseModel):
    id: int                       # STAFF_ID
    name: str                     # FullName
    status: Optional[str] = "Active"



class MedicationStock(BaseModel):
    hid: int
    hospital_name: str
    mid: int
    medication_name: str
    qty: int
    reorder_level: int


class StaffAppointmentShare(BaseModel):
    staff_id: int
    full_name: str
    status: str
    hid: int
    hospital_name: str
    city: str
    region: str
    percentage: float


# /api/core-dashboard

AppointmentStatus = Literal["Scheduled", "Completed", "Cancelled"]


class QueryCoreDashboardStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    date_range: Optional[str] = Field(default=None, alias="range")

    @field_validator("date_range")
    @classmethod
    def validate_iso_date_range(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        try:
            start_raw, end_raw = value.split("/", 1)
        except ValueError as exc:
            raise ValueError(
                "range must contain two ISO dates separated by '/' "
            ) from exc

        start_str = start_raw.strip()
        end_str = end_raw.strip()

        try:
            start_date = date.fromisoformat(start_str)
            end_date = date.fromisoformat(end_str)
        except ValueError as exc:
            raise ValueError("range dates must follow ISO format YYYY-MM-DD") from exc

        if start_date > end_date:
            raise ValueError("range start date must be on or before the end date")

        return f"{start_date.isoformat()}/{end_date.isoformat()}"


class CoreDashboardAppointment(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    patient_name: str = Field(alias="patientName")
    status: AppointmentStatus
    hospital: str
    date: date
    time: time
    department: str


class CoreDashboardStaff(BaseModel):
    id: int
    name: str
    role: str
    hospitals: List[str]
    workload: int
    status: str


class CoreDashboardMedication(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str
    category: str
    stock_level: int = Field(alias="stockLevel")
    reorder_point: int = Field(alias="reorderPoint")
    unit: str


class CoreDashboardSummaryStats(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    total_appointments: int = Field(alias="totalAppointments")
    upcoming_appointments: int = Field(alias="upcomingAppointments")
    active_staff: int = Field(alias="activeStaff")
    admitted_patients: int = Field(alias="admittedPatients")


class CoreDashboardResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    appointments: List[CoreDashboardAppointment] = Field(default_factory=list)
    staff: List[CoreDashboardStaff] = Field(default_factory=list)
    staff_leaderboard: List[CoreDashboardStaff] = Field(
        default_factory=list, alias="staffLeaderboard"
    )
    low_stock_medications: List[CoreDashboardMedication] = Field(
        default_factory=list, alias="lowStockMedications"
    )
    summary: CoreDashboardSummaryStats
