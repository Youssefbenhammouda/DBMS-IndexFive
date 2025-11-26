from pydantic import BaseModel
from typing import Literal, Optional
from datetime import date




# Patient model
class Patient(BaseModel):
    iid: int

    cin: str
    full_name: str
    birth: Optional[date] = None
    sex: Literal["M", "F"]
    blood_group: Optional[Literal["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]] = None
    phone: Optional[str] = None



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
