from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


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
        f"Altura dos olhos: {study['eye_height_m']} m",
        f"Pé direito (altura do teto): {study['ceiling_height_m']} m",
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
        size_in = rec.get('recommended_size_inches')
        screen_height_m = rec.get('screen_height_m', 0)
        fits_ceiling = rec.get('fits_ceiling', False)
        ceiling_status = '✓ Cabe' if fits_ceiling else '✗ Não cabe'
        line = f"{regime_label}: {size_in}\" (altura: {screen_height_m}m) - {ceiling_status}"
        pdf.drawString(40, y, line)
        y -= 18

    pdf.setFont('Helvetica-Oblique', 9)
    pdf.drawString(40, 40, 'VisionSpec AV MVP · Documento técnico white-label')
    pdf.save()

    buffer.seek(0)
    return buffer.read()

