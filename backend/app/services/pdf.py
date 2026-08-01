import html
import io
import logging
from pypdf import PdfReader

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.schemas.itinerary import ItineraryResponse

logger = logging.getLogger("voyageai.pdf")


def escape_pdf_text(text: str | None) -> str:
    """Sanitize and XML-escape text so ReportLab Paragraphs render safely without XML or Unicode encoding errors."""
    if not text:
        return ""

    s = str(text)
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = s.replace("—", "-").replace("–", "-")

    # Escape HTML/XML entities (&, <, >)
    s = html.escape(s, quote=False)

    # Convert common symbols to ReportLab XML entities / safe ASCII
    s = s.replace("•", "&bull;")
    s = s.replace("→", "-&gt;")

    # Strip characters outside Latin-1 (e.g. emojis) that ReportLab standard Helvetica cannot encode
    cleaned = []
    for char in s:
        if ord(char) < 256:
            cleaned.append(char)
    return "".join(cleaned)


def extract_text(file_path: str) -> tuple[str, int]:
    """Extract all text from a PDF file.

    Returns:
        (full_text, page_count)
    """
    reader = PdfReader(file_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)

    return "\n\n".join(pages), len(reader.pages)


def generate_itinerary_pdf(data: ItineraryResponse) -> bytes:
    """Generate a clean, professional PDF binary buffer from an ItineraryResponse."""
    dest_clean = escape_pdf_text(data.destination)
    logger.info(f"[PDF Service] 1. Starting PDF generation for destination: {dest_clean}")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=15,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=8,
    )
    day_title_style = ParagraphStyle(
        "DayTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=6,
        spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=3,
    )

    story = []

    # Title Banner
    story.append(Paragraph(f"VoyageAI Itinerary: {dest_clean}", title_style))
    exch_info = escape_pdf_text(data.exchange_rate_info)
    story.append(Paragraph(f"Duration: {data.days} Days | Exchange Rate: {exch_info}", subtitle_style))
    story.append(Spacer(1, 10))

    logger.info("[PDF Service] 2. Building day-wise itinerary elements")

    # Itinerary Days
    story.append(Paragraph("Day-by-Day Itinerary", heading_style))
    for day in data.itinerary:
        cost_inr = getattr(day, "estimated_cost_inr", getattr(day, "estimated_cost", 0.0)) or 0.0
        cost_local = getattr(day, "estimated_cost_local", 0.0) or 0.0
        title_esc = escape_pdf_text(day.title)

        curr_code = escape_pdf_text(data.currency_code)
        if data.currency_code != "INR" and cost_local > 0:
            cost_str = f"~Rs. {cost_inr:,.0f} / {curr_code} {cost_local:,.0f}"
        else:
            cost_str = f"~Rs. {cost_inr:,.0f}"

        story.append(Paragraph(f"Day {day.day}: {title_esc} ({cost_str})", day_title_style))
        for act in day.activities:
            act_esc = escape_pdf_text(act)
            story.append(Paragraph(f"&bull; {act_esc}", body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 10))
    logger.info("[PDF Service] 3. Building budget breakdown table")

    # Budget Breakdown
    story.append(Paragraph("Budget Breakdown", heading_style))
    curr_code = escape_pdf_text(data.currency_code)

    if data.currency_code != "INR" and data.exchange_rate_to_inr > 0:
        breakdown_data = [[
            Paragraph("<b>Category</b>", body_style),
            Paragraph("<b>Amount (INR - Rs.)</b>", body_style),
            Paragraph(f"<b>Amount ({curr_code})</b>", body_style),
        ]]
        for k, v in data.budget_breakdown.model_dump().items():
            if k != "total":
                val_inr = v if v is not None else 0.0
                val_local = val_inr / data.exchange_rate_to_inr
                breakdown_data.append([
                    Paragraph(escape_pdf_text(k.capitalize()), body_style),
                    Paragraph(f"Rs. {val_inr:,.2f}", body_style),
                    Paragraph(f"{val_local:,.2f}", body_style),
                ])
        tot_inr = data.budget_breakdown.total if data.budget_breakdown.total is not None else 0.0
        tot_local = tot_inr / data.exchange_rate_to_inr
        breakdown_data.append([
            Paragraph("<b>TOTAL</b>", body_style),
            Paragraph(f"<b>Rs. {tot_inr:,.2f}</b>", body_style),
            Paragraph(f"<b>{tot_local:,.2f}</b>", body_style),
        ])
        table = Table(breakdown_data, colWidths=[180, 110, 110])
    else:
        breakdown_data = [[
            Paragraph("<b>Category</b>", body_style),
            Paragraph("<b>Amount (INR - Rs.)</b>", body_style)
        ]]
        for k, v in data.budget_breakdown.model_dump().items():
            if k != "total":
                val_inr = v if v is not None else 0.0
                breakdown_data.append([
                    Paragraph(escape_pdf_text(k.capitalize()), body_style),
                    Paragraph(f"Rs. {val_inr:,.2f}", body_style)
                ])
        tot_inr = data.budget_breakdown.total if data.budget_breakdown.total is not None else 0.0
        breakdown_data.append([
            Paragraph("<b>TOTAL</b>", body_style),
            Paragraph(f"<b>Rs. {tot_inr:,.2f}</b>", body_style)
        ])
        table = Table(breakdown_data, colWidths=[240, 160])

    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ]))
    story.append(table)


    story.append(Spacer(1, 12))
    logger.info("[PDF Service] 4. Building packing list and travel tips")

    # Packing List & Travel Tips
    story.append(Paragraph("Packing List", heading_style))
    packing_clean = ", ".join(escape_pdf_text(item) for item in data.packing_list)
    story.append(Paragraph(packing_clean, body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Travel Tips", heading_style))
    for tip in data.travel_tips:
        tip_esc = escape_pdf_text(tip)
        story.append(Paragraph(f"-&gt; {tip_esc}", body_style))

    logger.info("[PDF Service] 5. Compiling reportlab PDF document buffer")
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    logger.info(f"[PDF Service] 6. PDF generation complete. Generated {len(pdf_bytes)} bytes.")
    return pdf_bytes


