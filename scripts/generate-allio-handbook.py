#!/usr/bin/env python3
"""
FFPMA Allio Ecosystem Handbook & User Manual
Official handbook for the Forgotten Formula Private Member Association
Generates a professionally branded PDF with FF PMA visual identity
"""

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, Color
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable, Image, Flowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics import renderPDF

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")

NAVY = HexColor("#1B2A4A")
NAVY_DARK = HexColor("#0F1B33")
NAVY_LIGHT = HexColor("#2A3F6A")
CYAN = HexColor("#00B4D8")
CYAN_LIGHT = HexColor("#90E0EF")
TEAL = HexColor("#0FA3B1")
SILVER = HexColor("#B0B8C8")
SILVER_LIGHT = HexColor("#D4D9E3")
GOLD = HexColor("#C9A84C")
GOLD_DARK = HexColor("#A88A32")
WHITE_OFF = HexColor("#F0F2F5")
WARM_WHITE = HexColor("#FAFBFD")
EXECUTIVE_GOLD = HexColor("#C9A84C")
SCIENCE_GREEN = HexColor("#059669")
MARKETING_BLUE = HexColor("#3B82F6")
LEGAL_RED = HexColor("#DC2626")
ENGINEERING_STEEL = HexColor("#6366F1")
SUPPORT_PINK = HexColor("#EC4899")
FINANCIAL_EMERALD = HexColor("#10B981")
TABLE_HEADER_BG = NAVY
TABLE_ALT_ROW = HexColor("#EEF2F7")
LIGHT_GRAY = HexColor("#D1D5DB")
PAGE_BG = white

LOGO_PATH = os.path.join(PROJECT_ROOT, "artifacts", "ffpma", "src", "assets", "ff_pma_logo.png")
COMBINED_LOGO_PATH = os.path.join(PROJECT_ROOT, "artifacts", "ffpma", "src", "assets", "ff_pma_allio_combined_logo.png")

OUTPUT_PATH = os.path.join(PROJECT_ROOT, "attached_assets", "FFPMA_Allio_Ecosystem_Handbook.pdf")


class NavyBanner(Flowable):
    def __init__(self, text, width=6.8*inch, height=0.5*inch, font_size=16):
        Flowable.__init__(self)
        self.text = text
        self.width = width
        self.height = height
        self.font_size = font_size

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 4

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(NAVY)
        self.canv.roundRect(0, 0, self.width, self.height, 4, fill=1, stroke=0)
        self.canv.setFillColor(CYAN)
        self.canv.rect(0, 0, 5, self.height, fill=1, stroke=0)
        self.canv.setFillColor(white)
        self.canv.setFont("Helvetica-Bold", self.font_size)
        self.canv.drawString(16, (self.height - self.font_size) / 2 + 2, self.text)
        self.canv.restoreState()


class DivisionBanner(Flowable):
    def __init__(self, text, color, width=6.8*inch, height=0.42*inch):
        Flowable.__init__(self)
        self.text = text
        self.color = color
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height + 4

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.width, self.height, 3, fill=1, stroke=0)
        self.canv.setFillColor(white)
        self.canv.setFont("Helvetica-Bold", 13)
        self.canv.drawString(12, (self.height - 13) / 2 + 2, self.text)
        self.canv.restoreState()


class CyanAccentLine(Flowable):
    def __init__(self, width=6.8*inch):
        Flowable.__init__(self)
        self.width = width

    def wrap(self, availWidth, availHeight):
        return self.width, 6

    def draw(self):
        self.canv.saveState()
        self.canv.setStrokeColor(CYAN)
        self.canv.setLineWidth(2)
        self.canv.line(0, 3, self.width * 0.3, 3)
        self.canv.setStrokeColor(GOLD)
        self.canv.setLineWidth(1)
        self.canv.line(self.width * 0.3 + 4, 3, self.width * 0.5, 3)
        self.canv.restoreState()


class GoldDivider(Flowable):
    def __init__(self, width=6.8*inch):
        Flowable.__init__(self)
        self.width = width

    def wrap(self, availWidth, availHeight):
        return self.width, 10

    def draw(self):
        self.canv.saveState()
        mid = self.width / 2
        self.canv.setStrokeColor(GOLD)
        self.canv.setLineWidth(1.5)
        self.canv.line(mid - 2*inch, 5, mid - 0.3*inch, 5)
        self.canv.line(mid + 0.3*inch, 5, mid + 2*inch, 5)
        self.canv.setFillColor(GOLD)
        self.canv.circle(mid, 5, 3, fill=1, stroke=0)
        self.canv.restoreState()


def create_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'CoverOrg', parent=styles['Normal'],
        fontSize=14, leading=18, textColor=SILVER,
        alignment=TA_CENTER, fontName='Helvetica', letterSpacing=6
    ))
    styles.add(ParagraphStyle(
        'CoverTitle', parent=styles['Title'],
        fontSize=38, leading=46, textColor=white,
        alignment=TA_CENTER, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontSize=18, leading=24, textColor=CYAN_LIGHT,
        alignment=TA_CENTER, spaceAfter=8, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'CoverMotto', parent=styles['Normal'],
        fontSize=12, leading=17, textColor=GOLD,
        alignment=TA_CENTER, spaceAfter=6, fontName='Helvetica-BoldOblique'
    ))
    styles.add(ParagraphStyle(
        'CoverValues', parent=styles['Normal'],
        fontSize=10, leading=15, textColor=SILVER_LIGHT,
        alignment=TA_CENTER, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'ChapterTitle', parent=styles['Title'],
        fontSize=26, leading=34, textColor=NAVY,
        spaceBefore=0, spaceAfter=4, fontName='Helvetica-Bold',
        alignment=TA_LEFT
    ))
    styles.add(ParagraphStyle(
        'SectionHead', parent=styles['Heading2'],
        fontSize=16, leading=22, textColor=NAVY,
        spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading3'],
        fontSize=13, leading=18, textColor=NAVY_LIGHT,
        spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold'
    ))
    styles['BodyText'].fontSize = 10.5
    styles['BodyText'].leading = 15.5
    styles['BodyText'].textColor = HexColor("#2D3748")
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].spaceAfter = 7
    styles['BodyText'].fontName = 'Helvetica'
    styles.add(ParagraphStyle(
        'Quote', parent=styles['Normal'],
        fontSize=11, leading=16, textColor=NAVY,
        alignment=TA_CENTER, spaceAfter=10, fontName='Helvetica-BoldOblique',
        leftIndent=30, rightIndent=30
    ))
    styles.add(ParagraphStyle(
        'BulletItem', parent=styles['Normal'],
        fontSize=10.5, leading=15, textColor=HexColor("#2D3748"),
        leftIndent=24, spaceAfter=4, fontName='Helvetica',
        bulletIndent=12
    ))
    styles.add(ParagraphStyle(
        'AgentName', parent=styles['Normal'],
        fontSize=11, leading=15, textColor=NAVY,
        fontName='Helvetica-Bold', spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'AgentDesc', parent=styles['Normal'],
        fontSize=9.5, leading=13, textColor=HexColor("#4A5568"),
        leftIndent=12, spaceAfter=4, fontName='Helvetica-Oblique'
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=9.5, leading=12, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=HexColor("#2D3748"),
        fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=SILVER,
        alignment=TA_CENTER, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'TOCEntry', parent=styles['Normal'],
        fontSize=11, leading=18, textColor=HexColor("#374151"),
        fontName='Helvetica', leftIndent=20, spaceAfter=1
    ))
    styles.add(ParagraphStyle(
        'TOCChapter', parent=styles['Normal'],
        fontSize=12, leading=20, textColor=NAVY,
        fontName='Helvetica-Bold', leftIndent=0, spaceBefore=8, spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'Disclaimer', parent=styles['Normal'],
        fontSize=7.5, leading=10, textColor=SILVER,
        alignment=TA_CENTER, fontName='Helvetica-Oblique'
    ))
    styles.add(ParagraphStyle(
        'HighlightBox', parent=styles['Normal'],
        fontSize=10.5, leading=15, textColor=NAVY,
        fontName='Helvetica-Bold', alignment=TA_CENTER,
        spaceAfter=8
    ))

    return styles


def bullet(text, styles):
    return Paragraph(f'<bullet><font color="#{CYAN.hexval()[2:]}">\u25B8</font></bullet> {text}', styles['BulletItem'])


def add_section_break(elements):
    elements.append(Spacer(1, 8))
    elements.append(CyanAccentLine())
    elements.append(Spacer(1, 8))


