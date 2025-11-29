"""Medications endpoint models and data access helpers."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Any, Dict, List, Optional, Sequence, Tuple

import aiomysql
from pydantic import BaseModel, ConfigDict, Field


# Reusable constrained scalar aliases keep validation rules self-documenting.
NonEmptyStr = Annotated[str, Field(min_length=1, max_length=160)]
MedicationId = Annotated[str, Field(min_length=1, max_length=64)]
TherapeuticClass = Annotated[str, Field(min_length=1, max_length=120)]
NonNegativeNumber = Annotated[float, Field(ge=0)]
PositiveNumber = Annotated[float, Field(gt=0)]
NonNegativeInt = Annotated[int, Field(ge=0)]


class MedicationsAPIError(Exception):
    """Exception carrying HTTP semantics for medications endpoints."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.message = message


class MedicationBase(BaseModel):
    """Common attributes shared by medication payloads and DB rows."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    id: MedicationId
    name: NonEmptyStr = Field(max_length=100)
    hospital: NonEmptyStr
    qty: NonNegativeNumber
    reorder_level: NonNegativeNumber = Field(alias="reorderLevel")
    unit: NonEmptyStr = Field(max_length=40)
    therapeutic_class: Optional[TherapeuticClass] = Field(
        default=None,
        alias="class",
    )


class MedicationIn(MedicationBase):
    """Request body for ``POST /api/medications``."""


class MedicationRecord(MedicationBase):
    """Canonical representation of a medication row returned to clients."""


class MedicationCreateResponse(BaseModel):
    medication: MedicationRecord
    message: str = Field(default="Medication created")


class MedicationLowStockRow(MedicationBase):
    """Row used inside the ``lowStock`` table."""


class MedicationPricingSummaryRow(BaseModel):
    hospital: NonEmptyStr
    medication: NonEmptyStr
    avg: NonNegativeNumber
    min: NonNegativeNumber
    max: NonNegativeNumber
    updatedAt: datetime


class MedicationPriceSeriesRow(BaseModel):
    hospital: NonEmptyStr
    avgUnitPrice: NonNegativeNumber


class MedicationReplenishmentPoint(BaseModel):
    month: NonEmptyStr
    qty: NonNegativeNumber
    cost: NonNegativeNumber


class MedicationAggregates(BaseModel):
    criticalAlerts: NonNegativeInt
    avgStockGapPct: NonNegativeNumber
    projectedMonthlySpend: NonNegativeNumber


class MedicationsResponse(BaseModel):
    lowStock: List[MedicationLowStockRow] = Field(default_factory=list)
    pricingSummary: List[MedicationPricingSummaryRow] = Field(default_factory=list)
    priceSeries: List[MedicationPriceSeriesRow] = Field(default_factory=list)
    replenishmentTrend: List[MedicationReplenishmentPoint] = Field(default_factory=list)
    aggregates: MedicationAggregates
    lastSyncedAt: Optional[str] = None


class MedicationErrorResponse(BaseModel):
    message: str


class MedicationsQueryParams(BaseModel):
    """FastAPI dependency for optional query params."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    page_key: Optional[str] = Field(default=None, alias="pageKey")
    hospital: Optional[str] = None
    therapeutic_class: Optional[str] = Field(default=None, alias="class")
    only_low_stock: bool = Field(default=False, alias="onlyLowStock")


