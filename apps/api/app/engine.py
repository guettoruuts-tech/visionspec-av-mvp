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


def recommend(viewing_distance_m: float, regime: Regime) -> dict:
    base = get_base()
    match = next((item for item in base if _distance(item, regime) >= viewing_distance_m), base[-1])
    max_distance = _distance(match, regime)
    return {
        'regime': regime,
        'recommended_size_inches': match['size_inches'],
        'max_distance_m': round(max_distance, 3),
        'within_spec': viewing_distance_m <= max_distance,
    }


def compute_recommendations(viewing_distance_m: float) -> list[dict]:
    return [recommend(viewing_distance_m, regime) for regime in ('4H', '6H', '8H')]
