from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .engine import compute_recommendations, get_base
from .models import Study
from .pdf import generate_pdf
from .schemas import StudyCreateRequest, StudyResponse

Base.metadata.create_all(bind=engine)
app = FastAPI(title='VisionSpec AV API', version='0.1.0')


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.post('/studies', response_model=StudyResponse)
def create_study(payload: StudyCreateRequest, db: Session = Depends(get_db)):
    recommendations = compute_recommendations(payload.viewing_distance_m)
    study = Study(
        project_name=payload.project_name,
        client_name=payload.client_name,
        room_name=payload.room_name,
        viewing_distance_m=payload.viewing_distance_m,
        white_label=payload.white_label.model_dump(),
        recommendations=recommendations,
    )
    db.add(study)
    db.commit()
    db.refresh(study)
    return study


@app.get('/specs')
def specs():
    """Retorna a tabela base de TVs (tamanhos e distâncias por regime)."""
    return get_base()


@app.get('/recommendations')
def recommendations(distance_m: float):
    """Retorna recomendações 4H/6H/8H para a distância informada e a tabela de tamanhos."""
    recs = compute_recommendations(distance_m)
    return {'distance_m': distance_m, 'recommendations': recs, 'base': get_base()}


@app.get('/studies/{study_id}/pdf')
def study_pdf(study_id: int, db: Session = Depends(get_db)):
    study = db.get(Study, study_id)
    if not study:
        raise HTTPException(status_code=404, detail='Study not found')

    pdf_data = generate_pdf(
        {
            'project_name': study.project_name,
            'client_name': study.client_name,
            'room_name': study.room_name,
            'viewing_distance_m': study.viewing_distance_m,
            'white_label': study.white_label,
            'recommendations': study.recommendations,
        }
    )
    return Response(
        content=pdf_data,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename=study-{study_id}.pdf'},
    )