class StockEntryIn(BaseModel):
    """Request body for ``POST /api/medications/stock``."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    medication_id: MedicationId = Field(alias="medicationId")
    medication_name: Optional[NonEmptyStr] = Field(
        default=None, alias="medicationName", max_length=100
    )
    hospital: NonEmptyStr
    qtyReceived: PositiveNumber
    unitPrice: NonNegativeNumber


class StockEntryRecord(BaseModel):
    medicationId: MedicationId
    medicationName: Optional[NonEmptyStr] = None
    hospital: NonEmptyStr
    qtyReceived: PositiveNumber
    unitPrice: NonNegativeNumber


class StockEntryResponse(BaseModel):
    stockEntry: StockEntryRecord
    message: str = Field(default="Stock entry recorded")


async def get_low_stock(
    conn: aiomysql.Connection, query: Optional[MedicationsQueryParams] = None
) -> MedicationsResponse:
    """Aggregate the medications dashboard payload."""

    params = query or MedicationsQueryParams()
    latest_rows = await _fetch_latest_stock_snapshot(conn, params)
    low_stock_rows = _build_low_stock_rows(
        latest_rows, critical_only=params.only_low_stock
    )
    pricing_summary = await _fetch_pricing_summary(conn, params)
    price_series = _compute_price_series(latest_rows)
    replenishment_trend = await _fetch_replenishment_trend(conn, params, months=6)
    aggregates = _compute_aggregates(latest_rows)
    return MedicationsResponse(
        lowStock=low_stock_rows,
        pricingSummary=pricing_summary,
        priceSeries=price_series,
        replenishmentTrend=replenishment_trend,
        aggregates=aggregates,
        lastSyncedAt=datetime.utcnow().isoformat() + "Z",
    )


async def create_medication(
    conn: aiomysql.Connection, payload: MedicationIn
) -> MedicationRecord:
    """Insert a new medication and its initial stock snapshot."""

    await _assert_medication_absent(conn, payload.id)
    hid = await _get_hospital_id(conn, payload.hospital)
    if hid is None:
        raise MedicationsAPIError(404, "Hospital not found")

    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Medication (MID, Name, Form, Strength, ActiveIngredient, TherapeuticClass, Manufacturer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                payload.id,
                payload.name,
                payload.unit,
                "",
                "",
                payload.therapeutic_class,
                "",
            ),
        )
        await cur.execute(
            """
            INSERT INTO Stock (HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
            VALUES (%s, %s, NOW(), %s, %s, %s)
            """,
            (
                hid,
                payload.id,
                0,
                payload.qty,
                payload.reorder_level,
            ),
        )

    return MedicationRecord(**payload.model_dump())


async def insert_stock_entry(
    conn: aiomysql.Connection, payload: StockEntryIn
) -> StockEntryRecord:
    """Append a stock transaction and update the running totals."""

    medication = await _get_medication(conn, payload.medication_id)
    if medication is None:
        raise MedicationsAPIError(404, "Medication not found")

    hid = await _get_hospital_id(conn, payload.hospital)
    if hid is None:
        raise MedicationsAPIError(404, "Hospital not found")

    latest = await _fetch_latest_stock_row(conn, hid, payload.medication_id)
    if latest is None:
        raise MedicationsAPIError(404, "No stock history for this medication")

    new_qty = _to_float(latest.get("Qty")) + float(payload.qtyReceived)
    reorder_level = _to_float(latest.get("ReorderLevel"))

    async with conn.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO Stock (HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
            VALUES (%s, %s, NOW(), %s, %s, %s)
            """,
            (
                hid,
                payload.medication_id,
                payload.unitPrice,
                new_qty,
                reorder_level,
            ),
        )

    return StockEntryRecord(
        medicationId=payload.medication_id,
        medicationName=payload.medication_name or medication["Name"],
        hospital=payload.hospital,
        qtyReceived=payload.qtyReceived,
        unitPrice=payload.unitPrice,
    )


def _build_low_stock_rows(
    rows: Sequence[Dict[str, Any]], *, critical_only: bool
) -> List[MedicationLowStockRow]:
    result: List[MedicationLowStockRow] = []
    for row in rows:
        qty = _to_float(row.get("Qty"))
        reorder = _to_float(row.get("ReorderLevel"))
        if reorder <= 0:
            continue
        threshold = reorder / 2 if critical_only else reorder
        if qty <= threshold:
            payload = {
                "id": str(row.get("MID")),
                "name": row.get("medication_name", ""),
                "hospital": row.get("hospital_name", ""),
                "qty": qty,
                "reorderLevel": reorder,
                "unit": row.get("unit") or "units",
                "class": row.get("therapeutic_class"),
            }
            result.append(MedicationLowStockRow.model_validate(payload))
    return result


