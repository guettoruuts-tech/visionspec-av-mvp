from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def draw_elevation_view(pdf: canvas.Canvas, recommendations: list[dict], study: dict, start_y: float, width: float = 500):
    """Desenha a elevação frontal com as 3 opções de TV lado a lado"""
    
    # Escala: 1 metro = 40 pixels em PDF
    SCALE = 40
    elevation_height = 200
    
    # Dimensões em pixels
    ceiling_height_px = study['ceiling_height_m'] * SCALE
    eye_height_px = study['eye_height_m'] * SCALE
    
    # Piso
    floor_y = start_y - elevation_height + 20
    
    # Desenhar referências
    pdf.setStrokeColorRGB(0.8, 0.1, 0.1)  # Vermelho para altura dos olhos
    pdf.setLineWidth(1)
    eye_ref_y = floor_y + eye_height_px
    pdf.line(40, eye_ref_y, width, eye_ref_y)
    
    pdf.setFont('Helvetica', 8)
    pdf.setFillColorRGB(0.8, 0.1, 0.1)
    pdf.drawString(42, eye_ref_y + 3, f'Altura dos olhos ({study["eye_height_m"]}m)')
    
    # Desenhar piso
    pdf.setStrokeColorRGB(0, 0, 0)
    pdf.setLineWidth(1.5)
    pdf.line(40, floor_y, width, floor_y)
    
    # Desenhar teto
    ceiling_y = floor_y + ceiling_height_px
    pdf.line(40, ceiling_y, width, ceiling_y)
    pdf.setFillColorRGB(0, 0, 0)
    pdf.setFont('Helvetica', 8)
    pdf.drawString(42, ceiling_y + 3, f'Teto ({study["ceiling_height_m"]}m)')
    
    # Desenhar as 3 TVs
    tv_width_available = (width - 80) / 3
    
    for idx, rec in enumerate(recommendations):
        screen_height_px = rec.get('screen_height_m', 0) * SCALE
        aspect_ratio = 16 / 9
        screen_width_px = min(screen_height_px * aspect_ratio, tv_width_available - 10)
        
        # Posição da TV
        tv_left = 40 + idx * tv_width_available + (tv_width_available - screen_width_px) / 2
        tv_center_y = eye_height_px + SCALE * 0.3
        tv_top = floor_y + tv_center_y - screen_height_px / 2
        
        # Desenhar retângulo da TV (corpo)
        pdf.setFillColorRGB(0.1, 0.1, 0.1)  # Preto
        pdf.rect(tv_left, tv_top, screen_width_px, screen_height_px, fill=1, stroke=1)
        
        # Bordeação colorida por regime
        color_values = [(0.2, 0.5, 0.9), (0.5, 0.3, 0.9), (0.9, 0.2, 0.5)]  # Azul, Roxo, Rosa
        r, g, b = color_values[idx]
        pdf.setStrokeColorRGB(r, g, b)
        pdf.setLineWidth(2)
        pdf.rect(tv_left, tv_top, screen_width_px, screen_height_px, fill=0, stroke=1)
        
        # Texto da TV
        pdf.setFont('Helvetica-Bold', 10)
        pdf.setFillColorRGB(r, g, b)
        regime = rec.get('regime', '')
        size = rec.get('recommended_size_inches', '')
        pdf.drawCentredString(tv_left + screen_width_px / 2, tv_top + screen_height_px / 2 - 3, f'{size}"')
        
        # Regime abaixo
        pdf.setFont('Helvetica-Bold', 9)
        pdf.drawCentredString(tv_left + screen_width_px / 2, floor_y - 12, regime)


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

    # Elevação frontal
    y -= 20
    pdf.setFont('Helvetica-Bold', 13)
    pdf.drawString(40, y, 'Elevação Frontal - Comparação 4H, 6H, 8H')
    y -= 15
    
    draw_elevation_view(pdf, study['recommendations'], study, y, width - 80)

    pdf.setFont('Helvetica-Oblique', 9)
    pdf.drawString(40, 40, 'VisionSpec AV MVP · Documento técnico white-label')
    pdf.save()

    buffer.seek(0)
    return buffer.read()

