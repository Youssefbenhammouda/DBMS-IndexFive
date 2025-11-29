# # Billing & Insurance Dashboard – Database-Aligned Design

# The redesigned Billing view only surfaces insights that can be computed from the MNHS lab schema (`Hospital`, `Department`, `Staff`, `Patient`, `ClinicalActivity`, `Expense`, `Insurance`, `Prescription`, `Includes`). Widgets that previously depended on mock-only fields (claim status, reimbursement timeline, free-form notes) have been removed. This document describes the layout, data contracts, and backend rules that map directly to the available tables.

# ## 1. Objectives
# - Use persisted data only: every number on the page must be derivable from the relations listed above.
# - Keep the round-trip contract (`GET /api/billing`) so the UI still hydrates all widgets with one request.
# - Document how write actions (`POST /api/billing/expense`) interact with real tables and which features remain backlog until supporting tables exist.

# ## 2. Data Sources & Mapping

# | Dataset / Widget | Tables & Columns | Notes |
# | --- | --- | --- |
# | Activity KPIs | `Expense.Total`, `ClinicalActivity.Date`, `Hospital.Region`, `Insurance.InsID` | Aggregations over the last *N* days (default 30). |
# | Insurance Coverage Mix | `Expense`, `Insurance` | Treat `InsID IS NULL` as **Self-Pay** bucket. |
# | Hospital Billing Overview | `Hospital`, `ClinicalActivity`, `Expense`, `Insurance` | Group by `Hospital.HID`; show totals, volume, insured share. |
# | Department Leaderboard | `Department`, `ClinicalActivity`, `Expense` | Top departments by billed MAD and visit count. |
# | Recent Billable Activities | `Expense`, `ClinicalActivity`, `Hospital`, `Department`, `Patient`, `Staff`, `Insurance` | Sorted by `ClinicalActivity.Date` + `Time`. |
# | Medication Utilization Snapshot | `Prescription`, `Includes`, `Medication` | Count prescriptions and list medications linked to billed CAIDs. |

# ## 3. Dashboard Layout (what the UI renders)

# ### 3.1 Activity KPIs
# Four KPI tiles:
# 1. **Total Billings (30d)** – `SUM(Expense.Total)` filtered by `ClinicalActivity.Date >= CURRENT_DATE - days_back`.
# 2. **Insured Coverage** – `SUM(Expense.Total WHERE InsID IS NOT NULL) / SUM(Expense.Total)`.
# 3. **Average Expense per Activity** – `SUM(Expense.Total) / COUNT(DISTINCT Expense.ExpID)`.
# 4. **Active Hospitals** – `COUNT(DISTINCT Hospital.HID)` present in the filtered result set.
# Each KPI includes an `iconKey` (`CreditCard`, `ShieldCheck`, `Clock3`, `AlertTriangle`) and an optional trend percentage calculated by comparing the current window to the previous window.

# ### 3.2 Insurance Coverage Mix (pie + legend)
# - Data rows: `type`, `insId`, `amount`, `activities` (count of expenses), `share` (percentage of total MAD).
# - `type` pulls from `Insurance.Type`; use `"Self-Pay"` when `InsID IS NULL`.

# ### 3.3 Hospital Billing Overview (table)
# For each hospital in the filtered result set show:
# - `hid`, `name`, `region` (from `Hospital`).
# - `total` MAD billed, `activities` (expense count), `insuredShare` ratio, and `avgExpense` per activity.
# Sort descending by `total`. This replaces the old "outstanding claims" card.

# ### 3.4 Department Leaderboard (horizontal list)
# Top departments by billed MAD:
# - `depId`, `department`, `hospital`, `specialty`, `total`, `activities`.
# - Highlight departments whose `total` exceeds the network average to focus operational reviews.

# ### 3.5 Recent Billable Activities (table + drawer)
# - Rows limited to the latest 25 `Expense` records (most recent `ClinicalActivity.Date`, then `Time`).
# - Columns: `expId`, `caid`, formatted `activityDate`, `hospital`, `department`, `patient`, `insurance.type` (or `Self-Pay`), `total`.
# - Drawer details fetch related staff (`Staff.FullName`) and prescriptions.
# - Medication list is derived from `Includes` (`Dosage`, `Duration`) joined to `Medication.Name` and `TherapeuticClass`. No status/notes column is displayed because those fields do not exist in the schema.