def _compute_price_series(
    rows: Sequence[Dict[str, Any]],
) -> List[MedicationPriceSeriesRow]:
    buckets: Dict[str, List[float]] = {}
    for row in rows:
        hospital = row.get("hospital_name")
        if not hospital:
            continue
        price = _to_float(row.get("UnitPrice"))
        buckets.setdefault(hospital, []).append(price)

    series: List[MedicationPriceSeriesRow] = []
    for hospital, values in buckets.items():
        avg_price = sum(values) / len(values) if values else 0.0
        series.append(
            MedicationPriceSeriesRow(hospital=hospital, avgUnitPrice=avg_price)
        )
    series.sort(key=lambda item: item.hospital.lower())
    return series


def _compute_aggregates(rows: Sequence[Dict[str, Any]]) -> MedicationAggregates:
    critical_alerts = 0
    gap_samples: List[float] = []
    projected_spend = 0.0

    for row in rows:
        qty = _to_float(row.get("Qty"))
        reorder = _to_float(row.get("ReorderLevel"))
        unit_price = _to_float(row.get("UnitPrice"))
        if reorder > 0:
            if qty <= reorder / 2:
                critical_alerts += 1
            deficit = max(reorder - qty, 0.0)
            gap_samples.append(deficit / reorder)
            projected_spend += deficit * unit_price
        else:
            projected_spend += 0.0

    avg_gap_pct = (sum(gap_samples) / len(gap_samples) * 100.0) if gap_samples else 0.0
    return MedicationAggregates(
        criticalAlerts=critical_alerts,
        avgStockGapPct=avg_gap_pct,
        projectedMonthlySpend=projected_spend,
    )


async def _fetch_latest_stock_snapshot(
    conn: aiomysql.Connection, params: MedicationsQueryParams
) -> List[Dict[str, Any]]:
    conditions, args = _build_common_conditions(params)
    sql = """
        WITH RankedStock AS (
            SELECT
                s.HID,
                s.MID,
                s.UnitPrice,
                s.Qty,
                s.ReorderLevel,
                s.StockTimestamp,
                ROW_NUMBER() OVER (PARTITION BY s.HID, s.MID ORDER BY s.StockTimestamp DESC) AS rn
            FROM Stock s
        )
        SELECT
            rs.HID,
            rs.MID,
            rs.UnitPrice,
            rs.Qty,
            rs.ReorderLevel,
            rs.StockTimestamp,
            h.Name AS hospital_name,
            m.Name AS medication_name,
            m.TherapeuticClass AS therapeutic_class,
            NULLIF(m.Form, '') AS unit
        FROM RankedStock rs
        JOIN Hospital h ON h.HID = rs.HID
        JOIN Medication m ON m.MID = rs.MID
        WHERE rs.rn = 1
    """
    if conditions:
        sql += " AND " + " AND ".join(conditions)
    sql += " ORDER BY h.Name, m.Name"
    return await _fetchall(conn, sql, tuple(args))


async def _fetch_pricing_summary(
    conn: aiomysql.Connection, params: MedicationsQueryParams
) -> List[MedicationPricingSummaryRow]:
    conditions, args = _build_common_conditions(params)
    sql = """
        SELECT
            h.Name AS hospital,
            m.Name AS medication,
            AVG(s.UnitPrice) AS avg_price,
            MIN(s.UnitPrice) AS min_price,
            MAX(s.UnitPrice) AS max_price,
            MAX(s.StockTimestamp) AS updated_at
        FROM Stock s
        JOIN Hospital h ON h.HID = s.HID
        JOIN Medication m ON m.MID = s.MID
        WHERE 1=1
    """
    if conditions:
        sql += " AND " + " AND ".join(conditions)
    sql += " GROUP BY h.Name, m.Name ORDER BY updated_at DESC"
    rows = await _fetchall(conn, sql, tuple(args))
    result: List[MedicationPricingSummaryRow] = []
    for row in rows:
        result.append(
            MedicationPricingSummaryRow(
                hospital=row["hospital"],
                medication=row["medication"],
                avg=_to_float(row.get("avg_price")),
                min=_to_float(row.get("min_price")),
                max=_to_float(row.get("max_price")),
                updatedAt=row.get("updated_at") or datetime.utcnow(),
            )
        )
    return result