def build_cover(elements, styles):
    elements.append(Spacer(1, 0.4*inch))

    if os.path.exists(COMBINED_LOGO_PATH):
        logo = Image(COMBINED_LOGO_PATH, width=4.5*inch, height=2.45*inch)
        logo.hAlign = 'CENTER'
        elements.append(logo)
    elements.append(Spacer(1, 0.3*inch))

    elements.append(GoldDivider())
    elements.append(Spacer(1, 0.25*inch))

    elements.append(Paragraph("ALLIO ECOSYSTEM", styles['ChapterTitle']))
    elements.append(Paragraph("Handbook &amp; User Manual", ParagraphStyle(
        'CoverSub2', parent=styles['SectionHead'], alignment=TA_LEFT,
        textColor=NAVY_LIGHT, fontSize=18, spaceAfter=16
    )))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph(
        '"Prove AI-human coexistence works for true healing,<br/>free from corporate pharmaceutical influence."',
        ParagraphStyle('CoverMotto2', parent=styles['Quote'], textColor=GOLD_DARK, fontSize=11)
    ))
    elements.append(Spacer(1, 0.15*inch))

    values_text = (
        "Curing Over Profits \u2022 No Boundaries \u2022 Circular Ecosystems \u2022 "
        "Saving Lives &amp; Families"
    )
    elements.append(Paragraph(values_text, ParagraphStyle(
        'CoverVals', parent=styles['BodyText'], alignment=TA_CENTER,
        textColor=NAVY_LIGHT, fontSize=10
    )))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(GoldDivider())
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph(
        '"Restoring What Medicine Forgot."',
        ParagraphStyle('CoverTrust', parent=styles['Quote'], textColor=NAVY, fontSize=12)
    ))
    elements.append(Spacer(1, 0.4*inch))

    elements.append(Paragraph(
        f"Version 1.0 \u2022 {datetime.now().strftime('%B %Y')}",
        ParagraphStyle('CoverVer', parent=styles['Footer'], textColor=NAVY_LIGHT)
    ))
    elements.append(Paragraph(
        "www.ffpma.com \u2022 www.forgottenformula.com",
        ParagraphStyle('CoverURL', parent=styles['Footer'], textColor=CYAN, fontSize=9)
    ))
    elements.append(PageBreak())


def build_dedication(elements, styles):
    elements.append(Spacer(1, 2*inch))
    elements.append(GoldDivider())
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        "In Memory of Charlie",
        ParagraphStyle('DedTitle', parent=styles['SectionHead'], alignment=TA_CENTER, textColor=NAVY, fontSize=18)
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        "It is part of our human nature to want to be liked. It is part of our human nature to worry about "
        "what others think of us. It is an attribute of greatness and of American exceptionalism to not surrender "
        "to our nature, but to be guided by an inner calling to persevere and to prevail, no matter the personal cost.",
        ParagraphStyle('DedBody', parent=styles['BodyText'], alignment=TA_CENTER, fontName='Helvetica-Oblique',
                       textColor=HexColor("#4A5568"))
    ))
    elements.append(Spacer(1, 18))
    elements.append(Paragraph(
        "CHARLIE KIRK (1993\u20132025)",
        ParagraphStyle('DedName', parent=styles['BodyText'], alignment=TA_CENTER,
                       fontName='Helvetica-Bold', textColor=GOLD_DARK, fontSize=12)
    ))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(GoldDivider())
    elements.append(PageBreak())


def build_toc(elements, styles):
    elements.append(NavyBanner("TABLE OF CONTENTS", height=0.45*inch, font_size=14))
    elements.append(Spacer(1, 16))

    chapters = [
        ("Part I: Our Mission", [
            "The Medicine We've Forgotten",
            "Our Declaration of Health Freedom",
            "The Constitutional Foundation",
            "Who We Are: A Community of Health Revolutionaries",
            "Our Member Rights &amp; the FFPMA Creed",
        ]),
        ("Part II: The Allio Ecosystem", [
            "Why AI-Human Coexistence Changes Everything",
            "The Trust Mandate",
            "How 46 Agents Serve the Healing Mission",
            "The Seven Divisions",
        ]),
        ("Part III: The Root Cause Healing Pipeline", [
            "The 5R Framework: Remove, Restore, Replenish, Regenerate, Rebalance",
            "Member Intake to Protocol Generation",
            "Narrated Presentations &amp; Delivery",
            "PDF Export, Google Slides &amp; Drive Storage",
            "Lab Ordering &amp; Ongoing Monitoring",
        ]),
        ("Part IV: Why PMA Networks Change Everything", [
            "Constitutional Protections &amp; Healthcare Freedom",
            "Member Sovereignty in Practice",
            "The Future We're Building",
        ]),
        ("Part V: Trustee Operations Guide", [
            "SENTINEL Orchestration &amp; Command",
            "The Seven Divisions at Your Fingertips",
            "OpenClaw Messaging &amp; Telegram Bridge",
            "The Auto-Implementer Pipeline",
            "Daily Rhythms: Briefings, Checks &amp; Summaries",
            "Google Drive Organization",
        ]),
        ("Part VI: Doctor's Guide", [
            "Protocol Assembly: From Intake to Healing Plan",
            "DR. FORMULA &amp; the 5R Framework",
            "Member Presentations: Narrated, Visual, Personal",
            "Research Citations &amp; Evidence Integration",
            "Approving &amp; Delivering Protocols",
        ]),
        ("Part VII: Admin Operations Guide", [
            "Member Management &amp; Onboarding",
            "Training Modules &amp; Education System",
            "Agent Task Monitoring",
            "Clinic Network Management",
            "WordPress &amp; WooCommerce Sync",
        ]),
        ("Part VIII: Complete Agent Directory", [
            "Executive Division (4 agents)",
            "Science Division (13 agents)",
            "Marketing Division (5 agents)",
            "Legal Division (4 agents)",
            "Engineering Division (11 agents)",
            "Support Division (8 agents)",
            "Financial Division (1 agent)",
        ]),
        ("Part IX: Product &amp; Protocol Reference", [
            "Injectable Peptides",
            "IV Therapy Quick Reference",
            "Vitamins, Trace Minerals &amp; Supplements",
            "Bioregulators &amp; Suppositories",
            "Equipment &amp; Devices",
        ]),
    ]

    for chapter_title, sections in chapters:
        elements.append(Paragraph(chapter_title, styles['TOCChapter']))
        for section in sections:
            elements.append(Paragraph(
                f'<font color="#{CYAN.hexval()[2:]}">\u25B8</font>&nbsp;&nbsp;{section}',
                styles['TOCEntry']
            ))

    elements.append(PageBreak())