# ### 3.6 Medication Utilization Snapshot (bar list)
# Shows the top prescribed medications tied to billed clinical activities:
# - `mid`, `name`, `therapeuticClass`, `prescriptions` (count of `Includes` rows), and `% of billed prescriptions`.
# - Use this in place of the previous reimbursement timeline since we can reliably compute utilization but not payment timing.

# ## 4. API Contract (v2)

# ### 4.1 Endpoint Summary

# | Method | Path | Purpose |
# | --- | --- | --- |
# | `GET` | `/api/billing` | Fetch all dashboard data aligned with the schema. |
# | `POST` | `/api/billing/expense` | Insert a new `Expense` row tied to an existing `ClinicalActivity`. |

# > `POST /api/billing/insurance-payment` is **deferred**. The current database does not contain a payments table, so the endpoint remains on the backlog until a `Payment` relation is introduced.

# ### 4.2 `GET /api/billing`

# - **Query Params:**
#   - `hospital_id` (optional) – limits results to one hospital.
#   - `department_id` (optional) – narrows aggregations to a single department.
#   - `insurance_id` (optional) – filter by insurer or `null` for Self-Pay.
#   - `days_back` (default `30`) – rolling window applied to `ClinicalActivity.Date`.
# - **Response Body:**

# ```json
# {
#   "kpis": [
#     {
#       "key": "totalMonthlyBillings",
#       "title": "Total Billings (30d)",
#       "value": 1280000,
#       "unit": "MAD",
#       "trend": { "direction": "up", "value": 0.084 },
#       "iconKey": "CreditCard"
#     },
#     {
#       "key": "insuredCoverage",
#       "title": "Insured Coverage",
#       "value": 0.78,
#       "unit": "ratio",
#       "trend": { "direction": "up", "value": 0.032 },
#       "iconKey": "ShieldCheck"
#     }
#   ],
#   "insuranceSplit": [
#     { "insId": 1, "type": "CNOPS", "amount": 520000, "activities": 138, "share": 41 },
#     { "insId": null, "type": "Self-Pay", "amount": 50000, "activities": 32, "share": 4 }
#   ],
#   "hospitalRollup": [
#     { "hid": 3, "name": "Casablanca Central", "region": "Casablanca-Settat", "total": 260000, "activities": 84, "insuredShare": 0.81, "avgExpense": 3095 }
#   ],
#   "departmentSummary": [
#     { "depId": 14, "hospital": "Casablanca Central", "department": "Cardiology", "specialty": "Cardiology", "total": 76000, "activities": 22, "avgExpense": 3450 }
#   ],
#   "recentExpenses": [
#     {
#       "expId": 1048,
#       "caid": 8123,
#       "activityDate": "2025-11-12",
#       "hospital": { "hid": 4, "name": "Rabat University Hospital" },
#       "department": { "depId": 21, "name": "Cardiology" },
#       "patient": { "iid": 5401, "fullName": "Amina Haddad" },
#       "staff": { "staffId": 221, "fullName": "Dr. Selma Idrissi" },
#       "insurance": { "insId": 2, "type": "CNSS" },
#       "total": 2450,
#       "prescription": {
#         "pid": 9901,
#         "medications": [
#           { "mid": 120, "name": "Atorvastatin 40mg", "dosage": "1 tablet", "duration": "30 days" },
#           { "mid": 218, "name": "Metoprolol 50mg", "dosage": "1 tablet", "duration": "30 days" }
#         ]
#       }
#     }
#   ],
#   "medicationUtilization": [
#     { "mid": 120, "name": "Atorvastatin 40mg", "therapeuticClass": "Statin", "prescriptions": 48, "share": 0.16 }
#   ],
#   "metadata": {
#     "filters": { "hospitalId": null, "departmentId": null, "insuranceId": null, "daysBack": 30 },
#     "lastSyncedAt": "2025-11-27T12:34:56Z"
#   }
# }
# ```

