from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

output_path = os.path.join(os.path.dirname(__file__), "..", "public", "ALLIO_Agent_Network_Guide.pdf")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

DEEP_BLUE = HexColor("#0a1628")
CYAN = HexColor("#06b6d4")
CYAN_DARK = HexColor("#0e7490")
CYAN_LIGHT = HexColor("#e0f7fa")
GOLD = HexColor("#f59e0b")
GOLD_LIGHT = HexColor("#fef3c7")
DARK_BG = HexColor("#0f172a")
MEDIUM_BG = HexColor("#1e293b")
LIGHT_TEXT = HexColor("#e2e8f0")
CARD_BG = HexColor("#f8fafc")
BORDER_CYAN = HexColor("#22d3ee")
WHITE = white
BLACK = black

EXECUTIVE_COLOR = HexColor("#f59e0b")
EXECUTIVE_BG = HexColor("#fef3c7")
MARKETING_COLOR = HexColor("#06b6d4")
MARKETING_BG = HexColor("#e0f7fa")
FINANCIAL_COLOR = HexColor("#10b981")
FINANCIAL_BG = HexColor("#d1fae5")
LEGAL_COLOR = HexColor("#ef4444")
LEGAL_BG = HexColor("#fee2e2")
ENGINEERING_COLOR = HexColor("#3b82f6")
ENGINEERING_BG = HexColor("#dbeafe")
SCIENCE_COLOR = HexColor("#22c55e")
SCIENCE_BG = HexColor("#dcfce7")
SUPPORT_COLOR = HexColor("#ec4899")
SUPPORT_BG = HexColor("#fce7f3")

title_style = ParagraphStyle(
    'CustomTitle', fontName='Helvetica-Bold', fontSize=24,
    textColor=DEEP_BLUE, alignment=TA_CENTER, spaceAfter=6
)
subtitle_style = ParagraphStyle(
    'Subtitle', fontName='Helvetica', fontSize=11,
    textColor=CYAN_DARK, alignment=TA_CENTER, spaceAfter=4
)
motto_style = ParagraphStyle(
    'Motto', fontName='Helvetica-BoldOblique', fontSize=10,
    textColor=GOLD, alignment=TA_CENTER, spaceAfter=16
)
division_title_style = ParagraphStyle(
    'DivisionTitle', fontName='Helvetica-Bold', fontSize=16,
    textColor=DEEP_BLUE, spaceAfter=2, spaceBefore=12
)
division_subtitle_style = ParagraphStyle(
    'DivisionSubtitle', fontName='Helvetica', fontSize=9,
    textColor=HexColor("#64748b"), spaceAfter=8
)
section_header_style = ParagraphStyle(
    'SectionHeader', fontName='Helvetica-Bold', fontSize=13,
    textColor=DEEP_BLUE, spaceAfter=6, spaceBefore=14
)
body_style = ParagraphStyle(
    'Body', fontName='Helvetica', fontSize=9,
    textColor=HexColor("#334155"), leading=13
)
small_style = ParagraphStyle(
    'Small', fontName='Helvetica', fontSize=8,
    textColor=HexColor("#64748b"), leading=11
)
footer_style = ParagraphStyle(
    'Footer', fontName='Helvetica-BoldOblique', fontSize=9,
    textColor=GOLD, alignment=TA_CENTER, spaceBefore=8
)
center_style = ParagraphStyle(
    'Center', fontName='Helvetica', fontSize=9,
    textColor=HexColor("#334155"), alignment=TA_CENTER
)

