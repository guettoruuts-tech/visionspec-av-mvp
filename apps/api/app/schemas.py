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
    eye_height_m: float = Field(gt=0, description="Altura dos olhos do observador (m)")
    ceiling_height_m: float = Field(default=2.8, description="Altura do teto (pé direito em m)")
    white_label: WhiteLabelConfig


class StudyRecommendation(BaseModel):
    regime: str
    recommended_size_inches: int
    recommended_diagonal_inches: float
    screen_height_inches: float = Field(description="Altura da tela em polegadas")
    screen_width_inches: float = Field(description="Largura da tela em polegadas")
    screen_height_m: float = Field(description="Altura da tela em metros")
    screen_width_m: float = Field(description="Largura da tela em metros")
    max_distance_m: float
    within_spec: bool
    fits_ceiling: bool = Field(description="Se a tela cabe no espaço vertical disponível")


class StudyResponse(BaseModel):
    id: int
    project_name: str
    client_name: str
    room_name: str
    viewing_distance_m: float
    eye_height_m: float
    ceiling_height_m: float
    recommendations: list[StudyRecommendation]
    created_at: datetime

    class Config:
        from_attributes = True