# - **Contract Notes:**
#   - Amount fields are numeric (MAD). The UI still formats them via `Intl.NumberFormat`.
#   - `insuranceSplit.share` and `medicationUtilization.share` are expressed as percentages (0–100) or ratios (0–1); the client decides how to display them but the backend must be consistent.
#   - `recentExpenses` must include the relational identifiers so the drawer can deep-link to other admin pages.
#   - `prescription` is optional; omit it when no `Prescription` exists for the `CAID`.
#   - `metadata.filters` echoes the resolved filters for audit/debug purposes.

# ### 4.3 `POST /api/billing/expense`

# - **Purpose:** insert an `Expense` row for an existing clinical activity and, optionally, associate it with an insurer.
# - **Request Body:**

# ```json
# {
#   "caid": 8123,
#   "insId": 2,
#   "total": 2450.0
# }
# ```

# - **Validation Rules:**
#   1. `caid` is required and must reference a `ClinicalActivity` that does **not** already have an `Expense` (`UNIQUE` constraint on `Expense.CAID`).
#   2. `total` must be `>= 0` and comply with trigger T2 (recompute against linked `Includes` rows when present).
#   3. `insId` is optional; when provided it must match an existing `Insurance.InsID`. Use `null` for Self-Pay.
# - **Response:**

# ```json
# {
#   "expense": { "expId": 2056, "caid": 8123, "insId": 2, "total": 2450.0 },
#   "message": "Expense captured"
# }
# ```

# ### 4.4 Deferred: `POST /api/billing/insurance-payment`
# The former reimbursement endpoint required an `OutstandingClaims` table that does not exist. Until a normalized payments table is added to the schema, this endpoint stays unimplemented. The UI surfaces a roadmap note instead of a form.

# ## 5. Error Handling & Frontend Integration
# - All endpoints return JSON errors: `{ "message": "human readable", "code": "BILLING_xxx" }` with HTTP status codes (400 validation, 404 missing CAID, 409 trigger violation, 500 unexpected).
# - Database trigger failures bubble up via `SIGNAL` and should propagate unchanged.
# - `BillingConnector` keeps the same contract: after a successful `POST /api/billing/expense` it clears the cached `Billing` payload so the next `GET` reflects the insert.
# - When `/api/billing` fails, the Billing view falls back to the inline mock snapshot and displays the error banner; once a real payload arrives it shows the "Connected via BillingConnector" indicator and uses `metadata.lastSyncedAt` for recency messaging.


from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Annotated, Any, Dict, List, Literal, Optional, Sequence, Tuple, Union
from datetime import timezone
import aiomysql
from pydantic import BaseModel, ConfigDict, Field, PrivateAttr, field_validator


UNSET = object()


# Reusable constrained scalar aliases keep monetary and identifier fields consistent.
PositiveId = Annotated[int, Field(gt=0)]
NonNegativeAmount = Annotated[float, Field(ge=0)]
ShareValue = Annotated[float, Field(ge=0, le=100)]
NonNegativeCount = Annotated[int, Field(ge=0)]


TrendDirection = Literal["up", "down", "flat"]
IconKey = Literal["CreditCard", "ShieldCheck", "Clock3", "AlertTriangle"]
KPIKey = Literal[
    "totalMonthlyBillings",
    "insuredCoverage",
    "averageExpensePerActivity",
    "activeHospitals",
]
KPIUnit = Literal["MAD", "ratio", "count"]
InsuranceScope = Literal["all", "self", "insurer"]


class BillingTrend(BaseModel):
    direction: TrendDirection
    value: float


class BillingKPI(BaseModel):
    key: KPIKey
    title: str
    value: float
    unit: KPIUnit
    iconKey: IconKey
    trend: Optional[BillingTrend] = None


class BillingInsuranceSplitRow(BaseModel):
    insId: Optional[PositiveId] = None
    type: str
    amount: NonNegativeAmount
    activities: NonNegativeCount
    share: ShareValue


class BillingHospitalRollupRow(BaseModel):
    hid: PositiveId
    name: str
    region: str
    total: NonNegativeAmount
    activities: NonNegativeCount
    insuredShare: ShareValue
    avgExpense: NonNegativeAmount


