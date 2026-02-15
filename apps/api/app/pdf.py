from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def draw_single_elevation(pdf: canvas.Canvas, rec: dict, study: dict, regime_name: str, color_rgb: tuple, page_width: float, area_y: float, area_height: float):
    """Desenha UMA elevação dentro de uma área vertical (em coordenadas de página).

    `area_y` é a coordenada do fundo da área (em pt) e `area_height` é a altura disponível.
    Isso permite empilhar múltiplas elevações na mesma página.
    """

    # Escala grande: 1 metro = 80 pixels (bastante espaço)
    SCALE = 80

    ceiling_height_m = study['ceiling_height_m']
    eye_height_m = study['eye_height_m']

    # Dimensões em pixels
    ceiling_height_px = ceiling_height_m * SCALE
    eye_height_px = eye_height_m * SCALE

    # Margens internas da área
    inner_top = 10
    inner_bottom = 10
    available_height = max(0, area_height - inner_top - inner_bottom)

    # Centralizar a elevação dentro da área vertical fornecida
    center_y = area_y + inner_bottom + available_height / 2
    floor_y = center_y - ceiling_height_px / 2
    ceiling_y = floor_y + ceiling_height_px
    eye_line_y = floor_y + eye_height_px
    
    # Margem horizontal
    margin_left = 50
    margin_right = 50
    usable_width = page_width - margin_left - margin_right
    col_center = margin_left + usable_width / 2
    
    # ===== DESENHAR ESTRUTURA =====
    # Paredes laterais - linhas finas
    pdf.setStrokeColorRGB(0.9, 0.9, 0.9)
    pdf.setLineWidth(0.5)
    pdf.line(margin_left - 10, floor_y, margin_left - 10, ceiling_y)
    pdf.line(page_width - margin_right + 10, floor_y, page_width - margin_right + 10, ceiling_y)
    
    # PISO - linha preta grossa
    pdf.setStrokeColorRGB(0, 0, 0)
    pdf.setLineWidth(3)
    pdf.line(margin_left - 10, floor_y, page_width - margin_right + 10, floor_y)
    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColorRGB(0, 0, 0)
    pdf.drawString(margin_left, floor_y - 18, 'PISO (0m)')
    
    # TETO - linha preta grossa
    pdf.setStrokeColorRGB(0, 0, 0)
    pdf.setLineWidth(3)
    pdf.line(margin_left - 10, ceiling_y, page_width - margin_right + 10, ceiling_y)
    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(margin_left, ceiling_y + 8, f'TETO ({ceiling_height_m}m)')
    
    # LINHA DOS OLHOS - vermelho forte, ACIMA de tudo (drawn last so it's on top)
    # Será desenhada depois da TV
    
    # ===== DESENHAR A TV =====
    tv_height_px = rec.get('screen_height_m', 0) * SCALE
    tv_width_px = rec.get('screen_width_m', 0) * SCALE
    
    # AVIXA: Topo da TV começa 10cm acima dos olhos
    tv_vertical_offset_px = 0.10 * SCALE
    tv_top = eye_line_y + tv_vertical_offset_px
    
    # Coordenadas da TV
    tv_left = col_center - tv_width_px / 2
    tv_center_y = tv_top + tv_height_px / 2
    tv_bottom = tv_top + tv_height_px
    
    # Checar se cabe no teto
    fits_ceiling = tv_bottom <= ceiling_y
    
    # Cortar TV se precisar (para não sair da página)
    max_tv_bottom = ceiling_y - 5
    if tv_bottom > max_tv_bottom:
        # Ajustar altura da TV
        tv_bottom = max_tv_bottom
        tv_height_px = tv_bottom - tv_top
    
    # ===== DESENHAR DIMENSÕES DE ALTURA (LADO DIREITO) =====
    # Altura do topo e fundo da TV em relação ao piso
    tv_top_height_m = (tv_top - floor_y) / SCALE
    tv_bottom_height_m = (tv_bottom - floor_y) / SCALE
    tv_center_height_m = (tv_center_y - floor_y) / SCALE

    # Valores absolutos para rótulos (evita inversões): topo = maior, base = menor
    floor_to_top_m = max(tv_top_height_m, tv_bottom_height_m)
    floor_to_base_m = min(tv_top_height_m, tv_bottom_height_m)

    # Linha de dimensão vertical (lado DIREITO da TV) — afastada da TV
    tv_right = tv_left + tv_width_px
    dim_offset = 28
    tick_len = 10
    mid_offset = int(tick_len / 2)
    dim_line_x = tv_right + dim_offset

    pdf.setStrokeColorRGB(0.5, 0.5, 0.5)
    pdf.setLineWidth(1)

    # Mover a linha de marcação para a lateral da página (mais limpa)
    dim_line_x = page_width - margin_right - 10

    # Traços horizontais do topo e da base ligando até a lateral
    pdf.line(tv_right, tv_top, dim_line_x, tv_top)
    pdf.line(tv_right, tv_bottom, dim_line_x, tv_bottom)

    # Linha vertical na lateral conectando topo e base
    pdf.line(dim_line_x, tv_top, dim_line_x, tv_bottom)

    # Marca no piso na lateral
    pdf.line(dim_line_x - 6, floor_y, dim_line_x + 6, floor_y)

    # Textos com altura (lado direito) - menores e reposicionados
    pdf.setFont('Helvetica', 7)
    pdf.setFillColorRGB(0.4, 0.4, 0.4)

    # Rótulos: topo -> 'Piso/base'; centro -> 'Centro'; base -> 'Piso/topo'
    pdf.drawRightString(dim_line_x - 8, tv_top + 4, f'Piso/base: {floor_to_base_m:.2f}m')
    pdf.drawRightString(dim_line_x - 8, tv_center_y - 4, f'Centro: {tv_center_height_m:.2f}m')
    pdf.drawRightString(dim_line_x - 8, tv_bottom - 12, f'Piso/Topo: {floor_to_top_m:.2f}m')
    
    # Corpo da TV (preto)
    pdf.setFillColorRGB(0.05, 0.05, 0.05)
    pdf.rect(tv_left, tv_top, tv_width_px, tv_height_px, fill=1, stroke=0)
    
    # Moldura colorida
    r, g, b = color_rgb
    pdf.setStrokeColorRGB(r, g, b)
    pdf.setLineWidth(4)
    pdf.rect(tv_left, tv_top, tv_width_px, tv_height_px, fill=0, stroke=1)
    
    # Tamanho dentro da TV (grande)
    pdf.setFont('Helvetica-Bold', 24)
    pdf.setFillColorRGB(1, 1, 1)
    size_inches = rec.get('recommended_size_inches', '')
    pdf.drawCentredString(col_center, tv_center_y, f'{size_inches}"')
    
    # ===== AGORA DESENHAR A LINHA DOS OLHOS (ON TOP) =====
    pdf.setStrokeColorRGB(0.95, 0.1, 0.1)
    pdf.setLineWidth(3)
    pdf.setDash(3, 3)  # Linha tracejada mais visível

    # Texto da linha dos olhos (medida) e largura do rótulo
    eye_label = f'Linha dos olhos ({eye_height_m}m)'
    pdf.setFont('Helvetica-Bold', 10)
    label_w = pdf.stringWidth(eye_label, 'Helvetica-Bold', 10)

    # Desenhar a linha apenas até o fim do texto (com pequeno padding)
    line_x_start = margin_left - 10
    line_x_end = margin_left + label_w + 6
    pdf.line(line_x_start, eye_line_y, line_x_end, eye_line_y)
    pdf.setDash()  # Volta ao normal

    # Texto embaixo da linha dos olhos (sem sobrepor a TV)
    pdf.setFillColorRGB(0.95, 0.1, 0.1)
    pdf.drawString(margin_left, eye_line_y - 12, eye_label)
    
    # ===== INFORMAÇÕES DA TV (sempre entre PISO e LINHA DOS OLHOS) =====
    # Definir área disponível (com pequenas margens)
    info_top = eye_line_y - 6
    info_bottom = floor_y + 6
    available_h = max(0, info_top - info_bottom)

    # Linhas de texto a serem exibidas (ordem de cima para baixo)
    regime_line = f"{regime_name} - {size_inches}\""
    regime_desc = {
        '4H': 'Visualização em detalhes',
        '6H': 'Conteúdo de apresentação',
        '8H': 'Conteúdo de vídeos',
    }
    desc_line = regime_desc.get(regime_name, '')
    height_m = rec.get('screen_height_m', 0)
    height_in = rec.get('screen_height_inches', 0)
    width_m = rec.get('screen_width_m', 0)
    width_in = rec.get('screen_width_inches', 0)
    dim1 = f'Altura: {height_m:.2f}m ({height_in:.1f}\")'
    dim2 = f'Largura: {width_m:.2f}m ({width_in:.1f}\")'
    status = '✓ Cabe no teto' if fits_ceiling else '✗ Não cabe no teto'

    lines = [regime_line, desc_line, dim1, dim2, status]

    # Tamanhos de fonte base (px) para cada linha
    base_sizes = [14, 9, 9, 9, 9]
    # Estimar altura total requerida (incluindo espaçamento entre linhas)
    line_spacings = [size * 1.2 for size in base_sizes]
    required_h = sum(line_spacings)

    # Ajustar escala se necessário para caber na área disponível
    scale = 1.0
    if required_h > available_h and available_h > 0:
        scale = available_h / required_h

    # Calcular posições: centralizar verticalmente dentro da área
    total_h = sum([s * scale * 1.2 for s in base_sizes])
    start_y = info_top - (available_h - total_h) / 2

    # Desenhar cada linha com fonte ajustada
    y = start_y
    for i, text in enumerate(lines):
        fsize = max(6, int(base_sizes[i] * scale))
        # Escolher fonte e cor
        if i == 0:
            pdf.setFont('Helvetica-Bold', fsize)
            pdf.setFillColorRGB(r, g, b)
        elif i == 1:
            pdf.setFont('Helvetica-Oblique', fsize)
            pdf.setFillColorRGB(0.3, 0.3, 0.3)
        elif i == 4:
            pdf.setFont('Helvetica-Bold', fsize)
            if fits_ceiling:
                pdf.setFillColorRGB(0.1, 0.65, 0.1)
            else:
                pdf.setFillColorRGB(0.85, 0.1, 0.1)
        else:
            pdf.setFont('Helvetica', fsize)
            pdf.setFillColorRGB(0, 0, 0)

        pdf.drawCentredString(col_center, y, text)
        y -= fsize * 1.2