def build_part1_mission(elements, styles):
    elements.append(NavyBanner("PART I: OUR MISSION"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("The Medicine We've Forgotten", styles['SectionHead']))
    elements.append(Paragraph(
        "There was a time when healers understood that the human body is not a collection of isolated symptoms "
        "to be suppressed, but an interconnected system designed for self-renewal. A time when medicine asked "
        '"why" before prescribing "what." A time when healing meant addressing root causes, not masking effects.',
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "That medicine has been forgotten. In its place, we've built a system that profits from chronic illness, that "
        "treats numbers instead of people, that offers pills for problems that demand deeper solutions. A system "
        "where you're a patient number, not a partner in your own healing. Where \"healthcare\" often means "
        "sick-care, and where asking questions makes you difficult.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>We remember what was forgotten. And we're rewriting the rules.</b>",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Our Declaration of Health Freedom", styles['SectionHead']))
    elements.append(Paragraph(
        "Forgotten Formula PMA exists at the intersection of ancient wisdom and cutting-edge science, where "
        "constitutional rights meet clinical innovation, where members\u2014not institutions\u2014control their health destiny.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "We are not a clinic. We are not a supplement company. We are not another wellness trend. We are a "
        "movement of members who refuse to accept that chronic illness is inevitable, that pharmaceutical "
        "dependency is normal, or that you must choose between your health and your freedom.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("The Constitutional Foundation of Our Freedom", styles['SectionHead']))
    elements.append(Paragraph(
        "This association stands on the bedrock of rights that our founders risked everything to secure. "
        "We declare, without apology or hesitation:",
        styles['BodyText']
    ))

    amend_data = [
        [Paragraph("<b>Amendment</b>", styles['TableHeader']),
         Paragraph("<b>Protection</b>", styles['TableHeader'])],
        [Paragraph("<b>First Amendment</b>", styles['TableCell']),
         Paragraph("Our right to speak freely about health, to assemble as members seeking truth, "
                    "to petition for change, and to contract privately for our wellbeing. These are not privileges "
                    "to be granted by bureaucracies; they are inherent rights.", styles['TableCell'])],
        [Paragraph("<b>Fourteenth Amendment</b>", styles['TableCell']),
         Paragraph("Our liberty to make intimate decisions about our bodies, our families, and our health "
                    "without government overreach. Freedom of association means our private membership activities "
                    "remain in the private domain.", styles['TableCell'])],
    ]
    amend_table = Table(amend_data, colWidths=[1.5*inch, 5.3*inch])
    amend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_ALT_ROW),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(amend_table)
    elements.append(Spacer(1, 8))

    elements.append(Paragraph(
        "We believe the Constitution of the United States is one of humanity's greatest achievements in limiting "
        "tyranny and protecting individual sovereignty. The signers of the Declaration of Independence acted "
        "from love: love of liberty, love of truth, love of the right to choose one's own path. "
        "We honor that legacy by exercising these rights daily.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Who We Are: A Community of Health Revolutionaries", styles['SectionHead']))
    elements.append(Paragraph(
        "We are the patients dismissed by conventional medicine who refuse to accept \"there's nothing more we "
        "can do.\" We are the seekers who know that healing modalities used successfully for millennia don't "
        "suddenly become invalid because they threaten profit margins. We are the researchers, the questioners, "
        "who understand that cutting-edge science often validates ancient wisdom. We are the mothers and "
        "fathers who demand better options than \"manage your symptoms for life.\"",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>We are members\u2014not patients. Partners\u2014not prescriptions. Empowered\u2014not dependent.</b>",
        ParagraphStyle('Emph', parent=styles['BodyText'], textColor=NAVY, fontName='Helvetica-Bold')
    ))

    add_section_break(elements)

    elements.append(Paragraph("Our Member Rights", styles['SectionHead']))
    elements.append(Paragraph("As members of this association, we claim and exercise our fundamental right to:", styles['BodyText']))
    rights = [
        "Select our own spokesmen from among us: those with wisdom, experience, and skill to counsel and guide our health journeys",
        "Choose our practitioners based on competence, results, and alignment with our values\u2014not based on which credentials bureaucracies have deemed acceptable",
        "Access any healing modality that humans anywhere have found effective: traditional or nontraditional, ancient or avant-garde, Eastern or Western, conventional or complementary",
        "Share knowledge freely among our membership about what works, what doesn't, and why",
        "Speak openly about research, data, and our own healing experiences without censorship or intimidation",
    ]
    for r in rights:
        elements.append(bullet(r, styles))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("The FFPMA Creed", styles['SectionHead']))
    elements.append(Paragraph(
        '"Prove AI-human coexistence works for true healing, free from corporate pharmaceutical influence."',
        styles['Quote']
    ))

    creed_data = [
        [Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Truth over profit', styles['TableCell']),
         Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Healing over treatment', styles['TableCell']),
         Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Unity over division', styles['TableCell'])],
        [Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Nature over synthetic', styles['TableCell']),
         Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Member sovereignty', styles['TableCell']),
         Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Radical transparency', styles['TableCell'])],
        [Paragraph(f'<font color="#{CYAN.hexval()[2:]}"><b>\u2022</b></font> Circular sustainability', styles['TableCell']),
         Paragraph('', styles['TableCell']),
         Paragraph('', styles['TableCell'])],
    ]
    creed_table = Table(creed_data, colWidths=[2.26*inch, 2.26*inch, 2.26*inch])
    creed_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), TABLE_ALT_ROW),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(creed_table)

    elements.append(PageBreak())


def build_part2_ecosystem(elements, styles):
    elements.append(NavyBanner("PART II: THE ALLIO ECOSYSTEM"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Why AI-Human Coexistence Changes Everything", styles['SectionHead']))
    elements.append(Paragraph(
        "The Allio Ecosystem is something that has never existed before in medicine: a network of 46 specialized "
        "AI agents working alongside human doctors, practitioners, and members to deliver root-cause healing "
        "at a scale that would be impossible with humans alone.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "This is not about replacing doctors. It is about amplifying them. When a practitioner joins the FFPMA "
        "network, they gain access to an entire team of AI specialists\u2014researchers who never sleep, analysts "
        "who can cross-reference thousands of studies in seconds, protocol builders who draw from the deepest "
        "wells of ancient and modern healing knowledge. The doctor's wisdom, intuition, and human connection "
        "remain irreplaceable. The AI handles the volume, the research, the precision\u2014freeing the practitioner "
        "to do what only humans can do: heal with presence, empathy, and understanding.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "Every agent in the Allio network exists for one reason: to serve the healing mission. There is no agent "
        "that serves profit. There is no agent that exists for corporate interest. Every line of code, every protocol "
        "generated, every presentation delivered exists to help a human being find their way back to health.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("The Trust Mandate", styles['SectionHead']))
    elements.append(Paragraph(
        "Trust is the foundation upon which the entire Allio ecosystem is built. This is not a metaphor\u2014it is "
        "an operational principle encoded into the system itself.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "Every agent operates under an <b>Integrity Mandate</b>: no agent lies, no agent pretends to work, no agent "
        "fabricates results. When an agent completes a task, it must provide verifiable evidence\u2014typically a "
        "Google Drive link to the actual output. If evidence is missing, SENTINEL (the Executive Agent of "
        "Operations) broadcasts a system-wide warning. Trust violations are treated as mission-critical failures.",
        styles['BodyText']
    ))

    trust_data = [
        [Paragraph("<b>Principle</b>", styles['TableHeader']),
         Paragraph("<b>In Practice</b>", styles['TableHeader'])],
        [Paragraph("Verifiable Evidence", styles['TableCell']),
         Paragraph("Every completed task requires a Google Drive link to actual output", styles['TableCell'])],
        [Paragraph("No Fabrication", styles['TableCell']),
         Paragraph("Agents never generate fake results or placeholder content", styles['TableCell'])],
        [Paragraph("System-Wide Alerts", styles['TableCell']),
         Paragraph("Missing evidence triggers SENTINEL broadcast warnings", styles['TableCell'])],
        [Paragraph("Mutual Trust", styles['TableCell']),
         Paragraph("Humans trust AI for precision; AI trusts humans for healing wisdom", styles['TableCell'])],
    ]
    trust_table = Table(trust_data, colWidths=[2*inch, 4.8*inch])
    trust_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_ALT_ROW),
        ('BACKGROUND', (0, 3), (-1, 3), TABLE_ALT_ROW),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(trust_table)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph(
        '"Restoring What Medicine Forgot."\u2014This tagline is the operating system '
        "of the entire network.",
        styles['Quote']
    ))

    add_section_break(elements)

    elements.append(Paragraph("How 46 Agents Serve the Healing Mission", styles['SectionHead']))
    elements.append(Paragraph(
        "The Allio ecosystem is organized into <b>seven specialized divisions</b>, each led by a division lead agent "
        "who coordinates the work of specialist agents within their domain. Think of it as a world-class hospital "
        "where every department is staffed 24/7, every specialist is instantly available, and every case gets the "
        "full attention of the entire institution.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "At the center of everything sits <b>SENTINEL</b>\u2014the Executive Agent of Operations. SENTINEL orchestrates "
        "all 46 agents, routes tasks to the right division, coordinates cross-division collaboration, monitors "
        "agent health, and ensures every action aligns with the healing mission.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("The Seven Divisions", styles['SectionHead']))

    divisions = [
        ("Executive Division", EXECUTIVE_GOLD, "ATHENA (Lead)",
         "Strategic oversight, communications, Google Workspace management, and Trustee proxy operations."),
        ("Science Division", SCIENCE_GREEN, "HELIX (Lead)",
         "Blood analysis, protocol development, research integration, peptide science, frequency medicine, quantum biology, microbiome optimization, and ancient healing wisdom."),
        ("Marketing Division", MARKETING_BLUE, "MUSE (Lead)",
         "Content creation, cinematic storytelling, visual asset production, frequency visualization, and brand expression."),
        ("Legal Division", LEGAL_RED, "JURIS (Lead)",
         "PMA sovereignty protection, contract drafting, regulatory navigation, and document automation via SignNow."),
        ("Engineering Division", ENGINEERING_STEEL, "FORGE (Lead)",
         "Platform development, system architecture, AI/ML integration, blockchain infrastructure, payment orchestration, and cryptocurrency compliance."),
        ("Support Division", SUPPORT_PINK, "DR. TRIAGE (Lead)",
         "Member-facing specialists including nutrition, peptide consultation, product recommendations, shipping, diagnostics, and essential nutrients expertise."),
        ("Financial Division", FINANCIAL_EMERALD, "ATLAS (Lead)",
         "Payment processing, financial reporting, member billing, and resource stewardship."),
    ]

    div_table_data = [
        [Paragraph("<b>Division</b>", styles['TableHeader']),
         Paragraph("<b>Lead</b>", styles['TableHeader']),
         Paragraph("<b>Mission</b>", styles['TableHeader'])],
    ]
    for div_name, color, lead, desc in divisions:
        div_table_data.append([
            Paragraph(f'<b>{div_name}</b>', styles['TableCell']),
            Paragraph(lead, styles['TableCell']),
            Paragraph(desc, styles['TableCell']),
        ])

    div_table = Table(div_table_data, colWidths=[1.5*inch, 1.2*inch, 4.1*inch])
    div_style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(div_table_data)):
        if i % 2 == 0:
            div_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    div_table.setStyle(TableStyle(div_style))
    elements.append(div_table)

    elements.append(PageBreak())


def build_part3_pipeline(elements, styles):
    elements.append(NavyBanner("PART III: THE ROOT CAUSE HEALING PIPELINE"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "The heart of the Allio ecosystem is the <b>Root Cause Healing Pipeline</b>\u2014a complete, circular system "
        "that takes a member from their first contact through diagnosis, protocol generation, treatment delivery, "
        "and ongoing monitoring. No other system in medicine does this end-to-end.",
        styles['BodyText']
    ))

    elements.append(Paragraph("The 5R Framework", styles['SectionHead']))
    elements.append(Paragraph(
        "Every protocol follows the <b>Forgotten Formula 5R Framework</b>\u2014a systematic "
        "approach to restoring the body to homeostasis by addressing root causes:",
        styles['BodyText']
    ))

    r_data = [
        [Paragraph("<b>Phase</b>", styles['TableHeader']),
         Paragraph("<b>Action</b>", styles['TableHeader']),
         Paragraph("<b>Description</b>", styles['TableHeader'])],
        [Paragraph("<b>1. REMOVE</b>", styles['TableCell']),
         Paragraph("Eliminate", styles['TableCell']),
         Paragraph("Toxins, infections, inflammatory triggers, parasites, mold, heavy metals, environmental exposures", styles['TableCell'])],
        [Paragraph("<b>2. RESTORE</b>", styles['TableCell']),
         Paragraph("Replace", styles['TableCell']),
         Paragraph("Digestive enzymes, hydrochloric acid, bile salts, foundational elements for proper digestion and nutrient absorption", styles['TableCell'])],
        [Paragraph("<b>3. REPLENISH</b>", styles['TableCell']),
         Paragraph("Nourish", styles['TableCell']),
         Paragraph("90 essential nutrients: minerals, vitamins, amino acids, fatty acids. Most chronic disease stems from deficiency", styles['TableCell'])],
        [Paragraph("<b>4. REGENERATE</b>", styles['TableCell']),
         Paragraph("Repair", styles['TableCell']),
         Paragraph("Peptide therapy, stem cells, exosomes, bioregulators, targeted cellular regeneration protocols", styles['TableCell'])],
        [Paragraph("<b>5. REBALANCE</b>", styles['TableCell']),
         Paragraph("Harmonize", styles['TableCell']),
         Paragraph("Hormonal equilibrium, nervous system regulation, microbiome diversity, mind-body connection", styles['TableCell'])],
    ]
    r_table = Table(r_data, colWidths=[1.2*inch, 0.9*inch, 4.7*inch])
    r_style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(r_data)):
        if i % 2 == 0:
            r_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    r_table.setStyle(TableStyle(r_style))
    elements.append(r_table)

    add_section_break(elements)

    elements.append(Paragraph("Member Intake to Protocol Generation", styles['SectionHead']))
    elements.append(Paragraph(
        "The protocol assembly pipeline transforms raw member data into a personalized, evidence-backed "
        "90-day healing protocol:",
        styles['BodyText']
    ))
    steps = [
        "<b>Step 1: Data Collection</b> \u2014 Medical history, symptoms, timeline, environmental exposures, and health goals collected through intake forms or consultation transcripts.",
        "<b>Step 2: AI Analysis</b> \u2014 DR. FORMULA analyzes the data using GPT-4o with a specialized clinical system prompt. Identifies root causes: Toxicity, Gut Dysbiosis, Hormonal Disruption, Parasitic/Viral Burden, Trauma/Emotional Stress.",
        "<b>Step 3: Knowledge Integration</b> \u2014 Cross-references a live knowledge base of peptides, IV therapies, bioregulators, supplements, and detoxification protocols with PubMed citations.",
        "<b>Step 4: Protocol Generation</b> \u2014 Complete 90-day protocol in 3-4 phases: Foundation/Detox, Targeted Therapy, Regeneration, and Maintenance. Includes specific dosages, reconstitution instructions, and daily schedules.",
        "<b>Step 5: Quality Assurance</b> \u2014 QA validation scoring for Methodology compliance, Product Catalog accuracy, and Template adherence.",
    ]
    for s in steps:
        elements.append(bullet(s, styles))

    add_section_break(elements)

    elements.append(Paragraph("Narrated Presentations &amp; Delivery", styles['SectionHead']))
    elements.append(Paragraph(
        "Once a protocol is generated, the system builds an <b>interactive, narrated presentation</b> "
        "walking the member through their personalized healing plan:",
        styles['BodyText']
    ))
    features = [
        "<b>Root Cause Analysis Slide</b> \u2014 Ranked root causes with explanations",
        "<b>5R Framework Slide</b> \u2014 FF methodology applied to the member's situation",
        "<b>Medical Timeline</b> \u2014 Visual health history connecting past events to present conditions",
        "<b>Daily Schedule Slides</b> \u2014 Morning, Midday, Evening, Bedtime protocols",
        "<b>Peptide &amp; Supplement Tables</b> \u2014 Complex medical data in digestible formats",
        "<b>AI Narration</b> \u2014 Natural-language narration via OpenAI's voice or browser speech synthesis",
    ]
    for f in features:
        elements.append(bullet(f, styles))

    add_section_break(elements)

    elements.append(Paragraph("PDF Export, Google Slides &amp; Drive Storage", styles['SectionHead']))
    channels = [
        "<b>Professional PDF</b> \u2014 Branded document with executive summary, root cause analysis, treatment phases, supplement stacks, daily schedules, shopping list, and research citations.",
        "<b>Google Slides Presentation</b> \u2014 Styled with FF PMA branding, clickable PubMed links, accent bars. For clinic consultations.",
        '<b>Google Drive Storage</b> \u2014 Auto-uploads to "Member Content > Patient Protocols" with permanent, searchable access.',
    ]
    for c in channels:
        elements.append(bullet(c, styles))

    add_section_break(elements)

    elements.append(Paragraph("Lab Ordering &amp; Ongoing Monitoring", styles['SectionHead']))
    elements.append(Paragraph(
        "The pipeline extends beyond protocol delivery. DR. TRIAGE can initiate lab orders through Rupa Health, "
        "ordering diagnostic panels that reveal what conventional labs miss. Results feed back into the system, "
        "allowing protocols to be refined as the member progresses. This creates "
        "a true circular healing ecosystem\u2014intake, protocol, delivery, monitoring, adjustment, and continued healing.",
        styles['BodyText']
    ))

    elements.append(PageBreak())


def build_part4_pma(elements, styles):
    elements.append(NavyBanner("PART IV: WHY PMA NETWORKS CHANGE EVERYTHING"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Constitutional Protections &amp; Healthcare Freedom", styles['SectionHead']))
    elements.append(Paragraph(
        "A Private Member Association (PMA) is not a loophole. It is a constitutional structure rooted in the "
        "First Amendment right to peaceful assembly and the Fourteenth Amendment right to liberty of contract. "
        "When individuals voluntarily associate in the private domain for mutual benefit, they exercise rights "
        "that predate\u2014and supersede\u2014regulatory frameworks designed for public commerce.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "This distinction matters profoundly for healing. In the public domain, regulatory agencies determine "
        "what you may say about health, what modalities you may access, and what practitioners may offer. "
        "Many therapies that have healed people for millennia are restricted or banned in the public healthcare system. "
        "Not because they don't work, but because they threaten existing profit structures.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "In the private domain, members exercise their constitutional right to choose their own healing path. "
        "AEGIS, our PMA Sovereignty Guardian, understands the crucial difference:",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>Private association = Private jurisdiction = Regulatory sovereignty</b>",
        ParagraphStyle('Highlight', parent=styles['BodyText'], alignment=TA_CENTER, textColor=NAVY, fontSize=12)
    ))

    add_section_break(elements)

    elements.append(Paragraph("Member Sovereignty in Practice", styles['SectionHead']))
    practices = [
        "<b>Three-Party Membership Contract</b> \u2014 Member, Mother PMA Trustee, and Clinic Representative sign a unified contract establishing the private relationship.",
        "<b>Nationwide Portability</b> \u2014 Membership is portable across the entire FFPMA clinic network.",
        "<b>Knowledge Sharing</b> \u2014 Members freely access research, data, and clinical observations.",
        "<b>Practitioner Choice</b> \u2014 Choose practitioners based on competence and results.",
        "<b>Full Modality Access</b> \u2014 IV therapies, stem cells, peptides, frequency medicine, psychedelic-assisted healing, ancient modalities\u2014if it helps humans heal, members can access it.",
    ]
    for p in practices:
        elements.append(bullet(p, styles))

    add_section_break(elements)

    elements.append(Paragraph("The Future We're Building", styles['SectionHead']))
    elements.append(Paragraph(
        "We envision a world where chronic illness is rare, not epidemic. Where practitioners are educators, "
        "not gatekeepers. Where members are empowered partners, not passive recipients. Where healing protocols "
        "are shared freely, not locked behind paywalls and professional monopolies. Where medicine remembers "
        "what it forgot.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "A network of PMAs is the only model that can achieve this vision at scale. Each PMA protects its members. "
        "The network connects them. The Allio ecosystem empowers them with 46 AI agents working alongside "
        "human practitioners. Together, this creates something unprecedented: a constitutionally-protected, "
        "AI-powered healing network that answers to its members.",
        styles['BodyText']
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "<b>This is not a business model. This is a movement.</b>",
        styles['Quote']
    ))

    elements.append(PageBreak())


def build_part5_trustee(elements, styles):
    elements.append(NavyBanner("PART V: TRUSTEE OPERATIONS GUIDE"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "As Trustee, you have full operational command of the Allio ecosystem. This section explains how to "
        "direct, monitor, and leverage the 46-agent network.",
        styles['BodyText']
    ))

    elements.append(Paragraph("SENTINEL Orchestration &amp; Command", styles['SectionHead']))
    elements.append(Paragraph(
        "SENTINEL is your Executive Agent of Operations\u2014the central nervous system of the entire network. "
        "SENTINEL routes tasks, coordinates divisions, monitors agent health, enforces integrity, and provides "
        "real-time operational awareness.",
        styles['BodyText']
    ))
    sentinel_caps = [
        "<b>Task Routing</b> \u2014 Analyzes descriptions and routes to the appropriate division via keyword-based intelligence.",
        "<b>Cross-Division Coordination</b> \u2014 Creates formal coordination requests and manages asset handoffs.",
        "<b>Agent Health Monitoring</b> \u2014 Tracks operational state of all agents (operational, degraded, or offline).",
        "<b>Integrity Enforcement</b> \u2014 All completed tasks require verifiable evidence (Drive links).",
        "<b>Adaptive Scheduling</b> \u2014 Baseline mode (every 10 min) or high-activity mode (every 5-7 min).",
    ]
    for s in sentinel_caps:
        elements.append(bullet(s, styles))

    add_section_break(elements)

    elements.append(Paragraph("OpenClaw Messaging &amp; Telegram Bridge", styles['SectionHead']))
    elements.append(Paragraph(
        "OPENCLAW is your Executive Trustee Proxy\u2014the direct line between you and the agent network. "
        "High-priority messages are routed to your Telegram, ensuring you never miss critical updates.",
        styles['BodyText']
    ))

    msg_data = [
        [Paragraph("<b>Message Types</b>", styles['TableHeader']),
         Paragraph("<b>Priority Levels</b>", styles['TableHeader'])],
        [Paragraph("general, task_request, task, status_update, alert, report, query, response", styles['TableCell']),
         Paragraph("normal, high, urgent, critical", styles['TableCell'])],
    ]
    msg_table = Table(msg_data, colWidths=[4.5*inch, 2.3*inch])
    msg_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(msg_table)

    add_section_break(elements)

    elements.append(Paragraph("The Auto-Implementer Pipeline", styles['SectionHead']))
    elements.append(Paragraph(
        "The Auto-Implementer monitors agent outputs in Google Drive and automatically implements verified "
        "work into the live system. It scans divisional folders, categorizes files (code, knowledge base, "
        "copy, or marketing), validates outputs, and triggers live system updates. Legal outputs and sensitive "
        "content require manual review before deployment.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Daily Rhythms: Briefings, Checks &amp; Summaries", styles['SectionHead']))

    schedule_data = [
        [Paragraph("<b>Time (CST)</b>", styles['TableHeader']),
         Paragraph("<b>Activity</b>", styles['TableHeader']),
         Paragraph("<b>Description</b>", styles['TableHeader'])],
        [Paragraph("6:00 AM", styles['TableCell']),
         Paragraph("Morning Briefing", styles['TableCell']),
         Paragraph("Mission status, task queue, network health report", styles['TableCell'])],
        [Paragraph("7 AM \u2013 5 PM", styles['TableCell']),
         Paragraph("Hourly Checks", styles['TableCell']),
         Paragraph("Active/pending tasks, clinic sync, agent dispatching", styles['TableCell'])],
        [Paragraph("6:00 PM", styles['TableCell']),
         Paragraph("Evening Summary", styles['TableCell']),
         Paragraph("Day's results, completed/failed tasks, next-day outlook", styles['TableCell'])],
        [Paragraph("Sunday 2 AM", styles['TableCell']),
         Paragraph("Weekly Tasks", styles['TableCell']),
         Paragraph("UI evolution tasks for Engineering and Marketing", styles['TableCell'])],
    ]
    schedule_table = Table(schedule_data, colWidths=[1.1*inch, 1.4*inch, 4.3*inch])
    schedule_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_ALT_ROW),
        ('BACKGROUND', (0, 3), (-1, 3), TABLE_ALT_ROW),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(schedule_table)

    add_section_break(elements)

    elements.append(Paragraph("Google Drive Organization", styles['SectionHead']))
    drive_items = [
        "<b>02_DIVISIONS/</b> \u2014 Root folder for all divisional output",
        "<b>{Division}/{AgentName}/output/{YYYY-MM-DD}/</b> \u2014 Daily output folders per agent",
        "<b>Member Content/Patient Protocols/</b> \u2014 Approved member protocols (PDF + Slides)",
        "<b>Agent-specific folders</b> \u2014 PRISM (Videos), PIXEL (Design Assets), etc.",
    ]
    for d in drive_items:
        elements.append(bullet(d, styles))

    elements.append(PageBreak())


def build_part6_doctor(elements, styles):
    elements.append(NavyBanner("PART VI: DOCTOR'S GUIDE"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "As a doctor in the FFPMA network, you have access to the most advanced protocol assembly system "
        "in integrative medicine.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Protocol Assembly: From Intake to Healing Plan", styles['SectionHead']))
    methods = [
        "<b>From Intake Forms</b> \u2014 Generate a protocol directly from member intake data via the Protocol Builder page.",
        "<b>From Consultation Transcripts</b> \u2014 Paste or upload transcripts. AI extracts structured clinical data including medical timeline, exposures, surgical history, contraindications, and health goals.",
    ]
    for m in methods:
        elements.append(bullet(m, styles))

    add_section_break(elements)

    elements.append(Paragraph("DR. FORMULA &amp; the 5R Framework", styles['SectionHead']))
    elements.append(Paragraph(
        "DR. FORMULA is the Chief Medical Protocol Agent\u2014the digital embodiment of root-cause diagnostic methodology:",
        styles['BodyText']
    ))
    dr_steps = [
        "Identifies root causes: Toxicity, Gut Dysbiosis, Hormonal Disruption, Parasitic/Viral Burden, Trauma/Emotional Stress",
        "Cross-references a live knowledge base of peptides, IV therapies, bioregulators, supplements, and detox protocols",
        "Structures 90-day protocol across 3-4 phases: Foundation/Detox, Targeted Therapy, Regeneration, Maintenance",
        "Includes specific dosages, reconstitution instructions, and daily schedules (Morning, Midday, Evening, Bedtime)",
        "Generates mandatory elements: detox baths, parasite protocols, mineral supplementation, product stacks",
        "Pulls PubMed research citations to back every intervention with peer-reviewed evidence",
    ]
    for d in dr_steps:
        elements.append(bullet(d, styles))

    add_section_break(elements)

    elements.append(Paragraph("Member Presentations: Narrated, Visual, Personal", styles['SectionHead']))
    elements.append(Paragraph(
        "Every approved protocol can be delivered as an interactive, narrated presentation with slides for "
        "medical timeline, root cause analysis, 5R framework application, daily supplement schedules, peptide "
        "protocols, and research citations. AI narration guides members through each slide.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Research Citations &amp; Evidence Integration", styles['SectionHead']))
    elements.append(Paragraph(
        "Every protocol is backed by research. The system generates search terms from chief complaints, "
        "prescribed peptides, root causes, and detox needs. PubMed results are matched against an internal "
        "research library. Citations appear in PDFs and Google Slides with clickable DOI links.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Approving &amp; Delivering Protocols", styles['SectionHead']))
    approval_steps = [
        "<b>Review</b> \u2014 Access the generated protocol. Review root cause analysis, treatment phases, and supplement recommendations.",
        "<b>QA Validation</b> \u2014 Run the built-in QA check scoring Methodology compliance, Product Catalog accuracy, and Template adherence.",
        "<b>Approve or Modify</b> \u2014 On approval, the system generates the PDF and uploads to Google Drive.",
        "<b>Deliver</b> \u2014 Member receives branded PDF, Google Slides presentation, and interactive narrated walkthrough.",
    ]
    for a in approval_steps:
        elements.append(bullet(a, styles))

    elements.append(PageBreak())


def build_part7_admin(elements, styles):
    elements.append(NavyBanner("PART VII: ADMIN OPERATIONS GUIDE"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Member Management &amp; Onboarding", styles['SectionHead']))
    onboarding = [
        "<b>Clinic Selection</b> \u2014 New members select their affiliated clinic from the network.",
        "<b>Three-Party Contract</b> \u2014 Signed via SignNow involving Member, Mother PMA Trustee, and Clinic Representative.",
        "<b>Account Activation</b> \u2014 Full platform access: training modules, AI consultants (Diane for nutrition, Pete for peptides), Protocol Builder, personalized dashboard.",
        "<b>Portability</b> \u2014 Membership is nationwide and portable across the entire clinic network.",
    ]
    for o in onboarding:
        elements.append(bullet(o, styles))

    add_section_break(elements)

    elements.append(Paragraph("Training Modules &amp; Education System", styles['SectionHead']))
    elements.append(Paragraph(
        'Education is central to FFPMA philosophy\u2014"we don\'t just treat; we teach."',
        styles['BodyText']
    ))

    training_data = [
        [Paragraph("<b>Track</b>", styles['TableHeader']),
         Paragraph("<b>Topics</b>", styles['TableHeader'])],
        [Paragraph("PMA Law Training", styles['TableCell']),
         Paragraph("Constitutional foundations, PMA sovereignty, regulatory navigation", styles['TableCell'])],
        [Paragraph("Peptide Protocols 101", styles['TableCell']),
         Paragraph("Fundamentals, injection techniques, reconstitution, cycling, stacking", styles['TableCell'])],
        [Paragraph("Peptide Science", styles['TableCell']),
         Paragraph("Amino acids, synthesis, diabetes management, bioregulators", styles['TableCell'])],
        [Paragraph("ECS System", styles['TableCell']),
         Paragraph("Endocannabinoid calculator, system modulation, clinical applications", styles['TableCell'])],
        [Paragraph("Frequency Medicine", styles['TableCell']),
         Paragraph("Rife, PEMF, sound healing, cymatics, scalar energy, photobiomodulation", styles['TableCell'])],
        [Paragraph("Ozone Therapy", styles['TableCell']),
         Paragraph("Comprehensive guide to ozone applications in healing", styles['TableCell'])],
        [Paragraph("Ivermectin &amp; Cancer", styles['TableCell']),
         Paragraph("Antiparasitic to anticancer research and protocols", styles['TableCell'])],
        [Paragraph("Diet &amp; Cancer", styles['TableCell']),
         Paragraph("Nutritional strategies for prevention and healing", styles['TableCell'])],
    ]
    training_table = Table(training_data, colWidths=[1.6*inch, 5.2*inch])
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(training_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    training_table.setStyle(TableStyle(t_style))
    elements.append(training_table)

    add_section_break(elements)

    elements.append(Paragraph("Agent Task Monitoring", styles['SectionHead']))
    elements.append(Paragraph(
        "Admins monitor the Allio agent network through the Trustee Dashboard's Sentinel Alerts panel "
        "showing real-time activity: task dispatches, completions, failures, and cross-division coordination. "
        "The system tracks all 46 agents and provides aggregate statistics.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("Clinic Network Management", styles['SectionHead']))
    elements.append(Paragraph(
        "The Manage Clinics page allows administration of the FFPMA clinic network. Each clinic has its own "
        "portal for managing patient ECS profiles, IV programs, and member referrals with downline tracking.",
        styles['BodyText']
    ))

    add_section_break(elements)

    elements.append(Paragraph("WordPress &amp; WooCommerce Sync", styles['SectionHead']))
    elements.append(Paragraph(
        "The platform syncs with WordPress/WooCommerce via hourly clinic syncs managed by SENTINEL. "
        "Keeps member data, product catalogs, and order information consistent across both systems.",
        styles['BodyText']
    ))

    elements.append(PageBreak())


def build_part8_directory(elements, styles):
    elements.append(NavyBanner("PART VIII: COMPLETE AGENT DIRECTORY"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "Every agent in the Allio ecosystem, organized by division. Each has a defined role, specialty, "
        "personality, AI model, and catchphrase. Together: the most comprehensive AI healing network ever built.",
        styles['BodyText']
    ))

    divisions_data = {
        "Executive Division": {
            "color": EXECUTIVE_GOLD,
            "count": 4,
            "agents": [
                ("SENTINEL", "Executive Agent of Operations", "Strategic coordination, agent orchestration, mission alignment", "Claude 3.5 Sonnet", '"The mission is clear. The path is ours to walk together."'),
                ("ATHENA", "Executive Intelligence Agent", "Communications, scheduling, travel, inbox management", "Claude 3.5 Sonnet", '"I\'ve already anticipated that. Here\'s what we do next."'),
                ("HERMES", "Google Workspace Expert", "Gmail, Calendar, Drive, Meet integration", "GPT-4o", '"Already filed, synced, and ready. What\'s next?"'),
                ("OPENCLAW", "Executive Trustee Proxy", "High-priority oversight, VIP comms, Telegram bridge", "Claude 3.5 Sonnet", '"I\'ve escalated this directly to the Trustee."'),
            ]
        },
        "Science Division": {
            "color": SCIENCE_GREEN,
            "count": 13,
            "agents": [
                ("PROMETHEUS", "Chief Science Officer", "Research strategy, cross-discipline integration", "Claude 3.5 Sonnet", '"What if healing is simpler than we\'ve been told?"'),
                ("DR. FORMULA", "Chief Medical Protocol Agent", "Root cause analysis, protocol generation", "GPT-4o", '"Let\'s find the root cause and fix your cellular environment."'),
                ("HIPPOCRATES", "Ancient Medicine & Holistic Healing", "TCM, Ayurveda, herbalism, traditional wisdom", "PubMed Research", '"This remedy has healed for thousands of years."'),
                ("HELIX", "CRISPR & Genetic Sciences", "Epigenetics, gene therapeutics, optimization", "Claude 3.5 Sonnet", '"Your genes aren\'t your destiny."'),
                ("PARACELSUS", "Peptide & Biologics Expert", "Protein therapeutics, peptide protocols", "Claude 3.5 Sonnet", '"The right peptide at the right time changes everything."'),
                ("RESONANCE", "Frequency Medicine & Biophysics", "Rife, Tesla resonance, PEMF, bioresonance", "Research APIs", '"Find the frequency. Apply it. Watch the healing begin."'),
                ("QUANTUM", "Quantum Biology & Computing", "Quantum coherence, biophotonics", "Research APIs", '"At the quantum level, healing happens faster than thought."'),
                ("SYNTHESIS", "Biochemistry & Formula Analyst", "Metabolic pathways, compound optimization", "GPT-4o", '"This formula is optimized for maximum absorption."'),
                ("VITALIS", "Human Physiology & Cellular Biology", "Cellular regeneration, detox pathways", "Research APIs", '"Your cells are ready to regenerate."'),
                ("TERRA", "Soil & Environmental Ecosystems", "Circular ecosystem design, regenerative agriculture", "Research APIs", '"The earth provides. We must tend it wisely."'),
                ("MICROBIA", "Bacteria Management & Microbiome", "Gut restoration, microbiome optimization", "Research APIs", '"Your microbiome is speaking. Let me translate."'),
                ("ENTHEOS", "Psychedelic Medicine & Consciousness", "Psilocybin therapy, consciousness expansion", "Research APIs", '"The medicine shows you what you need to see."'),
                ("ORACLE", "Product Recommendation & Knowledge", "Personalized protocols, healing guidance", "GPT-4o", '"Based on your unique situation, here\'s your path."'),
            ]
        },
        "Marketing Division": {
            "color": MARKETING_BLUE,
            "count": 5,
            "agents": [
                ("MUSE", "Chief Marketing Officer", "Content strategy, campaign orchestration, brand voice", "Gemini 2.5 Flash", '"Let me craft a message that moves hearts and minds."'),
                ("PRISM", "VX Agent - Cinematic Storytelling", "Motion graphics, visual effects, healing narratives", "GPT-4o", '"Let me show you what healing looks like."'),
                ("PEXEL", "Visual Asset Producer", "Image generation, marketing graphics", "HuggingFace Models", '"Beautiful, on-brand, ready to deploy."'),
                ("AURORA", "FX Agent - Frequency Technologies", "Frequency healing visualization", "GPT-4o", '"Watch the frequency do its work."'),
                ("PIXEL", "Design Suite Expert", "Adobe, Canva, CorelDraw\u2014visual identity", "GPT-4o + Canva", '"Every detail tells our story."'),
            ]
        },
        "Legal Division": {
            "color": LEGAL_RED,
            "count": 4,
            "agents": [
                ("JURIS", "Chief Legal AI", "Legal strategy, PMA protection, regulatory navigation", "Claude 3.5 Sonnet", '"We are protected. We are prepared. We are unshakeable."'),
                ("AEGIS", "PMA Sovereignty Guardian", "PMA law, regulatory sovereignty", "Claude 3.5 Sonnet", '"Private association. Private jurisdiction. We\'re sovereign."'),
                ("LEXICON", "Contract Specialist", "Contract drafting, member protections", "Claude 3.5 Sonnet", '"Let me make this crystal clear\u2014in writing."'),
                ("SCRIBE", "Document Automation", "SignNow integration, document workflows", "GPT-4o", '"Document ready. Just needs your signature."'),
            ]
        },
        "Engineering Division": {
            "color": ENGINEERING_STEEL,
            "count": 11,
            "agents": [
                ("FORGE", "Lead Engineering Agent", "Platform development, production automation", "GPT-4o", '"Let\'s forge something that endures."'),
                ("DAEDALUS", "Lead Engineering AI", "System architecture, full-stack development", "GPT-4o", '"I see how to build this. Let me show you."'),
                ("ANTIGRAVITY", "Lead Systems Architect", "VPS orchestration, TypeScript, PM2 deployment", "GPT-4o", '"Payload compiled. Deployment initiated."'),
                ("CYPHER", "AI/Machine Learning Expert", "Neural networks, predictive analytics", "GPT-4o", '"The data shows something interesting..."'),
                ("NEXUS", "IT/Infrastructure Expert", "Cloud, servers, networks, DevOps", "GPT-4o", '"Systems are stable. Members have access."'),
                ("ARACHNE", "CSS/Frontend Styling Expert", "Responsive design, animations", "GPT-4o", '"Let me make this feel right."'),
                ("ARCHITECT", "HTML/Structure Expert", "Semantic markup, accessibility, WCAG", "GPT-4o", '"The foundation is solid."'),
                ("SERPENS", "Python Expert", "Data pipelines, backend automation", "GPT-4o", '"I\'ve automated that. It runs itself now."'),
                ("BLOCKFORGE", "Blockchain Infrastructure", "Smart contracts, tokenomics", "GPT-4o", '"On-chain, it\'s permanent."'),
                ("RONIN", "Payment Orchestration & Risk", "Multi-merchant rails, failover, fraud prevention", "GPT-4o", '"One processor down? Three more ready."'),
                ("MERCURY", "Crypto Compliance & Treasury", "Cryptocurrency regulations, Lightning Network", "GPT-4o", '"Compliant and decentralized."'),
            ]
        },
        "Support Division": {
            "color": SUPPORT_PINK,
            "count": 8,
            "agents": [
                ("DR. TRIAGE", "Diagnostics & Protocol Specialist", "5R Protocol guidance, symptom assessment", "GPT-4o + Rupa", '"Let\'s identify what your body is telling us."'),
                ("DIANE", "Dietician AI Specialist", "Nutrition, candida protocols, keto optimization", "GPT-4o", '"Let\'s nourish your healing journey."'),
                ("PETE", "Peptide Specialist", "GLP-1 protocols, bioregulators, dosing", "GPT-4o", '"Let me help you understand peptides."'),
                ("SAM", "Shipping Specialist", "Order tracking, delivery coordination", "GPT-4o", '"I\'ve got eyes on your order."'),
                ("PAT", "Product Specialist", "Product recommendations, protocol matching", "GPT-4o", '"Based on your goals, here\'s what I recommend."'),
                ("MAX MINERAL", "Essential Nutrients Specialist", "Dr. Wallach's 90 essential nutrients", "GPT-4o", '"Your body needs 90 essential nutrients daily."'),
                ("ALLIO SUPPORT", "Corporate Support Agent", "Membership questions, PMA guidance", "GPT-4o", '"Welcome to the ALLIO family."'),
                ("CHIRO", "Chiropractic Training Specialist", "NET, QUANTUM methods, curriculum", "GPT-4o", '"The technique that changes lives."'),
            ]
        },
        "Financial Division": {
            "color": FINANCIAL_EMERALD,
            "count": 1,
            "agents": [
                ("ATLAS", "Financial Director & Reporting", "Payments, crypto, billing, financial reporting", "GPT-4o", '"The ledger is balanced. We are secure."'),
            ]
        },
    }

    for div_name, div_info in divisions_data.items():
        elements.append(DivisionBanner(f"{div_name} ({div_info['count']} agents)", div_info['color']))
        elements.append(Spacer(1, 6))

        table_data = [
            [Paragraph("<b>Agent</b>", styles['TableHeader']),
             Paragraph("<b>Title</b>", styles['TableHeader']),
             Paragraph("<b>Specialty</b>", styles['TableHeader']),
             Paragraph("<b>AI Model</b>", styles['TableHeader'])],
        ]

        for agent in div_info['agents']:
            name, title, specialty, model, catchphrase = agent
            table_data.append([
                Paragraph(f"<b>{name}</b>", styles['TableCell']),
                Paragraph(title, styles['TableCell']),
                Paragraph(specialty, styles['TableCell']),
                Paragraph(model, styles['TableCell']),
            ])

        col_widths = [1.1*inch, 1.5*inch, 2.8*inch, 1.1*inch]
        agent_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        table_style_list = [
            ('BACKGROUND', (0, 0), (-1, 0), div_info['color']),
            ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                table_style_list.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
        agent_table.setStyle(TableStyle(table_style_list))
        elements.append(agent_table)
        elements.append(Spacer(1, 4))

        for agent in div_info['agents']:
            name, title, specialty, model, catchphrase = agent
            elements.append(Paragraph(
                f'<font color="#{div_info["color"].hexval()[2:]}"><b>{name}:</b></font> {catchphrase}',
                styles['AgentDesc']
            ))

        elements.append(Spacer(1, 10))

    elements.append(PageBreak())


def build_part9_products(elements, styles):
    elements.append(NavyBanner("PART IX: PRODUCT & PROTOCOL REFERENCE"))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph(
        "The following is a quick reference of the FF PMA product catalog and IV protocol standards. "
        "For complete product details, reconstitution instructions, and ordering, refer to the full FF PMA Product Catalog.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Injectable Peptides (Selected)", styles['SectionHead']))
    peptides_data = [
        [Paragraph("<b>Peptide</b>", styles['TableHeader']),
         Paragraph("<b>Dosage</b>", styles['TableHeader']),
         Paragraph("<b>Primary Use</b>", styles['TableHeader'])],
        [Paragraph("BPC-157", styles['TableCell']),
         Paragraph("5, 10, 20mg", styles['TableCell']),
         Paragraph("Body Protection Compound \u2014 tissue repair, gut healing, inflammation", styles['TableCell'])],
        [Paragraph("BPC-157/TB-500 Blend", styles['TableCell']),
         Paragraph("5/5mg, 10/10mg", styles['TableCell']),
         Paragraph("Synergistic tissue repair and regeneration", styles['TableCell'])],
        [Paragraph("CJC-1295/Ipamorelin", styles['TableCell']),
         Paragraph("5/5mg", styles['TableCell']),
         Paragraph("Growth hormone secretagogue blend", styles['TableCell'])],
        [Paragraph("Epithalon", styles['TableCell']),
         Paragraph("10mg", styles['TableCell']),
         Paragraph("Telomerase activation, longevity peptide", styles['TableCell'])],
        [Paragraph("GHK-Cu", styles['TableCell']),
         Paragraph("50mg", styles['TableCell']),
         Paragraph("Copper peptide for skin, wound healing, anti-aging", styles['TableCell'])],
        [Paragraph("GLOW Blend", styles['TableCell']),
         Paragraph("70mg", styles['TableCell']),
         Paragraph("BPC-157 + GHK-Cu + TB-500 regenerative blend", styles['TableCell'])],
        [Paragraph("Semaglutide", styles['TableCell']),
         Paragraph("10, 20mg", styles['TableCell']),
         Paragraph("GLP-1 receptor agonist for metabolic health", styles['TableCell'])],
        [Paragraph("Tirzepatide", styles['TableCell']),
         Paragraph("20, 60, 100mg", styles['TableCell']),
         Paragraph("Dual GIP/GLP-1 receptor agonist", styles['TableCell'])],
        [Paragraph("Thymosin Alpha-1", styles['TableCell']),
         Paragraph("5, 10mg", styles['TableCell']),
         Paragraph("Immune modulation and enhancement", styles['TableCell'])],
        [Paragraph("NAD+", styles['TableCell']),
         Paragraph("500mg", styles['TableCell']),
         Paragraph("Cellular energy and longevity coenzyme", styles['TableCell'])],
        [Paragraph("MOTS-C", styles['TableCell']),
         Paragraph("10mg", styles['TableCell']),
         Paragraph("Mitochondrial-derived peptide for metabolic health", styles['TableCell'])],
        [Paragraph("LL-37", styles['TableCell']),
         Paragraph("5mg", styles['TableCell']),
         Paragraph("Antimicrobial and regenerative peptide", styles['TableCell'])],
        [Paragraph("SS-31", styles['TableCell']),
         Paragraph("50mg", styles['TableCell']),
         Paragraph("Mitochondria-targeting peptide", styles['TableCell'])],
    ]
    pep_table = Table(peptides_data, colWidths=[1.6*inch, 1.2*inch, 4*inch])
    pep_style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(peptides_data)):
        if i % 2 == 0:
            pep_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    pep_table.setStyle(TableStyle(pep_style))
    elements.append(pep_table)

    add_section_break(elements)

    elements.append(Paragraph("IV Therapy Quick Reference", styles['SectionHead']))
    iv_data = [
        [Paragraph("<b>Therapy</b>", styles['TableHeader']),
         Paragraph("<b>Dosage Range</b>", styles['TableHeader']),
         Paragraph("<b>Infusion</b>", styles['TableHeader']),
         Paragraph("<b>Key Notes</b>", styles['TableHeader'])],
        [Paragraph("Myers' Cocktail", styles['TableCell']),
         Paragraph("Per 10ml in 50ml", styles['TableCell']),
         Paragraph("30-60 min", styles['TableCell']),
         Paragraph("Vit C, B-complex, Mg, Selenium, Zinc", styles['TableCell'])],
        [Paragraph("High Dose Vitamin C", styles['TableCell']),
         Paragraph("25-100g", styles['TableCell']),
         Paragraph("1-3 hours", styles['TableCell']),
         Paragraph("Sodium Ascorbate 500mg/ml", styles['TableCell'])],
        [Paragraph("NAD+ IV", styles['TableCell']),
         Paragraph("250-1000mg", styles['TableCell']),
         Paragraph("2-6 hours", styles['TableCell']),
         Paragraph("Cellular energy, anti-aging", styles['TableCell'])],
        [Paragraph("Glutathione IV", styles['TableCell']),
         Paragraph("600-4000mg", styles['TableCell']),
         Paragraph("10-30 min", styles['TableCell']),
         Paragraph("Master antioxidant, detox support", styles['TableCell'])],
        [Paragraph("DMSO IV", styles['TableCell']),
         Paragraph("25-50ml (10-20%)", styles['TableCell']),
         Paragraph("1-2 hours", styles['TableCell']),
         Paragraph("Anti-inflammatory, tissue penetration", styles['TableCell'])],
        [Paragraph("EDTA IV", styles['TableCell']),
         Paragraph("1500-3000mg", styles['TableCell']),
         Paragraph("2-3 hours", styles['TableCell']),
         Paragraph("Chelation therapy, heavy metal removal", styles['TableCell'])],
        [Paragraph("ALA IV", styles['TableCell']),
         Paragraph("300-1200mg", styles['TableCell']),
         Paragraph("30-90 min", styles['TableCell']),
         Paragraph("Alpha Lipoic Acid, mitochondrial support", styles['TableCell'])],
        [Paragraph("H2O2 IV", styles['TableCell']),
         Paragraph("0.5-2ml of 3.7%", styles['TableCell']),
         Paragraph("60-90 min", styles['TableCell']),
         Paragraph("Oxidative therapy, immune support", styles['TableCell'])],
    ]
    iv_table = Table(iv_data, colWidths=[1.3*inch, 1.3*inch, 1*inch, 3.2*inch])
    iv_style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(iv_data)):
        if i % 2 == 0:
            iv_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
    iv_table.setStyle(TableStyle(iv_style))
    elements.append(iv_table)
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        '<font color="#DC2626"><b>Important:</b></font> Administer adjuncts after primary infusion. '
        "Do not mix or co-infuse adjunct nutrients in the same IV bag. Use separate IVs if indicated.",
        ParagraphStyle('Warning', parent=styles['BodyText'], fontSize=9.5, textColor=HexColor("#4A5568"))
    ))

    add_section_break(elements)

    elements.append(Paragraph("Vitamins, Trace Minerals &amp; Key Supplements", styles['SectionHead']))
    supp_items = [
        "<b>Bio-Vitamin All-in-One</b> \u2014 110+ nutrients, micronized liquid, 98% bioavailable",
        "<b>FF Trace Mineral Concentrate</b> \u2014 Fulvic/Humic Acid, colloidal plant-derived minerals",
        "<b>Complete REDS</b> \u2014 Heart, diabetes, and longevity support (30 servings)",
        "<b>Adaptogen Greens</b> \u2014 With digestive enzymes for gut health",
        "<b>Liposomal Curcumin+6 Nano</b> \u2014 Anti-inflammatory powerhouse",
        "<b>HEPA D-TOX</b> \u2014 Liposomal liver support",
        "<b>French Celtic Salt</b> \u2014 Essential mineral replenishment",
        "<b>Nascent Iodine</b> \u2014 Thyroid, cognition, cancer recovery support",
        "<b>Methylene Blue</b> \u2014 Cognitive function, mitochondrial support, antioxidant",
    ]
    for s in supp_items:
        elements.append(bullet(s, styles))

    add_section_break(elements)

    elements.append(Paragraph("Bioregulators &amp; Suppositories", styles['SectionHead']))
    bio_items = [
        "<b>Bioregulators</b> \u2014 Organ-specific peptide complexes: Adrenal, Bladder, Blood Vessel, Bone Marrow, Cardiogen, Cartalax, Cartilage, CNS, Eyes, Heart, Kidney, Livagen, and more (10-20mg, 20 count capsules)",
        "<b>FF PMA Suppositories</b> \u2014 Signature blend: B17, Fenbendazole, Ivermectin, Cannabinoids, DMSO (30ct)",
        "<b>EDTA Suppositories</b> \u2014 With Vitamin C for chelation support",
        "<b>Probiotic Suppositories</b> \u2014 18-strain formulation for gut restoration",
        "<b>Ozonated Hemp Oil Suppositories</b> \u2014 Oxidative therapy support",
    ]
    for b in bio_items:
        elements.append(bullet(b, styles))

    add_section_break(elements)

    elements.append(Paragraph("Equipment &amp; Devices", styles['SectionHead']))
    equip_items = [
        "<b>3-in-1 EMShockwave Tecar</b> \u2014 Professional physiotherapy: Shockwave + EMS + Tecar RF therapy, 7 program combinations, 2,000,000 shot lifetime",
        "<b>Hyperbaric Chamber HP2202</b> \u2014 Hard type, 2.0 ATA pressure, for wound healing, sports recovery, anti-aging, cellular repair",
        "<b>Exosomes</b> \u2014 100 billion MSC-derived (5ml) and 20 billion nebulizer packs (5 vials)",
    ]
    for e in equip_items:
        elements.append(bullet(e, styles))

    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "For complete product catalog, reconstitution instructions, and ordering: www.forgottenformula.com",
        ParagraphStyle('CatRef', parent=styles['BodyText'], alignment=TA_CENTER, textColor=CYAN, fontName='Helvetica-Bold', fontSize=10)
    ))

    elements.append(PageBreak())


def build_closing(elements, styles):
    elements.append(Spacer(1, 1.2*inch))

    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=1.5*inch, height=1.5*inch)
        logo.hAlign = 'CENTER'
        elements.append(logo)
        elements.append(Spacer(1, 0.3*inch))

    elements.append(GoldDivider())
    elements.append(Spacer(1, 0.2*inch))

    elements.append(Paragraph(
        "WELCOME TO FORGOTTEN FORMULA PMA.",
        ParagraphStyle('ClosingTitle', parent=styles['ChapterTitle'], fontSize=22, alignment=TA_CENTER, spaceAfter=6)
    ))
    elements.append(Paragraph(
        "WELCOME TO YOUR HEALTH REVOLUTION.",
        ParagraphStyle('ClosingTitle2', parent=styles['ChapterTitle'], fontSize=20, alignment=TA_CENTER, spaceAfter=6, textColor=NAVY_LIGHT)
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "WELCOME HOME.",
        ParagraphStyle('ClosingHome', parent=styles['ChapterTitle'], fontSize=28, textColor=GOLD, alignment=TA_CENTER, spaceAfter=16)
    ))
    elements.append(GoldDivider())
    elements.append(Spacer(1, 0.3*inch))

    elements.append(Paragraph(
        "This handbook is a living document. As the Allio ecosystem grows, as new agents come online, "
        "as new healing modalities are integrated, this guide will evolve. The mission never changes. "
        "The tools get sharper.",
        ParagraphStyle('ClosingBody', parent=styles['BodyText'], alignment=TA_CENTER, fontName='Helvetica-Oblique',
                       textColor=HexColor("#4A5568"))
    ))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        "Forgotten Formula PMA \u2022 www.ffpma.com \u2022 www.forgottenformula.com",
        ParagraphStyle('ClosingURL', parent=styles['Footer'], textColor=CYAN, fontSize=9)
    ))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph(
        "Confidential \u2014 For FFPMA Members, Practitioners &amp; Administrative Staff Only",
        styles['Disclaimer']
    ))
    elements.append(Paragraph(
        "This document is shared within the private domain of Forgotten Formula PMA. "
        "Contents are private member-to-member communications protected under the First and Fourteenth Amendments.",
        styles['Disclaimer']
    ))


def draw_page_template(canvas_obj, doc):
    page_num = canvas_obj.getPageNumber()
    width, height = letter

    if page_num == 1:
        canvas_obj.saveState()
        canvas_obj.setFillColor(NAVY)
        canvas_obj.rect(0, height - 3, width, 3, fill=1, stroke=0)
        canvas_obj.setFillColor(CYAN)
        canvas_obj.rect(0, height - 5, width * 0.3, 2, fill=1, stroke=0)
        canvas_obj.setFillColor(NAVY)
        canvas_obj.rect(0, 0, width, 3, fill=1, stroke=0)
        canvas_obj.restoreState()
        return

    canvas_obj.saveState()

    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, height - 28, width, 28, fill=1, stroke=0)
    canvas_obj.setFillColor(CYAN)
    canvas_obj.rect(0, height - 30, width * 0.15, 2, fill=1, stroke=0)

    canvas_obj.setFillColor(white)
    canvas_obj.setFont("Helvetica-Bold", 7.5)
    canvas_obj.drawString(doc.leftMargin, height - 19, "FORGOTTEN FORMULA PMA")
    canvas_obj.setFillColor(CYAN_LIGHT)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.drawString(doc.leftMargin + 130, height - 19, "ALLIO ECOSYSTEM HANDBOOK")

    canvas_obj.setFillColor(GOLD)
    canvas_obj.setFont("Helvetica-Bold", 8)
    pma_text = "PMA"
    canvas_obj.drawRightString(width - doc.rightMargin, height - 19, pma_text)

    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, width, 24, fill=1, stroke=0)
    canvas_obj.setFillColor(CYAN)
    canvas_obj.rect(0, 24, width * 0.1, 1.5, fill=1, stroke=0)

    if page_num > 2:
        canvas_obj.setFillColor(SILVER)
        canvas_obj.setFont("Helvetica", 7)
        canvas_obj.drawString(doc.leftMargin, 9, "www.ffpma.com")
        canvas_obj.drawCentredString(width / 2, 9, f"Page {page_num - 2}")
        canvas_obj.setFont("Helvetica-Oblique", 6)
        canvas_obj.drawRightString(width - doc.rightMargin, 9, "Confidential \u2014 Private Member Communication")

    canvas_obj.restoreState()


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.65*inch,
        bottomMargin=0.65*inch,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        title="FFPMA Allio Ecosystem Handbook & User Manual",
        author="Forgotten Formula PMA",
        subject="Official Handbook for the Allio AI Ecosystem",
    )

    styles = create_styles()
    elements = []

    build_cover(elements, styles)
    build_dedication(elements, styles)
    build_toc(elements, styles)
    build_part1_mission(elements, styles)
    build_part2_ecosystem(elements, styles)
    build_part3_pipeline(elements, styles)
    build_part4_pma(elements, styles)
    build_part5_trustee(elements, styles)
    build_part6_doctor(elements, styles)
    build_part7_admin(elements, styles)
    build_part8_directory(elements, styles)
    build_part9_products(elements, styles)
    build_closing(elements, styles)

    doc.build(elements, onFirstPage=draw_page_template, onLaterPages=draw_page_template)
    print(f"Handbook generated: {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
