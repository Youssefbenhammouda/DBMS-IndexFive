import asyncio
import os
import aiomysql
from dotenv import load_dotenv

load_dotenv()

cfg = dict(
    host=os.getenv("MYSQL_HOST"),
    port=int(os.getenv("MYSQL_PORT", 3306)),
    database=os.getenv("MYSQL_DB"),
    user=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
)


async def create_pool() -> aiomysql.Pool:
    return await aiomysql.create_pool(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        db=cfg["database"],
        minsize=1,
        maxsize=5,
        autocommit=False,  # we will control transactions manually
    )