def generate_pdf(study: dict) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    wl = study['white_label']
    
    # ===== PÁGINA 1: CAPA COM INFORMAÇÕES =====
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

    y -= 20
    pdf.setFont('Helvetica-Bold', 14)
    pdf.drawString(40, y, 'Recomendações por Regime de Acuidade Visual')
    y -= 20

    pdf.setFont('Helvetica', 11)
    regime_map = {
        '4H': '4H — Visualização em detalhes',
        '6H': '6H — Conteúdo de apresentação',
        '8H': '8H — Conteúdo de vídeos',
    }
    for rec in study['recommendations']:
        regime_label = regime_map.get(rec.get('regime', ''), rec.get('regime', ''))
        size_in = rec.get('recommended_size_inches')
        height_m = rec.get('screen_height_m', 0)
        width_m = rec.get('screen_width_m', 0)
        height_in = rec.get('screen_height_inches', 0)
        width_in = rec.get('screen_width_inches', 0)
        fits_ceiling = rec.get('fits_ceiling', False)
        ceiling_status = '✓ Cabe' if fits_ceiling else '✗ Não cabe'
        
        pdf.drawString(40, y, f"{regime_label}: {size_in}\"")
        y -= 14
        pdf.setFont('Helvetica', 9)
        pdf.drawString(50, y, f"Dimensões: {height_m:.2f}m (H) × {width_m:.2f}m (L) | {height_in:.1f}\" × {width_in:.1f}\" | {ceiling_status}")
        y -= 12
        pdf.setFont('Helvetica', 11)

    pdf.setFont('Helvetica-Oblique', 9)
    pdf.drawString(40, 40, 'VisionSpec AV MVP · Documento técnico white-label')
    
    # ===== PÁGINAS 2, 3, 4: ELEVAÇÕES INDIVIDUAIS =====
    colors = [(0.2, 0.5, 0.9), (0.5, 0.3, 0.9), (0.9, 0.2, 0.5)]  # Azul, Roxo, Rosa
    regime_names = ['4H', '6H', '8H']
    
    # Tentar empilhar 2 elevações por página (duas linhas, uma abaixo da outra)
    rows_per_page = 2
    content_top = height - 80
    content_bottom = 40
    content_height = content_top - content_bottom
    area_height = content_height / rows_per_page

    for idx, (rec, color, regime_name) in enumerate(zip(study['recommendations'], colors, regime_names)):
        page_idx = idx // rows_per_page
        slot_idx = idx % rows_per_page

        if slot_idx == 0:
            pdf.showPage()
            # Cabeçalho por página
            pdf.setFont('Helvetica-Bold', 18)
            pdf.drawString(40, height - 50, f'Elevação Frontal - Página {page_idx + 1}')

        # Calcular área vertical para esta elevação (empilhar de cima para baixo)
        # slot 0 => top, slot 1 => bottom
        area_y = content_bottom + (rows_per_page - 1 - slot_idx) * area_height

        draw_single_elevation(pdf, rec, study, regime_name, color, width, area_y, area_height)
    
    pdf.save()

    buffer.seek(0)
    return buffer.read()