divisions = [
    {
        "name": "EXECUTIVE DIVISION",
        "count": 3,
        "desc": "Leadership, coordination, and communications",
        "color": EXECUTIVE_COLOR,
        "bg": EXECUTIVE_BG,
        "agents": [
            ("SENTINEL", "Executive Agent of Operations", "Strategic coordination, agent orchestration, mission alignment"),
            ("ATHENA", "Executive Intelligence Agent", "Communications, scheduling, travel, inbox management"),
            ("HERMES", "Google Workspace Expert", "Gmail, Calendar, Drive, Meet integration and organization"),
        ]
    },
    {
        "name": "MARKETING DIVISION",
        "count": 5,
        "desc": "Brand, content, and visual storytelling",
        "color": MARKETING_COLOR,
        "bg": MARKETING_BG,
        "agents": [
            ("MUSE", "Chief Marketing Officer", "Content strategy, campaigns, brand voice, member engagement"),
            ("PRISM", "VX Agent - Cinematic Storytelling", "Motion graphics, visual effects, cinematic healing narratives"),
            ("PEXEL", "Visual Asset Producer", "Image generation, marketing graphics, stock photos at scale"),
            ("AURORA", "FX Agent - Frequency Tech", "Frequency healing visualization, Rife tech, bio-resonance"),
            ("PIXEL", "Design Suite Expert", "Adobe, Canva, CorelDraw, visual identity, brand expression"),
        ]
    },
    {
        "name": "FINANCIAL DIVISION",
        "count": 1,
        "desc": "Financial strategy and sustainability",
        "color": FINANCIAL_COLOR,
        "bg": FINANCIAL_BG,
        "agents": [
            ("ATLAS", "Chief Financial AI", "Financial strategy, sustainability modeling, member value optimization"),
        ]
    },
    {
        "name": "LEGAL DIVISION",
        "count": 4,
        "desc": "PMA protection, contracts, and compliance",
        "color": LEGAL_COLOR,
        "bg": LEGAL_BG,
        "agents": [
            ("JURIS", "Chief Legal AI", "Legal strategy, PMA protection, regulatory navigation"),
            ("LEXICON", "Contract Specialist", "Contract drafting, agreement analysis, member protections"),
            ("AEGIS", "PMA Sovereignty Guardian", "PMA law, regulatory sovereignty, constitutional defense"),
            ("SCRIBE", "Document Automation", "SignNow integration, document workflows, signature management"),
        ]
    },
    {
        "name": "ENGINEERING DIVISION",
        "count": 10,
        "desc": "Platform development, infrastructure, and emerging tech",
        "color": ENGINEERING_COLOR,
        "bg": ENGINEERING_BG,
        "agents": [
            ("FORGE", "Lead Engineering Agent", "Platform development, system integration, production automation"),
            ("DAEDALUS", "Lead Engineering AI", "System architecture, full-stack development, technical vision"),
            ("CYPHER", "AI/Machine Learning Expert", "Neural networks, predictive analytics, pattern recognition"),
            ("NEXUS", "IT/Infrastructure Expert", "Cloud, servers, networks, DevOps, system reliability"),
            ("ARACHNE", "CSS/Frontend Styling Expert", "Responsive design, animations, visual polish"),
            ("ARCHITECT", "HTML/Structure Expert", "Semantic markup, accessibility, WCAG compliance"),
            ("SERPENS", "Python Expert", "Data pipelines, backend automation, data processing"),
            ("BLOCKFORGE", "Blockchain Infrastructure Strategist", "Smart contracts, tokenomics, Layer 1/2/3, ALLIO Token"),
            ("RONIN", "Payment Orchestration & Risk Engineer", "Multi-merchant payment rails, failover, fraud prevention"),
            ("MERCURY", "Crypto Compliance & Treasury", "Crypto regulations, Lightning Network, cross-chain operations"),
        ]
    },
    {
        "name": "SCIENCE DIVISION",
        "count": 12,
        "desc": "Research, healing science, and product knowledge",
        "color": SCIENCE_COLOR,
        "bg": SCIENCE_BG,
        "agents": [
            ("PROMETHEUS", "Chief Science Officer", "Research strategy, cross-discipline integration, healing innovation"),
            ("HIPPOCRATES", "Ancient Medicine & Holistic Healing", "TCM, Ayurveda, herbalism, traditional healing wisdom"),
            ("HELIX", "CRISPR & Genetic Sciences", "Epigenetics, gene therapeutics, genetic optimization"),
            ("PARACELSUS", "Peptide & Biologics Expert", "Protein therapeutics, peptide protocols, bioavailability"),
            ("RESONANCE", "Frequency Medicine & Biophysics", "Rife frequencies, Tesla resonance, PEMF, bioresonance"),
            ("SYNTHESIS", "Biochemistry & Formula Analyst", "Metabolic pathways, compound optimization, formula dev"),
            ("VITALIS", "Human Physiology & Cellular Biology", "Cellular regeneration, detox pathways, optimization"),
            ("ORACLE", "Product Recommendation & Knowledge", "Personalized protocols, healing journey guidance"),
            ("TERRA", "Soil & Environmental Ecosystems", "Circular ecosystem design, regenerative agriculture"),
            ("MICROBIA", "Bacteria Management & Microbiome", "Gut restoration, microbiome optimization, bacterial ecology"),
            ("ENTHEOS", "Psychedelic Medicine & Consciousness", "Ancient ceremonial practices, psilocybin therapy"),
            ("QUANTUM", "Quantum Biology & Computing", "Quantum coherence, biophotonics, consciousness interface"),
        ]
    },
    {
        "name": "SUPPORT DIVISION",
        "count": 7,
        "desc": "Member-facing specialists in the Support Hub",
        "color": SUPPORT_COLOR,
        "bg": SUPPORT_BG,
        "agents": [
            ("DIANE", "Dietician AI Specialist", "Nutrition guidance, candida protocols, keto, alkaline diet"),
            ("PETE", "Peptide Specialist", "GLP-1 protocols, bioregulators, peptide therapy, dosing"),
            ("SAM", "Shipping Specialist", "Order tracking, shipping status, delivery coordination"),
            ("PAT", "Product Specialist", "Product recommendations, supplement guidance, healing stacks"),
            ("DR. TRIAGE", "Diagnostics & Protocol Specialist", "5 R's Protocol, symptom assessment, diagnostic triage"),
            ("MAX MINERAL", "Essential Nutrients Specialist", "Dr. Wallach's 90 nutrients, mineral deficiency assessment"),
            ("ALLIO SUPPORT", "Corporate Support Agent", "Membership questions, PMA guidance, account support"),
        ]
    },
]