class BillingDepartmentSummaryRow(BaseModel):
    depId: PositiveId
    hospital: str
    department: str
    specialty: str
    total: NonNegativeAmount
    activities: NonNegativeCount
    avgExpense: NonNegativeAmount


class BillingHospitalRef(BaseModel):
    hid: PositiveId
    name: str


class BillingDepartmentRef(BaseModel):
    depId: PositiveId
    name: str


class BillingPatientRef(BaseModel):
    iid: PositiveId
    fullName: str


class BillingStaffRef(BaseModel):
    staffId: PositiveId
    fullName: str


class BillingInsuranceRef(BaseModel):
    insId: Optional[PositiveId] = None
    type: str = Field(default="Self-Pay")


class BillingPrescriptionMedication(BaseModel):
    mid: PositiveId
    name: str
    dosage: str
    duration: str


class BillingPrescription(BaseModel):
    pid: PositiveId
    medications: List[BillingPrescriptionMedication] = Field(default_factory=list)


class BillingRecentExpense(BaseModel):
    expId: PositiveId
    caid: PositiveId
    activityDate: date
    hospital: BillingHospitalRef
    department: BillingDepartmentRef
    patient: BillingPatientRef
    staff: BillingStaffRef
    insurance: BillingInsuranceRef
    total: NonNegativeAmount
    prescription: Optional[BillingPrescription] = None


class BillingMedicationUtilizationRow(BaseModel):
    mid: PositiveId
    name: str
    therapeuticClass: str
    prescriptions: NonNegativeCount
    share: ShareValue


