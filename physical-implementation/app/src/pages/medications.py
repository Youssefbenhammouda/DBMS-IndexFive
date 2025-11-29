from datetime import date, time, timedelta
import aiomysql
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class MedicationIn(BaseModel):
    id: str
    name: str
    hospital: str
    qty: int
    reorderLevel: int
    unit: str
    class_: Optional[str] = Field(default=None, alias="class")


class StockEntryIn(BaseModel):
    medicationId: str
    medicationName: Optional[str] = None
    hospital: str
    qtyReceived: int
    unitPrice: float



async def create_medication(conn: aiomysql.Connection, med: MedicationIn) -> dict:
    query = """
        INSERT INTO medications (id, name, hospital, qty, reorder_level, unit, class)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    async with conn.cursor() as cur:
        await cur.execute(
            query,
            (
                med.id,
                med.name,
                med.hospital,
                med.qty,
                med.reorderLevel,
                med.unit,
                med.class_,
            ),
        )
    await conn.commit()
    return med.model_dump(by_alias=True)


async def insert_stock_entry(conn: aiomysql.Connection, s: StockEntryIn) -> dict:
    query = """
        INSERT INTO medication_stock (
            medication_id, medication_name, hospital, qty_received, unit_price, received_at
        ) VALUES (%s, %s, %s, %s, %s, NOW())
    """
    async with conn.cursor() as cur:
        await cur.execute(
            query,
            (
                s.medicationId,
                s.medicationName,
                s.hospital,
                s.qtyReceived,
                s.unitPrice,
            ),
        )
    await conn.commit()
    return s.model_dump()


async def get_low_stock(
    conn: aiomysql.Connection,
    hospital: Optional[str] = None,
    class_: Optional[str] = None,
    only_low_stock: bool = False,
) -> list[dict]:
    query = """
        SELECT id, name, hospital, qty, reorder_level, unit, class
        FROM medications
        WHERE 1=1
    """
    params: list = []

    if hospital:
        query += " AND hospital = %s"
        params.append(hospital)
    if class_:
        query += " AND class = %s"
        params.append(class_)
    if only_low_stock:
        query += " AND qty <= reorder_level"

    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(query, params)
        rows = await cur.fetchall()

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "hospital": r["hospital"],
            "qty": r["qty"],
            "reorderLevel": r["reorder_level"],
            "unit": r["unit"],
            "class": r.get("class"),
        }
        for r in rows
    ]