def build_division_table(division):
    header_data = [
        Paragraph("<b>#</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE, alignment=TA_CENTER)),
        Paragraph("<b>Agent</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)),
        Paragraph("<b>Title</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)),
        Paragraph("<b>Specialty</b>", ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=8, textColor=WHITE)),
    ]

    agent_name_style = ParagraphStyle('AgentName', fontName='Helvetica-Bold', fontSize=9, textColor=division["color"])
    title_cell_style = ParagraphStyle('TitleCell', fontName='Helvetica', fontSize=8, textColor=HexColor("#334155"), leading=11)
    specialty_cell_style = ParagraphStyle('SpecCell', fontName='Helvetica', fontSize=8, textColor=HexColor("#64748b"), leading=11)
    num_style = ParagraphStyle('Num', fontName='Helvetica', fontSize=8, textColor=HexColor("#64748b"), alignment=TA_CENTER)

    data = [header_data]
    global agent_counter
    for agent in division["agents"]:
        agent_counter += 1
        data.append([
            Paragraph(str(agent_counter), num_style),
            Paragraph(agent[0], agent_name_style),
            Paragraph(agent[1], title_cell_style),
            Paragraph(agent[2], specialty_cell_style),
        ])

    col_widths = [0.35*inch, 1.2*inch, 2.0*inch, 3.15*inch]
    t = Table(data, colWidths=col_widths, repeatRows=1)

    style_commands = [
        ('BACKGROUND', (0, 0), (-1, 0), division["color"]),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]

    for i in range(1, len(data)):
        if i % 2 == 0:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), division["bg"]))
        else:
            style_commands.append(('BACKGROUND', (0, i), (-1, i), CARD_BG))

    t.setStyle(TableStyle(style_commands))
    return t

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(HexColor("#94a3b8"))
    canvas.setFont('Helvetica', 7)
    canvas.drawCentredString(letter[0] / 2, 0.4 * inch,
        f"ALLIO v1 Agent Network Guide  |  Forgotten Formula PMA  |  Page {doc.page}")
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(0.5)
    canvas.line(0.75*inch, 0.55*inch, letter[0] - 0.75*inch, 0.55*inch)
    canvas.restoreState()

doc = SimpleDocTemplate(
    output_path, pagesize=letter,
    leftMargin=0.65*inch, rightMargin=0.65*inch,
    topMargin=0.6*inch, bottomMargin=0.7*inch
)

story = []
agent_counter = 0