class BillingFilters(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    hospital_id: Optional[PositiveId] = Field(default=None, alias="hospitalId")
    department_id: Optional[PositiveId] = Field(default=None, alias="departmentId")
    insurance_id: Optional[PositiveId] = Field(default=None, alias="insuranceId")
    insurance_scope: InsuranceScope = Field(default="all", alias="insuranceScope")
    days_back: int = Field(default=90, alias="daysBack", ge=1)


class BillingMetadata(BaseModel):
    filters: BillingFilters = Field(default_factory=BillingFilters)
    lastSyncedAt: datetime


class BillingResponse(BaseModel):
    kpis: List[BillingKPI] = Field(default_factory=list)
    insuranceSplit: List[BillingInsuranceSplitRow] = Field(default_factory=list)
    hospitalRollup: List[BillingHospitalRollupRow] = Field(default_factory=list)
    departmentSummary: List[BillingDepartmentSummaryRow] = Field(default_factory=list)
    recentExpenses: List[BillingRecentExpense] = Field(default_factory=list)
    medicationUtilization: List[BillingMedicationUtilizationRow] = Field(
        default_factory=list
    )
    metadata: BillingMetadata


class BillingQueryParams(BaseModel):
    """FastAPI dependency for /api/billing query string validation."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    hospital_id: Optional[PositiveId] = Field(default=None, alias="hospital_id")
    department_id: Optional[PositiveId] = Field(default=None, alias="department_id")
    insurance_id: Optional[str] = Field(default=None, alias="insurance_id")
    days_back: int = Field(default=90, alias="days_back", ge=1, le=365)
    _insurance_filter_value: object = PrivateAttr(default=UNSET)
    _insurance_scope: InsuranceScope = PrivateAttr(default="all")
    _metadata_insurance_id: Optional[PositiveId] = PrivateAttr(default=None)

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        filter_value, scope, metadata_ins_id = self._resolve_insurance_directive(
            self.insurance_id
        )
        object.__setattr__(self, "_insurance_filter_value", filter_value)
        object.__setattr__(self, "_insurance_scope", scope)
        object.__setattr__(self, "_metadata_insurance_id", metadata_ins_id)

    @field_validator("insurance_id", mode="before")
    @classmethod
    def normalize_raw_insurance(cls, value: Optional[Union[str, int]]) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, str):
            return value.strip()
        return str(value)

    @staticmethod
    def _resolve_insurance_directive(
        raw_value: Optional[str],
    ) -> Tuple[object, InsuranceScope, Optional[PositiveId]]:
        if raw_value is None or raw_value == "":
            return UNSET, "all", None

        normalized = raw_value.strip().lower()
        if normalized in {"none", "all"}:
            return UNSET, "all", None
        if normalized in {"self", "self-pay", "self_pay"}:
            return None, "self", None

        try:
            numeric = int(normalized)
        except ValueError as exc:  # pragma: no cover - defensive validation
            raise ValueError(
                "insurance_id must be a positive integer, 'self', or 'none'"
            ) from exc
        if numeric <= 0:
            raise ValueError("insurance_id must be positive when numeric")
        return numeric, "insurer", numeric

    def insurance_filter_value(self) -> object:
        """Return sentinel-aware insurance filter for SQL builders."""

        return self._insurance_filter_value

    def to_metadata_filters(self) -> BillingFilters:
        """Convert the query dependency into the echo metadata schema."""

        return BillingFilters(
            hospitalId=self.hospital_id,
            departmentId=self.department_id,
            insuranceId=self._metadata_insurance_id,
            insuranceScope=self._insurance_scope,
            daysBack=self.days_back,
        )


class BillingExpenseRecord(BaseModel):
    expId: PositiveId
    caid: PositiveId
    insId: Optional[PositiveId] = None
    total: NonNegativeAmount


class CreateExpenseRequest(BaseModel):
    caid: PositiveId
    insId: Optional[PositiveId] = None
    total: NonNegativeAmount


class CreateExpenseResponse(BaseModel):
    expense: BillingExpenseRecord
    message: str = Field(default="Expense captured")


class BillingErrorResponse(BaseModel):
    message: str
    code: str


@dataclass(frozen=True)
class BillingQueryContext:
    where_sql: str
    params: Tuple[Any, ...]
    filters: BillingFilters
    query: BillingQueryParams


class BillingAPIError(Exception):
    """Exception carrying HTTP semantics for billing endpoints."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message

    def to_payload(self) -> Dict[str, str]:
        return {"message": self.message, "code": self.code}


async def get_billing_dashboard(
    conn: aiomysql.Connection, query: BillingQueryParams
) -> BillingResponse:
    """Aggregate billing dashboard data using the MNHS schema."""

    context = _build_query_context(query)
    kpis = await _fetch_kpis(conn, context)
    insurance_split = await _fetch_insurance_split(conn, context)
    hospital_rollup = await _fetch_hospital_rollup(conn, context)
    department_summary = await _fetch_department_summary(conn, context)
    recent_expenses = await _fetch_recent_expenses(conn, context)
    medication_utilization = await _fetch_medication_utilization(conn, context)
    metadata = BillingMetadata(
        filters=context.filters,
        lastSyncedAt=datetime.now(timezone.utc),
    )
    return BillingResponse(
        kpis=kpis,
        insuranceSplit=insurance_split,
        hospitalRollup=hospital_rollup,
        departmentSummary=department_summary,
        recentExpenses=recent_expenses,
        medicationUtilization=medication_utilization,
        metadata=metadata,
    )


async def create_billing_expense(
    conn: aiomysql.Connection, payload: CreateExpenseRequest
) -> BillingExpenseRecord:
    """Insert a new expense tied to a clinical activity."""

    await _assert_clinical_activity_exists(conn, payload.caid)
    await _assert_expense_absent(conn, payload.caid)
    if payload.insId is not None:
        await _assert_insurance_exists(conn, payload.insId)

    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Expense (InsID, CAID, Total)
            VALUES (%s, %s, %s)
            """,
            (payload.insId, payload.caid, payload.total),
        )
        exp_id = cur.lastrowid

    return BillingExpenseRecord(
        expId=exp_id,
        caid=payload.caid,
        insId=payload.insId,
        total=payload.total,
    )


def _build_query_context(query: BillingQueryParams) -> BillingQueryContext:
    days_delta = max(query.days_back - 1, 0)
    start_date = datetime.utcnow().date() - timedelta(days=days_delta)
    conditions: List[str] = ["ca.Date >= %s"]
    params: List[Any] = [start_date]
    if query.hospital_id is not None:
        conditions.append("h.HID = %s")
        params.append(query.hospital_id)
    if query.department_id is not None:
        conditions.append("d.DEP_ID = %s")
        params.append(query.department_id)
    insurance_filter = query.insurance_filter_value()
    if insurance_filter is not UNSET:
        if insurance_filter is None:
            conditions.append("e.InsID IS NULL")
        else:
            conditions.append("e.InsID = %s")
            params.append(insurance_filter)
    where_sql = " AND ".join(conditions)
    filters = query.to_metadata_filters()
    return BillingQueryContext(
        where_sql=where_sql,
        params=tuple(params),
        filters=filters,
        query=query,
    )


async def _fetch_kpis(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingKPI]:
    row = await _fetchone(
        conn,
        f"""
        SELECT
            COALESCE(SUM(e.Total), 0) AS total_billed,
            COALESCE(SUM(CASE WHEN e.InsID IS NOT NULL THEN e.Total END), 0) AS insured_billed,
            COUNT(DISTINCT e.ExpID) AS expense_count,
            COUNT(DISTINCT h.HID) AS hospital_count
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        WHERE {ctx.where_sql}
        """,
        ctx.params,
    )
    total_billed = float(row["total_billed"]) if row else 0.0
    insured_billed = float(row["insured_billed"]) if row else 0.0
    expense_count = int(row["expense_count"]) if row else 0
    hospital_count = int(row["hospital_count"]) if row else 0
    avg_expense = total_billed / expense_count if expense_count else 0.0
    coverage_ratio = insured_billed / total_billed if total_billed else 0.0
    duration_label = f"{ctx.query.days_back}d"
    return [
        BillingKPI(
            key="totalMonthlyBillings",
            title=f"Total Billings ({duration_label})",
            value=total_billed,
            unit="MAD",
            iconKey="CreditCard",
        ),
        BillingKPI(
            key="insuredCoverage",
            title="Insured Coverage",
            value=coverage_ratio,
            unit="ratio",
            iconKey="ShieldCheck",
        ),
        BillingKPI(
            key="averageExpensePerActivity",
            title="Average Expense per Activity",
            value=avg_expense,
            unit="MAD",
            iconKey="Clock3",
        ),
        BillingKPI(
            key="activeHospitals",
            title="Active Hospitals",
            value=float(hospital_count),
            unit="count",
            iconKey="AlertTriangle",
        ),
    ]


async def _fetch_insurance_split(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingInsuranceSplitRow]:
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            e.InsID AS insId,
            COALESCE(i.Type, 'Self-Pay') AS type,
            COALESCE(SUM(e.Total), 0) AS amount,
            COUNT(*) AS activities
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        LEFT JOIN Insurance i ON i.InsID = e.InsID
        WHERE {ctx.where_sql}
        GROUP BY e.InsID, i.Type
        ORDER BY amount DESC
        """,
        ctx.params,
    )
    total_amount = sum(float(row["amount"]) for row in rows) if rows else 0.0
    result: List[BillingInsuranceSplitRow] = []
    for row in rows:
        amount = float(row["amount"])
        share = (amount / total_amount * 100.0) if total_amount else 0.0
        result.append(
            BillingInsuranceSplitRow(
                insId=row["insId"],
                type=row["type"] or "Self-Pay",
                amount=amount,
                activities=int(row["activities"]),
                share=share,
            )
        )
    return result


