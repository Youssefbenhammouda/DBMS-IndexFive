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
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT HID FROM Hospital WHERE Name = %s", (med.hospital,))
        row = await cur.fetchone()
        if row is None:
            raise ValueError(f"Unknown hospital: {med.hospital}")
        hid = row["HID"]

    mid = int(med.id)

    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """
                INSERT INTO Medication (MID, Name, TherapeuticClass)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    Name = VALUES(Name),
                    TherapeuticClass = VALUES(TherapeuticClass)
                """,
                (mid, med.name, med.class_),
            )

            await cur.execute(
                """
                INSERT INTO Stock (
                    HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel
                )
                VALUES (%s, %s, NOW(), NULL, %s, %s)
                """,
                (hid, mid, med.qty, med.reorderLevel),
            )

            await conn.commit()
        except Exception:
            await conn.rollback()
            raise

    return med.model_dump(by_alias=True)

async def insert_stock_entry(conn: aiomysql.Connection, s: StockEntryIn) -> dict:
    """
    Utilise la table Stock du prof : (HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel)
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute("SELECT HID FROM Hospital WHERE Name = %s", (s.hospital,))
        row = await cur.fetchone()
        if row is None:
            raise ValueError(f"Unknown hospital: {s.hospital}")
        hid = row["HID"]

    mid = int(s.medicationId)

    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """
                SELECT ReorderLevel
                FROM Stock
                WHERE HID = %s AND MID = %s
                ORDER BY StockTimestamp DESC
                LIMIT 1
                """,
                (hid, mid),
            )
            row = await cur.fetchone()
            reorder_level = row[0] if row is not None else 10

            await cur.execute(
                """
                INSERT INTO Stock (
                    HID, MID, StockTimestamp, UnitPrice, Qty, ReorderLevel
                )
                VALUES (%s, %s, NOW(), %s, %s, %s)
                """,
                (hid, mid, s.unitPrice, s.qtyReceived, reorder_level),
            )

            await conn.commit()
        except Exception:
            await conn.rollback()
            raise
    return {
        "medicationId": s.medicationId,
        "medicationName": s.medicationName,
        "hospital": s.hospital,
        "qtyReceived": s.qtyReceived,
        "unitPrice": s.unitPrice,
    }