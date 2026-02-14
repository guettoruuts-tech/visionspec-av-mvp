from sqlalchemy import Column, DateTime, Float, Integer, JSON, String, func
from .database import Base


class Study(Base):
    __tablename__ = 'studies'

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(200), nullable=False)
    client_name = Column(String(200), nullable=False)
    room_name = Column(String(200), nullable=False)
    viewing_distance_m = Column(Float, nullable=False)
    white_label = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