async def _fetch_hospital_rollup(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingHospitalRollupRow]:
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            h.HID AS hid,
            h.Name AS name,
            h.Region AS region,
            COALESCE(SUM(e.Total), 0) AS total,
            COUNT(*) AS activities,
            COALESCE(SUM(CASE WHEN e.InsID IS NOT NULL THEN e.Total END), 0) AS insured_total
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        WHERE {ctx.where_sql}
        GROUP BY h.HID, h.Name, h.Region
        ORDER BY total DESC
        """,
        ctx.params,
    )
    result: List[BillingHospitalRollupRow] = []
    for row in rows:
        total = float(row["total"])
        activities = int(row["activities"])
        avg_expense = total / activities if activities else 0.0
        insured_total = float(row["insured_total"])
        insured_share = insured_total / total * 100 if total else 0.0
        result.append(
            BillingHospitalRollupRow(
                hid=row["hid"],
                name=row["name"],
                region=row["region"],
                total=total,
                activities=activities,
                insuredShare=insured_share,
                avgExpense=avg_expense,
            )
        )
    return result


async def _fetch_department_summary(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingDepartmentSummaryRow]:
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            d.DEP_ID AS depId,
            d.Name AS department,
            d.Specialty AS specialty,
            h.Name AS hospital,
            COALESCE(SUM(e.Total), 0) AS total,
            COUNT(*) AS activities
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        WHERE {ctx.where_sql}
        GROUP BY d.DEP_ID, d.Name, d.Specialty, h.Name
        ORDER BY total DESC
        """,
        ctx.params,
    )
    result: List[BillingDepartmentSummaryRow] = []
    for row in rows:
        total = float(row["total"])
        activities = int(row["activities"])
        avg_expense = total / activities if activities else 0.0
        result.append(
            BillingDepartmentSummaryRow(
                depId=row["depId"],
                hospital=row["hospital"],
                department=row["department"],
                specialty=row["specialty"],
                total=total,
                activities=activities,
                avgExpense=avg_expense,
            )
        )
    return result