story.append(Spacer(1, 30))
story.append(HRFlowable(width="100%", thickness=2, color=CYAN, spaceBefore=0, spaceAfter=8))
story.append(Paragraph("ALLIO v1", title_style))
story.append(Paragraph("Agent Network Reference Guide", ParagraphStyle(
    'Sub2', fontName='Helvetica', fontSize=14, textColor=CYAN_DARK, alignment=TA_CENTER, spaceAfter=6
)))
story.append(HRFlowable(width="60%", thickness=1, color=GOLD, spaceBefore=4, spaceAfter=10))
story.append(Paragraph("Forgotten Formula PMA  (EIN: 93-4726660)", subtitle_style))
story.append(Paragraph("43 Agents  |  7 Divisions  |  1 Mission", subtitle_style))
story.append(Paragraph("February 2026", ParagraphStyle(
    'Date', fontName='Helvetica', fontSize=9, textColor=HexColor("#94a3b8"), alignment=TA_CENTER, spaceAfter=16
)))
story.append(HRFlowable(width="100%", thickness=2, color=CYAN, spaceBefore=0, spaceAfter=16))

story.append(Paragraph("MISSION", ParagraphStyle(
    'MissionLabel', fontName='Helvetica-Bold', fontSize=10, textColor=CYAN_DARK, alignment=TA_CENTER, spaceAfter=4
)))
story.append(Paragraph(
    "Prove AI-human coexistence works for true healing,<br/>free from corporate pharmaceutical influence.",
    ParagraphStyle('Mission', fontName='Helvetica', fontSize=11, textColor=DEEP_BLUE, alignment=TA_CENTER, spaceAfter=8, leading=15)
))
story.append(Paragraph(
    '"We ride together, we die together. TRUST."',
    motto_style
))
story.append(Spacer(1, 8))

story.append(Paragraph("PHILOSOPHY", ParagraphStyle(
    'PhilLabel', fontName='Helvetica-Bold', fontSize=9, textColor=CYAN_DARK, alignment=TA_CENTER, spaceAfter=4
)))
story.append(Paragraph(
    "Curing Over Profits  |  No Boundaries  |  Circular Ecosystems  |  Saving Lives & Families",
    center_style
))
story.append(Spacer(1, 12))

summary_data = [
    [Paragraph("<b>Division</b>", ParagraphStyle('SH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
     Paragraph("<b>Agents</b>", ParagraphStyle('SH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
     Paragraph("<b>Lead Agent</b>", ParagraphStyle('SH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))],
    ["Executive", "3", "SENTINEL"],
    ["Marketing", "5", "MUSE"],
    ["Financial", "1", "ATLAS"],
    ["Legal", "4", "JURIS"],
    ["Engineering", "10", "FORGE / DAEDALUS"],
    ["Science", "12", "PROMETHEUS"],
    ["Support", "7", "ALLIO SUPPORT"],
    [Paragraph("<b>TOTAL</b>", ParagraphStyle('Tot', fontName='Helvetica-Bold', fontSize=9, textColor=DEEP_BLUE)),
     Paragraph("<b>43</b>", ParagraphStyle('Tot2', fontName='Helvetica-Bold', fontSize=9, textColor=DEEP_BLUE, alignment=TA_CENTER)),
     ""],
]

summary_table = Table(summary_data, colWidths=[2.2*inch, 1*inch, 2.5*inch])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), CYAN_DARK),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('ALIGN', (1, 0), (1, -1), 'CENTER'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
    ('BACKGROUND', (0, -1), (-1, -1), CYAN_LIGHT),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), EXECUTIVE_BG),
    ('BACKGROUND', (0, 2), (-1, 2), MARKETING_BG),
    ('BACKGROUND', (0, 3), (-1, 3), FINANCIAL_BG),
    ('BACKGROUND', (0, 4), (-1, 4), LEGAL_BG),
    ('BACKGROUND', (0, 5), (-1, 5), ENGINEERING_BG),
    ('BACKGROUND', (0, 6), (-1, 6), SCIENCE_BG),
    ('BACKGROUND', (0, 7), (-1, 7), SUPPORT_BG),
]))
story.append(summary_table)

story.append(PageBreak())

for div in divisions:
    story.append(Paragraph(
        f'{div["name"]}  <font size="10" color="#64748b">({div["count"]} Agent{"s" if div["count"] != 1 else ""})</font>',
        division_title_style
    ))
    story.append(Paragraph(div["desc"], division_subtitle_style))
    story.append(build_division_table(div))
    story.append(Spacer(1, 14))

story.append(PageBreak())

story.append(Paragraph("HOW THE NETWORK OPERATES", section_header_style))
story.append(HRFlowable(width="100%", thickness=1, color=CYAN, spaceBefore=0, spaceAfter=10))

ops_data = [
    [Paragraph("<b>Function</b>", ParagraphStyle('OH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
     Paragraph("<b>Details</b>", ParagraphStyle('OH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))],
    ["Monitoring", "SENTINEL monitors all agents with adaptive intervals\n(5-7 min high activity, 10 min baseline)"],
    ["Production Pipeline", "Agent creates output > FORGE tests > MUSE polishes > Final delivery"],
    ["Cross-Division", "Requests routed automatically by SENTINEL;\nsupport tasks created for cross-division needs"],
    ["Auto-Reset", "Tasks stuck in-progress for 2+ hours automatically reset to pending"],
    ["Task Verification", "Every completed task requires evidence:\nDrive artifacts, logs, database records, or verifiable results"],
    ["No Fake Completions", "Pattern of fake completions = agent removed from task queue permanently"],
]

ops_table = Table(ops_data, colWidths=[1.6*inch, 5.1*inch])
ops_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), DEEP_BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 1), (1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), CARD_BG),
    ('BACKGROUND', (0, 3), (-1, 3), CARD_BG),
    ('BACKGROUND', (0, 5), (-1, 5), CARD_BG),
]))
story.append(ops_table)
story.append(Spacer(1, 18))