async def _fetch_replenishment_trend(
    conn: aiomysql.Connection,
    params: MedicationsQueryParams,
    *,
    months: int,
) -> List[MedicationReplenishmentPoint]:
    lookback = max(months, 1)
    conditions, extra_args = _build_common_conditions(params)
    args: List[Any] = [lookback, *extra_args]
    sql = """
        SELECT
            DATE_FORMAT(s.StockTimestamp, '%%b %%Y') AS label,
            DATE_FORMAT(s.StockTimestamp, '%%Y-%%m') AS sort_key,
            SUM(s.Qty) AS total_qty,
            SUM(s.Qty * s.UnitPrice) AS total_cost
        FROM Stock s
        JOIN Hospital h ON h.HID = s.HID
        JOIN Medication m ON m.MID = s.MID
        WHERE s.StockTimestamp >= DATE_SUB(CURRENT_DATE, INTERVAL %s MONTH)
    """
    if conditions:
        sql += " AND " + " AND ".join(conditions)
    sql += " GROUP BY sort_key, label ORDER BY sort_key ASC"
    rows = await _fetchall(conn, sql, tuple(args))
    trend: List[MedicationReplenishmentPoint] = []
    for row in rows:
        trend.append(
            MedicationReplenishmentPoint(
                month=row["label"],
                qty=_to_float(row.get("total_qty")),
                cost=_to_float(row.get("total_cost")),
            )
        )
    return trend


async def _fetch_latest_stock_row(
    conn: aiomysql.Connection, hid: int, mid: MedicationId
) -> Optional[Dict[str, Any]]:
    return await _fetchone(
        conn,
        """
        SELECT Qty, ReorderLevel
        FROM Stock
        WHERE HID = %s AND MID = %s
        ORDER BY StockTimestamp DESC
        LIMIT 1
        """,
        (hid, mid),
    )


async def _fetchall(
    conn: aiomysql.Connection,
    sql: str,
    params: Sequence[Any] = (),
) -> List[Dict[str, Any]]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql, params)
        return await cur.fetchall()


async def _fetchone(
    conn: aiomysql.Connection,
    sql: str,
    params: Sequence[Any] = (),
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(sql, params)
        return await cur.fetchone()


async def _assert_medication_absent(conn: aiomysql.Connection, mid: str) -> None:
    row = await _fetchone(
        conn,
        "SELECT MID FROM Medication WHERE MID = %s",
        (mid,),
    )
    if row is not None:
        raise MedicationsAPIError(409, "Medication with this id already exists")


async def _get_medication(
    conn: aiomysql.Connection, mid: str
) -> Optional[Dict[str, Any]]:
    return await _fetchone(
        conn,
        "SELECT MID, Name, TherapeuticClass, Form FROM Medication WHERE MID = %s",
        (mid,),
    )


async def _get_hospital_id(conn: aiomysql.Connection, name: str) -> Optional[int]:
    row = await _fetchone(
        conn,
        "SELECT HID FROM Hospital WHERE LOWER(Name) = LOWER(%s)",
        (name,),
    )
    return row["HID"] if row else None


def _build_common_conditions(
    params: MedicationsQueryParams,
) -> Tuple[List[str], List[Any]]:
    conditions: List[str] = []
    args: List[Any] = []
    if params.hospital:
        conditions.append("LOWER(h.Name) = LOWER(%s)")
        args.append(params.hospital.strip())
    if params.therapeutic_class:
        conditions.append("LOWER(m.TherapeuticClass) = LOWER(%s)")
        args.append(params.therapeutic_class.strip())
    return conditions, args


def _to_float(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


__all__ = [
    "MedicationAggregates",
    "MedicationCreateResponse",
    "MedicationErrorResponse",
    "MedicationIn",
    "MedicationLowStockRow",
    "MedicationPriceSeriesRow",
    "MedicationPricingSummaryRow",
    "MedicationRecord",
    "MedicationReplenishmentPoint",
    "MedicationsAPIError",
    "MedicationsQueryParams",
    "MedicationsResponse",
    "StockEntryIn",
    "StockEntryRecord",
    "StockEntryResponse",
    "create_medication",
    "get_low_stock",
    "insert_stock_entry",
]