async def _fetch_recent_expenses(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingRecentExpense]:
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            e.ExpID AS expId,
            e.Total AS total,
            ca.CAID AS caid,
            ca.Date AS activityDate,
            h.HID AS hid,
            h.Name AS hospitalName,
            d.DEP_ID AS depId,
            d.Name AS departmentName,
            p.IID AS iid,
            p.FullName AS patientName,
            s.STAFF_ID AS staffId,
            s.FullName AS staffName,
            i.InsID AS insId,
            i.Type AS insuranceType,
            pr.PID AS pid
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        JOIN Patient p ON p.IID = ca.IID
        JOIN Staff s ON s.STAFF_ID = ca.STAFF_ID
        LEFT JOIN Insurance i ON i.InsID = e.InsID
        LEFT JOIN Prescription pr ON pr.CAID = ca.CAID
        WHERE {ctx.where_sql}
        ORDER BY ca.Date DESC, COALESCE(ca.Time, '00:00:00') DESC
        LIMIT 25
        """,
        ctx.params,
    )
    pid_list = [row["pid"] for row in rows if row["pid"] is not None]
    meds_by_pid = (
        await _fetch_medications_for_prescriptions(conn, pid_list) if pid_list else {}
    )
    result: List[BillingRecentExpense] = []
    for row in rows:
        ins_type = row["insuranceType"] or "Self-Pay"
        insurance = BillingInsuranceRef(insId=row["insId"], type=ins_type)
        prescription = None
        if row["pid"] is not None:
            prescription = BillingPrescription(
                pid=row["pid"],
                medications=meds_by_pid.get(row["pid"], []),
            )
        result.append(
            BillingRecentExpense(
                expId=row["expId"],
                caid=row["caid"],
                activityDate=row["activityDate"],
                hospital=BillingHospitalRef(hid=row["hid"], name=row["hospitalName"]),
                department=BillingDepartmentRef(
                    depId=row["depId"], name=row["departmentName"]
                ),
                patient=BillingPatientRef(iid=row["iid"], fullName=row["patientName"]),
                staff=BillingStaffRef(
                    staffId=row["staffId"], fullName=row["staffName"]
                ),
                insurance=insurance,
                total=float(row["total"]),
                prescription=prescription,
            )
        )
    return result


async def _fetch_medications_for_prescriptions(
    conn: aiomysql.Connection, pids: Sequence[int]
) -> Dict[int, List[BillingPrescriptionMedication]]:
    placeholders = ",".join(["%s"] * len(pids))
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            inc.PID AS pid,
            inc.MID AS mid,
            m.Name AS name,
            inc.Dosage AS dosage,
            inc.Duration AS duration
        FROM Includes inc
        JOIN Medication m ON m.MID = inc.MID
        WHERE inc.PID IN ({placeholders})
        ORDER BY inc.PID
        """,
        tuple(pids),
    )
    meds: Dict[int, List[BillingPrescriptionMedication]] = {}
    for row in rows:
        meds.setdefault(row["pid"], []).append(
            BillingPrescriptionMedication(
                mid=row["mid"],
                name=row["name"],
                dosage=row["dosage"],
                duration=row["duration"],
            )
        )
    return meds


