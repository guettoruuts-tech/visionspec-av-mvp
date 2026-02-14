import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

Regime = Literal['4H', '6H', '8H']


def _resolve_base_file() -> Path:
    env = os.getenv('BASE_TVS_FILE')
    if env:
        return Path(env)

    current = Path(__file__).resolve()
    candidates = [
        current.parents[3] / 'data' / 'base_tvs.json',  # local repo
        current.parents[1] / 'data' / 'base_tvs.json',  # container /app/data
        Path('/app/data/base_tvs.json'),
    ]
    for file in candidates:
        if file.exists():
            return file
    raise FileNotFoundError('base_tvs.json não encontrado.')


BASE_FILE = _resolve_base_file()


@lru_cache(maxsize=1)
def get_base() -> list[dict]:
    data = json.loads(BASE_FILE.read_text(encoding='utf-8'))
    return sorted(data, key=lambda item: item['size_inches'])


def _distance(item: dict, regime: Regime) -> float:
    key_map = {'4H': 'distance_4h_m', '6H': 'distance_6h_m', '8H': 'distance_8h_m'}
    return item[key_map[regime]]


def recommend(viewing_distance_m: float, regime: Regime, eye_height_m: float = 1.7, ceiling_height_m: float = 2.8) -> dict:
    base = get_base()
    match = next((item for item in base if _distance(item, regime) >= viewing_distance_m), base[-1])
    max_distance = _distance(match, regime)
    
    # Calcular altura da tela (16:9 aspect ratio)
    # Para 16:9: altura = diagonal * 9 / sqrt(16² + 9²) ≈ diagonal * 0.49
    diagonal_inches = match.get('diagonal_inches', 0)
    screen_height_m = round(diagonal_inches * 0.0254 * 0.49, 3)
    
    # Verificar se a tela cabe no espaço vertical
    # Margem de segurança: topo da tela deve ficar 30cm abaixo do teto
    # Fundo deve ficar 10cm acima do nível des olhos (aproximado)
    vertical_space = ceiling_height_m - eye_height_m - 0.3  # espaço útil acima dos olhos até margem do teto
    fits_ceiling = screen_height_m <= vertical_space
    
    return {
        'regime': regime,
        'recommended_size_inches': match['size_inches'],
        'recommended_diagonal_inches': match.get('diagonal_inches'),
        'recommended_diagonal_m': round(match.get('diagonal_inches', 0) * 0.0254, 3),
        'screen_height_m': screen_height_m,
        'max_distance_m': round(max_distance, 3),
        'within_spec': viewing_distance_m <= max_distance,
        'fits_ceiling': fits_ceiling,
    }


def compute_recommendations(viewing_distance_m: float, eye_height_m: float = 1.7, ceiling_height_m: float = 2.8) -> list[dict]:
    return [recommend(viewing_distance_m, regime, eye_height_m, ceiling_height_m) for regime in ('4H', '6H', '8H')]
