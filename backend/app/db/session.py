import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. A PostgreSQL connection string is required, e.g. "
        "postgresql://user:password@host:5432/dbname"
    )

if not DATABASE_URL.startswith("postgresql"):
    raise ValueError(
        "Unsupported DATABASE_URL. Only PostgreSQL is allowed. Received: "
        f"{DATABASE_URL}"
    )

# PostgreSQL engine
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