async def _fetch_medication_utilization(
    conn: aiomysql.Connection, ctx: BillingQueryContext
) -> List[BillingMedicationUtilizationRow]:
    rows = await _fetchall(
        conn,
        f"""
        SELECT
            m.MID AS mid,
            m.Name AS name,
            m.TherapeuticClass AS therapeuticClass,
            COUNT(*) AS prescriptions
        FROM Expense e
        JOIN ClinicalActivity ca ON ca.CAID = e.CAID
        JOIN Prescription pr ON pr.CAID = ca.CAID
        JOIN Includes inc ON inc.PID = pr.PID
        JOIN Medication m ON m.MID = inc.MID
        JOIN Department d ON d.DEP_ID = ca.DEP_ID
        JOIN Hospital h ON h.HID = d.HID
        WHERE {ctx.where_sql}
        GROUP BY m.MID, m.Name, m.TherapeuticClass
        ORDER BY prescriptions DESC
        LIMIT 10
        """,
        ctx.params,
    )
    total_prescriptions = sum(int(row["prescriptions"]) for row in rows) if rows else 0
    result: List[BillingMedicationUtilizationRow] = []
    for row in rows:
        count = int(row["prescriptions"])
        share = count / total_prescriptions if total_prescriptions else 0.0
        result.append(
            BillingMedicationUtilizationRow(
                mid=row["mid"],
                name=row["name"],
                therapeuticClass=row["therapeuticClass"],
                prescriptions=count,
                share=share,
            )
        )
    return result


async def _assert_clinical_activity_exists(
    conn: aiomysql.Connection, caid: int
) -> None:
    row = await _fetchone(
        conn,
        "SELECT CAID FROM ClinicalActivity WHERE CAID = %s",
        (caid,),
    )
    if row is None:
        raise BillingAPIError(404, "BILLING_CaidMissing", "Clinical activity not found")


async def _assert_expense_absent(conn: aiomysql.Connection, caid: int) -> None:
    row = await _fetchone(
        conn,
        "SELECT ExpID FROM Expense WHERE CAID = %s",
        (caid,),
    )
    if row is not None:
        raise BillingAPIError(
            409, "BILLING_ExpenseExists", "Expense already captured for this activity"
        )


async def _assert_insurance_exists(conn: aiomysql.Connection, ins_id: int) -> None:
    row = await _fetchone(
        conn,
        "SELECT InsID FROM Insurance WHERE InsID = %s",
        (ins_id,),
    )
    if row is None:
        raise BillingAPIError(
            404, "BILLING_InsuranceMissing", "Insurance record not found"
        )


async def _fetchone(
    conn: aiomysql.Connection,
    sql: str,
    params: Union[Sequence[Any], Tuple[Any, ...]] = (),
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql, params)
        return await cur.fetchone()


async def _fetchall(
    conn: aiomysql.Connection,
    sql: str,
    params: Union[Sequence[Any], Tuple[Any, ...]] = (),
) -> List[Dict[str, Any]]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql, params)
        return await cur.fetchall()


__all__ = [
    "BillingDepartmentRef",
    "BillingDepartmentSummaryRow",
    "BillingAPIError",
    "BillingErrorResponse",
    "BillingExpenseRecord",
    "BillingFilters",
    "BillingHospitalRef",
    "BillingHospitalRollupRow",
    "BillingInsuranceRef",
    "BillingInsuranceSplitRow",
    "BillingKPI",
    "BillingMedicationUtilizationRow",
    "BillingMetadata",
    "BillingPatientRef",
    "BillingPrescription",
    "BillingPrescriptionMedication",
    "BillingQueryParams",
    "BillingRecentExpense",
    "BillingResponse",
    "BillingStaffRef",
    "BillingTrend",
    "create_billing_expense",
    "CreateExpenseRequest",
    "CreateExpenseResponse",
    "get_billing_dashboard",
    "IconKey",
    "InsuranceScope",
    "KPIKey",
    "KPIUnit",
    "TrendDirection",
]