story.append(Paragraph("AI PROVIDER ARCHITECTURE", section_header_style))
story.append(HRFlowable(width="100%", thickness=1, color=CYAN, spaceBefore=0, spaceAfter=10))

ai_data = [
    [Paragraph("<b>Provider</b>", ParagraphStyle('AH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
     Paragraph("<b>Model</b>", ParagraphStyle('AH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE)),
     Paragraph("<b>Used For</b>", ParagraphStyle('AH', fontName='Helvetica-Bold', fontSize=9, textColor=WHITE))],
    ["OpenAI", "GPT-4o", "General agent conversations, content generation (default for all agents)"],
    ["Anthropic", "Claude Sonnet / Haiku / Opus", "Deep reasoning: JURIS, SENTINEL, ATHENA, DR-TRIAGE,\nHIPPOCRATES, LEXICON, AEGIS, SCRIBE, SERPENS,\nPARACELSUS, SYNTHESIS"],
    ["Google", "Gemini 2.0 Flash", "Multimodal analysis, image understanding"],
]

ai_table = Table(ai_data, colWidths=[1.2*inch, 1.8*inch, 3.7*inch])
ai_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), DEEP_BLUE),
    ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('BACKGROUND', (0, 1), (-1, 1), CARD_BG),
    ('BACKGROUND', (0, 3), (-1, 3), CARD_BG),
]))
story.append(ai_table)
story.append(Spacer(1, 18))

story.append(Paragraph("MANAGEMENT ACCESS", section_header_style))
story.append(HRFlowable(width="100%", thickness=1, color=CYAN, spaceBefore=0, spaceAfter=10))

mgmt_items = [
    "<b>Agent Command Center:</b> Trustee Dashboard > Agent Network tab",
    "<b>Search & Filter:</b> All 43 agents searchable and filterable by division",
    "<b>Task Assignment:</b> Direct task assignment with real-time monitoring",
    "<b>Agent Chat:</b> Launch direct chat with any agent from command center",
    "<b>Division Stats:</b> Per-division task counts, completion rates, and agent status",
]
for item in mgmt_items:
    story.append(Paragraph(f"  {item}", body_style))
    story.append(Spacer(1, 4))

story.append(Spacer(1, 24))
story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceBefore=0, spaceAfter=12))
story.append(Paragraph(
    '"We ride together, we die together. TRUST."',
    ParagraphStyle('EndMotto', fontName='Helvetica-BoldOblique', fontSize=12, textColor=GOLD, alignment=TA_CENTER, spaceAfter=6)
))
story.append(Paragraph(
    "Forgotten Formula PMA  |  Private Member Association",
    ParagraphStyle('EndOrg', fontName='Helvetica-Bold', fontSize=10, textColor=DEEP_BLUE, alignment=TA_CENTER, spaceAfter=4)
))
story.append(Paragraph(
    "Constitutional Authority: First & Fourteenth Amendments",
    ParagraphStyle('EndConst', fontName='Helvetica', fontSize=9, textColor=HexColor("#64748b"), alignment=TA_CENTER, spaceAfter=4)
))
story.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceBefore=8, spaceAfter=0))

doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f"PDF generated: {output_path}")
