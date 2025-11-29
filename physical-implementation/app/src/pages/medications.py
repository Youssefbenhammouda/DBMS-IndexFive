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
    model_config=ConfigDict(populate_by_name=True)

async def list_medications(conn,limit=50):
    """
    GET
    """
    async with conn.cursor(aiomysql.DictCursor) as cur:
        await cur.execute(
        """
        SELECT 
            MID     AS mid,
            Name    AS name,
            Form    AS form,
            Strength    AS strength,
            ActiveIngredient    AS active_ingredient,
            TherapeuticClass    AS therapeutic_class,
            Manufacturer    AS manufacturer
        FROM Medication
        ORDER BY Name
        LIMIT %s
        """,
            (limit,),
    )
    rows= await cur.fetchall()
    return rows
    
async def create_medication(
        conn:aiomysql.Connection,
        mid:int,
        name:str,
        form:Optional[str],
        strength:Optional[str],
        active_ingredient:Optional[str],
        therapeutic_class:Optional[str],
        manufacturer:Optional[str],
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
                    manufacturer,
                ),
            )
            await conn.commit()
        except Exception:
            await conn.rollback()
            raise