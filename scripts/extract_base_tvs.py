import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX_PATH = ROOT / 'Estudo de Visualização.xlsx'
OUT_PATH = ROOT / 'data' / 'base_tvs.json'

ns = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

with zipfile.ZipFile(XLSX_PATH) as z:
    sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
    strings = [''.join(t.text or '' for t in si.findall('.//a:t', ns)) for si in sst.findall('a:si', ns)]

    def cell_value(cell):
        value_node = cell.find('a:v', ns)
        if value_node is None:
            return None
        if cell.attrib.get('t') == 's':
            return strings[int(value_node.text)]
        return value_node.text

    # BASE TVs is linked to sheet3.xml in this workbook
    sheet = ET.fromstring(z.read('xl/worksheets/sheet3.xml'))
    rows = sheet.findall('.//a:sheetData/a:row', ns)

records = []
for row in rows:
    data = {}
    for c in row.findall('a:c', ns):
        ref = c.attrib['r']
        col = re.sub(r'\d', '', ref)
        data[col] = cell_value(c)

    if not data.get('A') or not str(data['A']).isdigit():
        continue

    records.append(
        {
            'size_inches': int(data['A']),
            'diagonal_inches': round(float(data['B']), 6),
            'distance_4h_m': round(float(data['C']), 6),
            'distance_6h_m': round(float(data['D']), 6),
            'distance_8h_m': round(float(data['E']), 6),
        }
    )

OUT_PATH.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Exported {len(records)} records to {OUT_PATH}')
