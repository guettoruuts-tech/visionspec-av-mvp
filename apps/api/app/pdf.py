from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from .engine import get_base


def generate_pdf(study: dict) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    wl = study['white_label']
    pdf.setFont('Helvetica-Bold', 20)
    pdf.drawString(40, height - 60, f"{wl['company_name']} · Relatório Técnico")

    y = height - 110
    pdf.setFont('Helvetica', 12)
    rows = [
        f"Projeto: {study['project_name']}",
        f"Cliente: {study['client_name']}",
        f"Ambiente: {study['room_name']}",
        f"Distância de visualização: {study['viewing_distance_m']} m",
    ]
    for row in rows:
        pdf.drawString(40, y, row)
        y -= 20

    y -= 10
    pdf.setFont('Helvetica-Bold', 13)
    pdf.drawString(40, y, 'Recomendação por regime de acuidade')
    y -= 24

    pdf.setFont('Helvetica', 11)
    # Map regime codes to user-friendly descriptions
    regime_map = {
        '4H': '4H — Visualização em detalhes',
        '6H': '6H — Conteúdo de apresentação',
        '8H': '8H — Conteúdo de vídeos',
    }
    for rec in study['recommendations']:
        regime_label = regime_map.get(rec.get('regime', ''), rec.get('regime', ''))
        status = 'Dentro da especificação' if rec.get('within_spec') else 'Acima da especificação'
        size_in = rec.get('recommended_size_inches')
        diag_in = rec.get('recommended_diagonal_inches')
        diag_m = rec.get('recommended_diagonal_m')
        line = (
            f"{regime_label}: {size_in}\" (diag. {round(diag_in,1) if diag_in else ''} in / {diag_m if diag_m else ''} m) · "
            f"Distância máxima {rec.get('max_distance_m')} m · {status}"
        )
        pdf.drawString(40, y, line)
        y -= 18

    # Draw technical base table (size | diag m | 4H | 6H | 8H)
    y -= 10
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(40, y, 'Tabela técnica (polegadas | diag (m) | 4H (m) | 6H (m) | 8H (m))')
    y -= 18
    pdf.setFont('Helvetica-Bold', 10)
    pdf.drawString(40, y, 'in')
    pdf.drawString(90, y, 'diag m')
    pdf.drawString(170, y, '4H (m)')
    pdf.drawString(240, y, '6H (m)')
    pdf.drawString(310, y, '8H (m)')
    y -= 14

    base = []
    try:
        base = get_base()
    except Exception:
        base = []

    pdf.setFont('Helvetica', 9)
    for item in base:
        if y < 60:
            pdf.showPage()
            y = height - 60
            pdf.setFont('Helvetica', 9)
        diag_m = round(item.get('diagonal_inches', 0) * 0.0254, 3)
        pdf.drawString(40, y, str(item.get('size_inches')))
        pdf.drawString(90, y, f"{diag_m}")
        pdf.drawString(170, y, str(item.get('distance_4h_m')))
        pdf.drawString(240, y, str(item.get('distance_6h_m')))
        pdf.drawString(310, y, str(item.get('distance_8h_m')))
        y -= 14

    pdf.setFont('Helvetica-Oblique', 9)
    pdf.drawString(40, 40, 'VisionSpec AV MVP · Documento técnico white-label')
    pdf.save()

    buffer.seek(0)
    return buffer.read()

