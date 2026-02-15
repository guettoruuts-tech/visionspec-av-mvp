#!/usr/bin/env python3
import json
import urllib.request

# Distances (m) sample to generate examples for
DISTANCES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 8.0, 10.0]
OUT = 'apps/web/public/recommendation_examples.json'
BASE_URL = 'http://localhost:8000'

results = []
for d in DISTANCES:
    url = f'{BASE_URL}/recommendations?distance_m={d}'
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        print('Failed', d, e)
        continue
    results.append({'distance_m': d, 'recommendations': data['recommendations']})

open(OUT, 'w').write(json.dumps(results, indent=2, ensure_ascii=False))
print('Wrote', OUT)
