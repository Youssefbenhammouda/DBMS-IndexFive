from datetime import date, time, timedelta
import aiomysql
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class MedicationIn(BaseModel):
    mid:int
    name:str
    form:Optional[str]=None
    strength:Optional[str]=None
    active_ingredient:Optional[str]=Field(default=None,alias="activeIngredient")
    therapeutic_class:Optional[str]=Field(default=None,alias="therapeuticClass")
    manufacturer:Optional[str]=None

class MedicationOut(MedicationIn):
    pass

async def list_medications(conn,limit=50):
    """
    GET
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
            """
            SELECT MID,Name,Form,Strength,ActiveIngredient,
            TherapeuticClass,Manufacturer
            FROM Medication
            ORDER BY Name
            LIMIT %s
            """,
            (limit,)
        )
        return await cur.fetchall()
    
async def create_medication(
        conn,
        mid,
        name,
        form,
        strength,
        active_ingredient,
        therapeutic_class,
        manufacturer
):
    """
    POST
    """
    async with conn.cursor() as cur:
        try:
            await cur.execute(
                """
                INSERT INTO Medication(
                    MID,Name,Form,Strength,ActiveIngredient,
                    TherapeuticClass,Manufacturer
                )
                VALUES(%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    mid,
                    name,
                    form,
                    strength,
                    active_ingredient,
                    therapeutic_class,
                    manufacturer
                )
            )
            await conn.commit()
        except Exception:
            await conn.rollback()
            raise