from datetime import datetime
from pydantic import BaseModel, Field


class WhiteLabelConfig(BaseModel):
    company_name: str = Field(min_length=2)
    primary_color: str = '#111827'
    accent_color: str = '#2563eb'
    logo_url: str | None = None


class StudyCreateRequest(BaseModel):
    project_name: str
    client_name: str
    room_name: str
    viewing_distance_m: float = Field(gt=0)
    white_label: WhiteLabelConfig


class StudyRecommendation(BaseModel):
    regime: str
    recommended_size_inches: int
    max_distance_m: float
    within_spec: bool


class StudyResponse(BaseModel):
    id: int
    project_name: str
    client_name: str
    room_name: str
    viewing_distance_m: float
    recommendations: list[StudyRecommendation]
    created_at: datetime

    class Config:
        from_attributes = True
