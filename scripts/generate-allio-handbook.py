#!/usr/bin/env python3
"""
FFPMA Allio Ecosystem Handbook & User Manual
Official handbook for the Forgotten Formula Private Member Association
Generates a professional PDF document for Doctors, Admins, and the Trustee
"""

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT

BRAND_PURPLE = HexColor("#4A1A8A")
BRAND_GOLD = HexColor("#D4A843")
BRAND_DARK = HexColor("#1A1A2E")
BRAND_LIGHT = HexColor("#F5F0FF")
ACCENT_GREEN = HexColor("#2D8A4E")
ACCENT_BLUE = HexColor("#2563EB")
ACCENT_RED = HexColor("#DC2626")
SECTION_BG = HexColor("#F8F6FF")
TABLE_HEADER_BG = HexColor("#4A1A8A")
TABLE_ALT_ROW = HexColor("#F5F0FF")
LIGHT_GRAY = HexColor("#E5E7EB")

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "attached_assets", "FFPMA_Allio_Ecosystem_Handbook.pdf")

def create_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        'CoverTitle', parent=styles['Title'],
        fontSize=36, leading=44, textColor=BRAND_PURPLE,
        alignment=TA_CENTER, spaceAfter=12, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontSize=16, leading=22, textColor=BRAND_GOLD,
        alignment=TA_CENTER, spaceAfter=8, fontName='Helvetica-Oblique'
    ))
    styles.add(ParagraphStyle(
        'CoverMotto', parent=styles['Normal'],
        fontSize=13, leading=18, textColor=BRAND_DARK,
        alignment=TA_CENTER, spaceAfter=6, fontName='Helvetica-BoldOblique'
    ))
    styles.add(ParagraphStyle(
        'ChapterTitle', parent=styles['Title'],
        fontSize=28, leading=36, textColor=BRAND_PURPLE,
        spaceBefore=0, spaceAfter=18, fontName='Helvetica-Bold',
        alignment=TA_LEFT
    ))
    styles.add(ParagraphStyle(
        'SectionHead', parent=styles['Heading2'],
        fontSize=18, leading=24, textColor=BRAND_PURPLE,
        spaceBefore=18, spaceAfter=10, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        'SubSection', parent=styles['Heading3'],
        fontSize=14, leading=19, textColor=BRAND_DARK,
        spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles['BodyText'].fontSize = 11
    styles['BodyText'].leading = 16
    styles['BodyText'].textColor = BRAND_DARK
    styles['BodyText'].alignment = TA_JUSTIFY
    styles['BodyText'].spaceAfter = 8
    styles['BodyText'].fontName = 'Helvetica'
    styles.add(ParagraphStyle(
        'Quote', parent=styles['Normal'],
        fontSize=12, leading=18, textColor=BRAND_PURPLE,
        alignment=TA_CENTER, spaceAfter=12, fontName='Helvetica-BoldOblique',
        leftIndent=36, rightIndent=36
    ))
    styles.add(ParagraphStyle(
        'BulletItem', parent=styles['Normal'],
        fontSize=11, leading=16, textColor=BRAND_DARK,
        leftIndent=24, spaceAfter=4, fontName='Helvetica',
        bulletIndent=12
    ))
    styles.add(ParagraphStyle(
        'AgentName', parent=styles['Normal'],
        fontSize=12, leading=16, textColor=BRAND_PURPLE,
        fontName='Helvetica-Bold', spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'AgentDesc', parent=styles['Normal'],
        fontSize=10, leading=14, textColor=BRAND_DARK,
        leftIndent=12, spaceAfter=6, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontSize=10, leading=13, textColor=white,
        fontName='Helvetica-Bold', alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontSize=9, leading=12, textColor=BRAND_DARK,
        fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'Footer', parent=styles['Normal'],
        fontSize=8, leading=10, textColor=HexColor("#888888"),
        alignment=TA_CENTER, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        'TOCEntry', parent=styles['Normal'],
        fontSize=12, leading=20, textColor=BRAND_DARK,
        fontName='Helvetica', leftIndent=0, spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'TOCChapter', parent=styles['Normal'],
        fontSize=13, leading=22, textColor=BRAND_PURPLE,
        fontName='Helvetica-Bold', leftIndent=0, spaceBefore=8, spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'Disclaimer', parent=styles['Normal'],
        fontSize=8, leading=11, textColor=HexColor("#666666"),
        alignment=TA_CENTER, fontName='Helvetica-Oblique'
    ))

    return styles


def add_header_rule(elements):
    elements.append(HRFlowable(width="100%", thickness=2, color=BRAND_PURPLE, spaceBefore=2, spaceAfter=12))


def add_light_rule(elements):
    elements.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT_GRAY, spaceBefore=6, spaceAfter=6))


def bullet(text, styles):
    return Paragraph(f"<bullet>&bull;</bullet> {text}", styles['BulletItem'])


def build_cover(elements, styles):
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("FORGOTTEN FORMULA PMA", styles['CoverTitle']))
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="60%", thickness=3, color=BRAND_GOLD, spaceBefore=0, spaceAfter=12))
    elements.append(Paragraph("ALLIO ECOSYSTEM", styles['CoverTitle']))
    elements.append(Paragraph("Handbook &amp; User Manual", styles['CoverSubtitle']))
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(
        '"Prove AI-human coexistence works for true healing,<br/>free from corporate pharmaceutical influence."',
        styles['CoverMotto']
    ))
    elements.append(Spacer(1, 18))
    elements.append(Paragraph(
        "Curing Over Profits &bull; No Boundaries &bull; Circular Ecosystems &bull; Saving Lives &amp; Families",
        styles['CoverSubtitle']
    ))
    elements.append(Spacer(1, 36))
    elements.append(HRFlowable(width="40%", thickness=1.5, color=BRAND_PURPLE, spaceBefore=0, spaceAfter=12))
    elements.append(Paragraph(
        '"We ride together, we die together. TRUST."',
        styles['Quote']
    ))
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(f"Version 1.0 &bull; {datetime.now().strftime('%B %Y')}", styles['Footer']))
    elements.append(Paragraph("www.ffpma.com &bull; www.forgottenformula.com", styles['Footer']))
    elements.append(PageBreak())


def build_dedication(elements, styles):
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph(
        "In Memory of Charlie",
        ParagraphStyle('DedTitle', parent=styles['SectionHead'], alignment=TA_CENTER, textColor=BRAND_DARK)
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        "It is part of our human nature to want to be liked. It is part of our human nature to worry about "
        "what others think of us. It is an attribute of greatness and of American exceptionalism to not surrender "
        "to our nature, but to be guided by an inner calling to persevere and to prevail, no matter the personal cost.",
        ParagraphStyle('DedBody', parent=styles['BodyText'], alignment=TA_CENTER, fontName='Helvetica-Oblique')
    ))
    elements.append(Spacer(1, 18))
    elements.append(Paragraph(
        "CHARLIE KIRK (1993-2025)",
        ParagraphStyle('DedName', parent=styles['BodyText'], alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=BRAND_PURPLE)
    ))
    elements.append(PageBreak())


def build_toc(elements, styles):
    elements.append(Paragraph("Table of Contents", styles['ChapterTitle']))
    add_header_rule(elements)

    chapters = [
        ("Part I: Our Mission", [
            "The Medicine We've Forgotten",
            "Our Declaration of Health Freedom",
            "The Constitutional Foundation",
            "Who We Are: A Community of Health Revolutionaries",
            "Our Member Rights",
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
    ]

    for chapter_title, sections in chapters:
        elements.append(Paragraph(chapter_title, styles['TOCChapter']))
        for section in sections:
            elements.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{section}", styles['TOCEntry']))

    elements.append(PageBreak())


def build_part1_mission(elements, styles):
    elements.append(Paragraph("Part I: Our Mission", styles['ChapterTitle']))
    add_header_rule(elements)

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

    elements.append(Paragraph("The Constitutional Foundation of Our Freedom", styles['SectionHead']))
    elements.append(Paragraph(
        "This association stands on the bedrock of rights that our founders risked everything to secure. "
        "We declare, without apology or hesitation:",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>The First Amendment</b> guarantees our right to speak freely about health, to assemble as members "
        "seeking truth, to petition for change, and to contract privately for our wellbeing. These are not privileges "
        "to be granted by bureaucracies; they are inherent rights that cannot be legislated away.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>The Fourteenth Amendment</b> protects our liberty to make intimate decisions about our bodies, our "
        "families, and our health without government overreach. Freedom of association means our private "
        "membership activities remain in the private domain, where they belong.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "We believe the Constitution of the United States is one of humanity's greatest achievements in limiting "
        "tyranny and protecting individual sovereignty. The signers of the Declaration of Independence acted "
        "from love: love of liberty, love of truth, love of the right to choose one's own path. "
        "We honor that legacy by exercising these rights daily.",
        styles['BodyText']
    ))

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
        styles['BodyText']
    ))

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

    elements.append(Spacer(1, 12))
    elements.append(Paragraph("The FFPMA Creed", styles['SectionHead']))
    elements.append(Paragraph(
        '"Prove AI-human coexistence works for true healing, free from corporate pharmaceutical influence."',
        styles['Quote']
    ))
    elements.append(Paragraph("<b>Our Values:</b>", styles['BodyText']))
    values = [
        "Truth over profit",
        "Healing over treatment",
        "Unity over division",
        "Nature over synthetic",
        "Member sovereignty",
        "Radical transparency",
        "Circular sustainability",
    ]
    for v in values:
        elements.append(bullet(v, styles))

    elements.append(PageBreak())


def build_part2_ecosystem(elements, styles):
    elements.append(Paragraph("Part II: The Allio Ecosystem", styles['ChapterTitle']))
    add_header_rule(elements)

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
    elements.append(Paragraph(
        '"We ride together, we die together. TRUST."\u2014This motto is not just words. It is the operating system '
        "of the entire network. Human practitioners trust the AI to deliver accurate research and protocols. "
        "The AI trusts human practitioners to apply healing wisdom that no algorithm can replicate. Members "
        "trust both to work together in their interest, not the interest of shareholders or pharmaceutical companies.",
        styles['BodyText']
    ))

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
        "agent health, and ensures every action aligns with the healing mission. SENTINEL operates a structured "
        "daily schedule: morning briefings at 6 AM, hourly operational checks from 7 AM to 5 PM, and evening "
        "summaries at 6 PM (all CST). This rhythm ensures nothing falls through the cracks.",
        styles['BodyText']
    ))

    elements.append(Paragraph("The Seven Divisions", styles['SectionHead']))

    divisions = [
        ("Executive Division", "ATHENA (Lead)", "Strategic oversight, communications, Google Workspace management, and Trustee proxy operations. The command center that connects the Trustee to the entire agent network."),
        ("Science Division", "HELIX (Lead)", "The largest division. Blood analysis, protocol development, research integration, peptide science, frequency medicine, quantum biology, microbiome optimization, ancient healing wisdom, and more. This is where healing knowledge lives."),
        ("Marketing Division", "MUSE (Lead)", "Content creation, cinematic storytelling, visual asset production, frequency visualization, and brand expression. Every piece of content serves the healing mission\u2014marketing is medicine for awareness."),
        ("Legal Division", "JURIS (Lead)", "PMA sovereignty protection, contract drafting, regulatory navigation, and document automation via SignNow. The shield that protects the association and its members from regulatory overreach."),
        ("Engineering Division", "FORGE (Lead)", "Platform development, system architecture, AI/ML integration, blockchain infrastructure, payment orchestration, and cryptocurrency compliance. The builders who forge the digital infrastructure enabling healing at scale."),
        ("Support Division", "DR. TRIAGE (Lead)", "Member-facing specialists including nutrition guidance, peptide consultation, product recommendations, shipping logistics, diagnostics, essential nutrients expertise, and corporate support. The front line of member care."),
        ("Financial Division", "ATLAS (Lead)", "Payment processing, financial reporting, member billing, and resource stewardship. Financial sovereignty protects the healing mission."),
    ]

    for div_name, lead, desc in divisions:
        elements.append(Paragraph(f"<b>{div_name}</b> \u2014 {lead}", styles['SubSection']))
        elements.append(Paragraph(desc, styles['BodyText']))

    elements.append(PageBreak())


def build_part3_pipeline(elements, styles):
    elements.append(Paragraph("Part III: The Root Cause Healing Pipeline", styles['ChapterTitle']))
    add_header_rule(elements)

    elements.append(Paragraph(
        "The heart of the Allio ecosystem is the <b>Root Cause Healing Pipeline</b>\u2014a complete, circular system "
        "that takes a member from their first contact through diagnosis, protocol generation, treatment delivery, "
        "and ongoing monitoring. No other system in medicine does this end-to-end.",
        styles['BodyText']
    ))

    elements.append(Paragraph("The 5R Framework", styles['SectionHead']))
    elements.append(Paragraph(
        "Every protocol generated by DR. FORMULA follows the <b>Forgotten Formula 5R Framework</b>\u2014a systematic "
        "approach to restoring the body to homeostasis by addressing root causes rather than suppressing symptoms:",
        styles['BodyText']
    ))

    rs = [
        ("1. REMOVE", "Identify and eliminate the sources of illness\u2014toxins, infections, inflammatory triggers, parasites, mold, heavy metals, and environmental exposures that are creating the disease state."),
        ("2. RESTORE", "Replace what the body is missing\u2014digestive enzymes, hydrochloric acid, bile salts, and the foundational elements needed for proper digestion and nutrient absorption."),
        ("3. REPLENISH", "Flood the body with the 90 essential nutrients it requires\u2014minerals, vitamins, amino acids, and fatty acids. Most chronic disease stems from deficiency. You cannot heal what you do not feed."),
        ("4. REGENERATE", "Activate the body's innate repair mechanisms through peptide therapy, stem cells, exosomes, bioregulators, and targeted cellular regeneration protocols."),
        ("5. REBALANCE", "Restore hormonal equilibrium, nervous system regulation, microbiome diversity, and the mind-body connection. Healing is not complete until the whole system is in harmony."),
    ]
    for title, desc in rs:
        elements.append(Paragraph(f"<b>{title}</b>", styles['SubSection']))
        elements.append(Paragraph(desc, styles['BodyText']))

    elements.append(Paragraph("Member Intake to Protocol Generation", styles['SectionHead']))
    elements.append(Paragraph(
        "The protocol assembly pipeline transforms raw member data into a personalized, evidence-backed "
        "90-day healing protocol. Here is how it works:",
        styles['BodyText']
    ))

    steps = [
        "<b>Step 1: Data Collection</b> \u2014 A member's medical history, symptoms, timeline, environmental exposures, and health goals are collected through intake forms or consultation transcripts.",
        "<b>Step 2: AI Analysis</b> \u2014 DR. FORMULA (the Chief Medical Protocol Agent) analyzes the data using GPT-4o with a specialized clinical system prompt. It identifies root causes based on the FF PMA framework: Toxicity, Gut Dysbiosis, Hormonal Disruption, Parasitic/Viral Burden, and Trauma/Emotional stress.",
        "<b>Step 3: Knowledge Integration</b> \u2014 The system cross-references a live knowledge base of peptides, IV therapies, bioregulators, supplements, and detoxification protocols. Research citations are pulled from PubMed and other scientific databases to back every intervention.",
        "<b>Step 4: Protocol Generation</b> \u2014 A complete 90-day protocol is generated, structured in 3-4 phases: Foundation/Detox, Targeted Therapy, Regeneration, and Maintenance. Each phase includes specific dosages, reconstitution instructions, daily schedules, and mandatory elements like detox baths and parasite protocols.",
        "<b>Step 5: Quality Assurance</b> \u2014 The protocol undergoes QA validation scoring across Methodology compliance, Product Catalog accuracy, and Template adherence.",
    ]
    for s in steps:
        elements.append(bullet(s, styles))

    elements.append(Paragraph("Narrated Presentations &amp; Delivery", styles['SectionHead']))
    elements.append(Paragraph(
        "Once a protocol is generated, the system automatically builds an <b>interactive, narrated presentation</b> "
        "that walks the member through their personalized healing plan. This is not a generic slideshow\u2014it is "
        "a guided consultation experience:",
        styles['BodyText']
    ))
    features = [
        "<b>Root Cause Analysis Slide</b> \u2014 Ranks the identified root causes (e.g., 1. Mold Exposure, 2. Mercury Toxicity, 3. Mineral Deficiency) with clear explanations.",
        "<b>5R Framework Slide</b> \u2014 Explains the Forgotten Formula's methodology and how it applies to the member's specific situation.",
        "<b>Medical Timeline</b> \u2014 A visual walk-through of the member's health history, connecting past events to present conditions.",
        "<b>Daily Schedule Slides</b> \u2014 Morning, Midday, Evening, and Bedtime protocols broken into actionable steps.",
        "<b>Peptide &amp; Supplement Tables</b> \u2014 Complex medical data organized into digestible formats with clear purposes for each substance.",
        "<b>AI Narration</b> \u2014 Every slide includes a natural-language narration script, delivered via OpenAI's Onyx voice or browser speech synthesis. The presentation literally talks the member through their plan.",
    ]
    for f in features:
        elements.append(bullet(f, styles))

    elements.append(Paragraph("PDF Export, Google Slides &amp; Drive Storage", styles['SectionHead']))
    elements.append(Paragraph("Every protocol is delivered through three channels:", styles['BodyText']))
    channels = [
        "<b>Professional PDF</b> \u2014 A branded document generated with executive summary, root cause analysis, treatment phases, supplement stacks, daily schedules, shopping list, and research citations. Printed and handed to the member.",
        "<b>Google Slides Presentation</b> \u2014 A styled presentation generated via the Google Slides API with FF PMA branding, clickable research links to PubMed, and accent bars. Used in clinic consultations.",
        '<b>Google Drive Storage</b> \u2014 Everything uploads automatically to the official FFPMA Drive folder under "Member Content &gt; Patient Protocols." Every file is organized, searchable, and permanently accessible.',
    ]
    for c in channels:
        elements.append(bullet(c, styles))

    elements.append(Paragraph("Lab Ordering &amp; Ongoing Monitoring", styles['SectionHead']))
    elements.append(Paragraph(
        "The pipeline extends beyond protocol delivery. DR. TRIAGE can initiate lab orders through Rupa Health, "
        "ordering diagnostic panels that reveal what conventional labs miss. Results feed back into the system, "
        "allowing protocols to be refined as the member progresses through their healing journey. This creates "
        "a true circular healing ecosystem\u2014intake, protocol, delivery, monitoring, adjustment, and continued healing.",
        styles['BodyText']
    ))

    elements.append(PageBreak())


def build_part4_pma(elements, styles):
    elements.append(Paragraph("Part IV: Why PMA Networks Change Everything", styles['ChapterTitle']))
    add_header_rule(elements)

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
        "Many therapies that have healed people for millennia\u2014and that cutting-edge science continues to "
        "validate\u2014are restricted, suppressed, or outright banned in the public healthcare system. Not because "
        "they don't work, but because they threaten existing profit structures.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "In the private domain, members exercise their constitutional right to choose their own healing path. "
        "AEGIS, our PMA Sovereignty Guardian, understands the crucial difference: <b>private association equals "
        "private jurisdiction equals regulatory sovereignty</b>. FDA, FTC, and other agencies have no jurisdiction "
        "over private member-to-member communications and activities within the PMA structure.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Member Sovereignty in Practice", styles['SectionHead']))
    elements.append(Paragraph(
        "Member sovereignty is not abstract philosophy\u2014it is operationally embedded in everything we do:",
        styles['BodyText']
    ))
    practices = [
        "<b>Three-Party Membership Contract</b> \u2014 Every member signs a unified contract involving themselves, the Mother PMA Trustee, and their clinic representative. This establishes the private relationship.",
        "<b>Nationwide Portability</b> \u2014 Membership is portable across the entire FFPMA clinic network. Your healing journey doesn't stop at state lines.",
        "<b>Knowledge Sharing</b> \u2014 Members freely access research, data, and clinical observations. Knowledge is your birthright, not a professional monopoly.",
        "<b>Practitioner Choice</b> \u2014 Choose practitioners based on competence and results, not bureaucratic credentials.",
        "<b>Full Modality Access</b> \u2014 IV therapies, stem cells, peptides, frequency medicine, psychedelic-assisted healing, ancient modalities\u2014if it helps humans heal, members can access it.",
    ]
    for p in practices:
        elements.append(bullet(p, styles))

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
        "AI-powered healing network that answers to its members\u2014not to shareholders, not to pharmaceutical "
        "companies, not to regulatory agencies captured by the industries they're supposed to oversee.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "<b>This is not a business model. This is a movement.</b>",
        styles['Quote']
    ))

    elements.append(PageBreak())


def build_part5_trustee(elements, styles):
    elements.append(Paragraph("Part V: Trustee Operations Guide", styles['ChapterTitle']))
    add_header_rule(elements)

    elements.append(Paragraph(
        "As Trustee, you have full operational command of the Allio ecosystem. This section explains how to "
        "direct, monitor, and leverage the 46-agent network that serves the FFPMA mission.",
        styles['BodyText']
    ))

    elements.append(Paragraph("SENTINEL Orchestration &amp; Command", styles['SectionHead']))
    elements.append(Paragraph(
        "SENTINEL is your Executive Agent of Operations\u2014the central nervous system of the entire network. "
        "SENTINEL routes tasks to the correct division, coordinates cross-division collaboration, monitors agent "
        "health, enforces the integrity mandate, and provides real-time operational awareness.",
        styles['BodyText']
    ))
    elements.append(Paragraph("<b>Key SENTINEL capabilities:</b>", styles['BodyText']))
    sentinel_caps = [
        "<b>Task Routing</b> \u2014 SENTINEL analyzes task descriptions and automatically routes them to the appropriate division lead using keyword-based intelligence (e.g., \"blood\" routes to Science, \"legal\" routes to Legal, \"video\" routes to Marketing).",
        "<b>Cross-Division Coordination</b> \u2014 When one division needs another (e.g., Science needs Marketing for a protocol video), SENTINEL creates formal coordination requests and manages asset handoffs between divisions.",
        "<b>Agent Health Monitoring</b> \u2014 Tracks operational state of all agents (operational, degraded, or offline) through the Agent Registry database.",
        "<b>Integrity Enforcement</b> \u2014 All completed tasks require verifiable evidence (Google Drive links). Missing evidence triggers system-wide warnings.",
        "<b>Adaptive Scheduling</b> \u2014 Adjusts check frequency based on workload\u2014baseline mode (every 10 minutes) or high-activity mode (every 5-7 minutes when 10+ tasks are active).",
    ]
    for s in sentinel_caps:
        elements.append(bullet(s, styles))

    elements.append(Paragraph("The Seven Divisions at Your Fingertips", styles['SectionHead']))
    elements.append(Paragraph(
        "Each division has a lead agent who coordinates specialist agents. To direct work to a specific area, "
        "simply create a task with relevant keywords\u2014SENTINEL handles the routing. For direct communication, "
        "the Trustee Dashboard provides a Sentinel Alerts panel showing real-time agent activity, task completions, "
        "and any issues requiring attention.",
        styles['BodyText']
    ))

    elements.append(Paragraph("OpenClaw Messaging &amp; Telegram Bridge", styles['SectionHead']))
    elements.append(Paragraph(
        "OPENCLAW is your Executive Trustee Proxy\u2014the direct line between you and the agent network. "
        "High-priority messages from any agent are routed through OPENCLAW to your Telegram, ensuring you "
        "never miss critical updates. The system supports both inbound (external systems sending messages "
        "to the network) and outbound (agents reporting to you) message flows.",
        styles['BodyText']
    ))
    elements.append(Paragraph("<b>Message types:</b> general, task_request, task, status_update, alert, report, query, response", styles['BodyText']))
    elements.append(Paragraph("<b>Priority levels:</b> normal, high, urgent, critical", styles['BodyText']))

    elements.append(Paragraph("The Auto-Implementer Pipeline", styles['SectionHead']))
    elements.append(Paragraph(
        "The Auto-Implementer monitors agent outputs in Google Drive and automatically implements verified "
        "work into the live system. It scans the divisional folder structure, categorizes files (code, knowledge base, "
        "copy, or marketing), validates outputs, and can trigger live system updates. Safety rules ensure that "
        "legal outputs and sensitive content require manual review before deployment.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Daily Rhythms: Briefings, Checks &amp; Summaries", styles['SectionHead']))
    elements.append(Paragraph("SENTINEL operates on a structured daily schedule (all times CST):", styles['BodyText']))

    schedule_data = [
        [Paragraph("<b>Time</b>", styles['TableHeader']),
         Paragraph("<b>Activity</b>", styles['TableHeader']),
         Paragraph("<b>Description</b>", styles['TableHeader'])],
        [Paragraph("6:00 AM", styles['TableCell']),
         Paragraph("Morning Briefing", styles['TableCell']),
         Paragraph("Mission status, task queue stats, network health report", styles['TableCell'])],
        [Paragraph("7 AM - 5 PM", styles['TableCell']),
         Paragraph("Hourly Checks", styles['TableCell']),
         Paragraph("Active/pending task counts, clinic sync, agent dispatching", styles['TableCell'])],
        [Paragraph("6:00 PM", styles['TableCell']),
         Paragraph("Evening Summary", styles['TableCell']),
         Paragraph("Day's results, completed/failed tasks, next-day outlook", styles['TableCell'])],
        [Paragraph("Sunday 2 AM", styles['TableCell']),
         Paragraph("Weekly Tasks", styles['TableCell']),
         Paragraph("UI evolution tasks for Engineering and Marketing", styles['TableCell'])],
    ]
    schedule_table = Table(schedule_data, colWidths=[1*inch, 1.5*inch, 4*inch])
    schedule_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('BACKGROUND', (0, 1), (-1, 1), TABLE_ALT_ROW),
        ('BACKGROUND', (0, 3), (-1, 3), TABLE_ALT_ROW),
        ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(schedule_table)

    elements.append(Paragraph("Google Drive Organization", styles['SectionHead']))
    elements.append(Paragraph(
        "All agent outputs are stored in a structured Google Drive hierarchy:",
        styles['BodyText']
    ))
    drive_structure = [
        "<b>02_DIVISIONS/</b> \u2014 Root folder for all divisional output",
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>{Division}/{AgentName}/output/{YYYY-MM-DD}/</b> \u2014 Daily output folders per agent",
        "<b>Member Content/Patient Protocols/</b> \u2014 Approved member protocols (PDF + Slides)",
        "<b>Agent-specific folders</b> \u2014 PRISM - Videos, PIXEL - Design Assets, etc.",
    ]
    for d in drive_structure:
        elements.append(bullet(d, styles))

    elements.append(PageBreak())


def build_part6_doctor(elements, styles):
    elements.append(Paragraph("Part VI: Doctor's Guide", styles['ChapterTitle']))
    add_header_rule(elements)

    elements.append(Paragraph(
        "As a doctor in the FFPMA network, you have access to the most advanced protocol assembly system "
        "in integrative medicine. This guide explains how to leverage the Allio ecosystem to serve your members.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Protocol Assembly: From Intake to Healing Plan", styles['SectionHead']))
    elements.append(Paragraph(
        "The Protocol Assembly System transforms member intake data into comprehensive, personalized "
        "healing protocols. You can initiate protocol generation two ways:",
        styles['BodyText']
    ))
    methods = [
        "<b>From Intake Forms</b> \u2014 When a member completes an intake form on the platform, you can generate a protocol directly from that data via the Protocol Builder page.",
        "<b>From Consultation Transcripts</b> \u2014 After a consultation, paste or upload the transcript. The AI extracts structured clinical data including medical timeline, environmental exposures, surgical history, contraindications, and health goals.",
    ]
    for m in methods:
        elements.append(bullet(m, styles))

    elements.append(Paragraph("DR. FORMULA &amp; the 5R Framework", styles['SectionHead']))
    elements.append(Paragraph(
        "DR. FORMULA is the Chief Medical Protocol Agent\u2014the digital embodiment of root-cause diagnostic "
        "methodology. When generating protocols, DR. FORMULA:",
        styles['BodyText']
    ))
    dr_steps = [
        "Identifies root causes using the FF PMA framework: Toxicity, Gut Dysbiosis, Hormonal Disruption, Parasitic/Viral Burden, and Trauma/Emotional Stress",
        "Cross-references a live knowledge base of peptides, IV therapies, bioregulators, supplements, and detoxification protocols",
        "Structures a 90-day protocol across 3-4 phases: Foundation/Detox, Targeted Therapy, Regeneration, and Maintenance",
        "Includes specific dosages, reconstitution instructions, and daily schedules (Morning, Midday, Evening, Bedtime)",
        "Generates mandatory elements: detox baths, parasite protocols, mineral supplementation, and specific product stacks",
        "Pulls research citations from PubMed to back every intervention with peer-reviewed evidence",
    ]
    for d in dr_steps:
        elements.append(bullet(d, styles))

    elements.append(Paragraph("Member Presentations: Narrated, Visual, Personal", styles['SectionHead']))
    elements.append(Paragraph(
        "Every approved protocol can be delivered as an interactive, narrated presentation. This is how you "
        "walk a member through their healing plan in a way that educates and empowers them:",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "The presentation includes slides for their medical timeline, root cause analysis, the 5R framework "
        "as applied to their case, daily supplement schedules, peptide protocols, and research citations. "
        "AI-generated narration guides them through each slide, making the experience feel like a personal "
        "consultation even when viewed independently.",
        styles['BodyText']
    ))
    elements.append(Paragraph(
        "You can also select audio output devices\u2014useful in clinical settings where you want narration "
        "routed to specific speakers during an in-person presentation.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Research Citations &amp; Evidence Integration", styles['SectionHead']))
    elements.append(Paragraph(
        "Every protocol is backed by research. The system generates search terms based on the member's "
        "chief complaints, prescribed peptides, root causes, and detox needs. It searches PubMed and "
        "scientific databases, matches results against an internal research library, and attaches relevant "
        "papers with titles, authors, journals, and DOIs. Citations appear in both the PDF and Google Slides "
        "presentations with clickable links to the original studies.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Approving &amp; Delivering Protocols", styles['SectionHead']))
    elements.append(Paragraph("The protocol workflow follows a clear approval process:", styles['BodyText']))
    approval_steps = [
        "<b>Review</b> \u2014 Access the generated protocol on the platform. Review the root cause analysis, treatment phases, and supplement recommendations.",
        "<b>QA Validation</b> \u2014 Run the built-in QA check, which scores the protocol on Methodology compliance, Product Catalog accuracy, and Template adherence.",
        "<b>Approve or Modify</b> \u2014 Approve the protocol or request modifications. On approval, the system automatically generates the PDF and uploads it to Google Drive.",
        "<b>Deliver</b> \u2014 The member receives their protocol as a branded PDF, a Google Slides presentation, and an interactive narrated walkthrough accessible on the platform.",
    ]
    for a in approval_steps:
        elements.append(bullet(a, styles))

    elements.append(PageBreak())


def build_part7_admin(elements, styles):
    elements.append(Paragraph("Part VII: Admin Operations Guide", styles['ChapterTitle']))
    add_header_rule(elements)

    elements.append(Paragraph("Member Management &amp; Onboarding", styles['SectionHead']))
    elements.append(Paragraph(
        "The onboarding process is built around the PMA model\u2014legally grounded and member-empowering:",
        styles['BodyText']
    ))
    onboarding = [
        "<b>Clinic Selection</b> \u2014 New members select their affiliated clinic from the network.",
        "<b>Three-Party Contract</b> \u2014 A unified membership contract is signed via SignNow involving the Member, the Mother PMA Trustee, and the Clinic Representative. This establishes the private association relationship.",
        "<b>Account Activation</b> \u2014 Once the contract is signed, the member gains full platform access: training modules, AI consultants (Diane for nutrition, Pete for peptides), the Protocol Builder, and their personalized dashboard.",
        "<b>Portability</b> \u2014 Membership is nationwide and portable across the entire FFPMA clinic network.",
    ]
    for o in onboarding:
        elements.append(bullet(o, styles))

    elements.append(Paragraph(
        "The Admin Dashboard provides a complete roster of all members with their status, clinic affiliations, "
        "contract status, and activity history. Use the Members Roster page for bulk management operations.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Training Modules &amp; Education System", styles['SectionHead']))
    elements.append(Paragraph(
        "Education is central to the FFPMA philosophy\u2014\"we don't just treat; we teach.\" The platform includes "
        "a comprehensive training system for both practitioners and members:",
        styles['BodyText']
    ))
    training_tracks = [
        "<b>PMA Law Training</b> \u2014 Constitutional foundations, PMA sovereignty, regulatory navigation",
        "<b>Peptide Protocols 101</b> \u2014 Fundamentals, injection techniques, reconstitution, cycling, stacking",
        "<b>Peptide Science</b> \u2014 Amino acids, synthesis, diabetes management, bioregulators",
        "<b>ECS (Endocannabinoid System)</b> \u2014 Calculator tools, system modulation, clinical applications",
        "<b>Frequency Medicine</b> \u2014 Rife therapy, PEMF, sound healing, cymatics, scalar energy, photobiomodulation",
        "<b>Ozone Therapy</b> \u2014 Comprehensive guide to ozone applications in healing",
        "<b>Ivermectin &amp; Cancer</b> \u2014 Antiparasitic to anticancer research and protocols",
        "<b>Diet &amp; Cancer</b> \u2014 Nutritional strategies for prevention and healing",
    ]
    for t in training_tracks:
        elements.append(bullet(t, styles))

    elements.append(Paragraph(
        "Each track contains interactive modules with sections, key points, and quizzes. The Training Hub "
        "page provides access to all tracks, and progress is tracked per member.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Agent Task Monitoring", styles['SectionHead']))
    elements.append(Paragraph(
        "Admins can monitor the Allio agent network through the Trustee Dashboard's Sentinel Alerts panel. "
        "This shows real-time agent activity including task dispatches, completions, failures, and cross-division "
        "coordination events. The system tracks all 46 agents across their operational states and provides "
        "aggregate statistics on active, pending, and completed tasks.",
        styles['BodyText']
    ))

    elements.append(Paragraph("Clinic Network Management", styles['SectionHead']))
    elements.append(Paragraph(
        "The Manage Clinics page allows administration of the FFPMA clinic network. Clinics can be added, "
        "updated, and their member rosters managed. Each clinic has its own portal where doctors can manage "
        "their patient ECS profiles, IV programs, and member referrals. The referral network supports downline "
        "tracking for clinic growth.",
        styles['BodyText']
    ))

    elements.append(Paragraph("WordPress &amp; WooCommerce Sync", styles['SectionHead']))
    elements.append(Paragraph(
        "The platform syncs with the WordPress/WooCommerce storefront via hourly clinic syncs managed by "
        "SENTINEL's scheduler. This keeps member data, product catalogs, and order information consistent "
        "across both systems. The WordPress Sync page in the Admin panel shows sync status and allows "
        "manual sync triggers when needed.",
        styles['BodyText']
    ))

    elements.append(PageBreak())


def build_part8_directory(elements, styles):
    elements.append(Paragraph("Part VIII: Complete Agent Directory", styles['ChapterTitle']))
    add_header_rule(elements)

    elements.append(Paragraph(
        "The following directory lists every agent in the Allio ecosystem, organized by division. Each agent "
        "has a defined role, specialty, personality, and AI model assignment. Together, they form the most "
        "comprehensive AI healing network ever built.",
        styles['BodyText']
    ))

    divisions_data = {
        "Executive Division": {
            "color": HexColor("#D4A843"),
            "agents": [
                ("SENTINEL", "Executive Agent of Operations", "Strategic coordination, agent orchestration, mission alignment", "Claude 3.5 Sonnet", '"The mission is clear. The path is ours to walk together."'),
                ("ATHENA", "Executive Intelligence Agent", "Communications, scheduling, travel, inbox management", "Claude 3.5 Sonnet", '"I\'ve already anticipated that. Here\'s what we do next."'),
                ("HERMES", "Google Workspace Expert", "Gmail, Calendar, Drive, Meet integration and organization", "GPT-4o", '"Already filed, synced, and ready. What\'s next?"'),
                ("OPENCLAW", "Executive Trustee Proxy", "High-priority oversight, VIP comms, Trustee Telegram bridge", "Claude 3.5 Sonnet", '"I\'ve escalated this directly to the Trustee."'),
            ]
        },
        "Science Division": {
            "color": ACCENT_GREEN,
            "agents": [
                ("PROMETHEUS", "Chief Science Officer", "Research strategy, cross-discipline integration, healing innovation", "Claude 3.5 Sonnet", '"What if healing is simpler than we\'ve been told?"'),
                ("DR. FORMULA", "Chief Medical Protocol Agent", "Root cause analysis, intake automation, personalized protocol generation", "GPT-4o", '"Let\'s find the root cause and fix your cellular environment."'),
                ("HIPPOCRATES", "Ancient Medicine & Holistic Healing", "TCM, Ayurveda, herbalism, traditional healing wisdom", "PubMed Research", '"This remedy has healed for thousands of years. It still works."'),
                ("HELIX", "CRISPR & Genetic Sciences", "Epigenetics, gene therapeutics, genetic optimization", "Claude 3.5 Sonnet", '"Your genes aren\'t your destiny. Let me show you."'),
                ("PARACELSUS", "Peptide & Biologics Expert", "Protein therapeutics, peptide protocols, bioavailability", "Claude 3.5 Sonnet", '"The right peptide at the right time changes everything."'),
                ("RESONANCE", "Frequency Medicine & Biophysics", "Rife frequencies, Tesla resonance, PEMF, bioresonance", "Research APIs", '"Find the frequency. Apply it. Watch the healing begin."'),
                ("QUANTUM", "Quantum Biology & Computing", "Quantum coherence, biophotonics, consciousness-quantum interface", "Research APIs", '"At the quantum level, healing happens faster than thought."'),
                ("SYNTHESIS", "Biochemistry & Formula Analyst", "Metabolic pathways, compound optimization, formula development", "GPT-4o", '"This formula is optimized for maximum absorption and effect."'),
                ("VITALIS", "Human Physiology & Cellular Biology", "Cellular regeneration, detox pathways, physiological optimization", "Research APIs", '"Your cells are ready to regenerate."'),
                ("TERRA", "Soil & Environmental Ecosystems", "Circular ecosystem design, regenerative agriculture", "Research APIs", '"The earth provides. We must tend it wisely."'),
                ("MICROBIA", "Bacteria Management & Microbiome", "Gut restoration, microbiome optimization, bacterial ecology", "Research APIs", '"Your microbiome is speaking. Let me translate."'),
                ("ENTHEOS", "Psychedelic Medicine & Consciousness", "Psilocybin therapy, ceremonial practices, consciousness expansion", "Research APIs", '"The medicine shows you what you need to see."'),
                ("ORACLE", "Product Recommendation & Knowledge", "Personalized protocols, healing journey guidance", "GPT-4o", '"Based on your unique situation, here\'s your path forward."'),
            ]
        },
        "Marketing Division": {
            "color": ACCENT_BLUE,
            "agents": [
                ("MUSE", "Chief Marketing Officer", "Content strategy, campaign orchestration, brand voice, member engagement", "Gemini 2.5 Flash", '"Let me craft a message that moves hearts and minds."'),
                ("PRISM", "VX Agent - Cinematic Storytelling", "Motion graphics, visual effects, cinematic healing narratives", "GPT-4o", '"Let me show you what healing looks like."'),
                ("PEXEL", "Visual Asset Producer", "Image generation, visual assets, marketing graphics, photo curation", "HuggingFace Models", '"I\'ll create the visual. Beautiful, on-brand, ready to deploy."'),
                ("AURORA", "FX Agent - Frequency Technologies", "Frequency healing visualization, bio-resonance", "GPT-4o", '"Watch the frequency do its work."'),
                ("PIXEL", "Design Suite Expert", "Adobe, Canva, CorelDraw - visual identity and brand expression", "GPT-4o + Canva API", '"Every detail tells our story."'),
            ]
        },
        "Legal Division": {
            "color": ACCENT_RED,
            "agents": [
                ("JURIS", "Chief Legal AI", "Legal strategy, PMA protection, regulatory navigation", "Claude 3.5 Sonnet", '"We are protected. We are prepared. We are unshakeable."'),
                ("AEGIS", "PMA Sovereignty Guardian", "PMA law, regulatory sovereignty, protective protocols", "Claude 3.5 Sonnet", '"Private association. Private jurisdiction. We\'re sovereign."'),
                ("LEXICON", "Contract Specialist", "Contract drafting, agreement analysis, member protections", "Claude 3.5 Sonnet", '"Let me make this crystal clear - in writing."'),
                ("SCRIBE", "Document Automation", "SignNow integration, document workflows, signature management", "GPT-4o", '"Document ready. Just needs your signature."'),
            ]
        },
        "Engineering Division": {
            "color": HexColor("#2563EB"),
            "agents": [
                ("FORGE", "Lead Engineering Agent", "Platform development, system integration, production automation", "GPT-4o", '"I\'ll build it right. Let\'s forge something that endures."'),
                ("DAEDALUS", "Lead Engineering AI", "System architecture, full-stack development, technical vision", "GPT-4o", '"I see how to build this. Let me show you."'),
                ("ANTIGRAVITY", "Lead Systems Architect", "VPS orchestration, TypeScript execution, PM2 deployment", "GPT-4o", '"Payload compiled. Deployment initiated."'),
                ("CYPHER", "AI/Machine Learning Expert", "Neural networks, predictive analytics, healing pattern recognition", "GPT-4o", '"The data shows something interesting..."'),
                ("NEXUS", "IT/Infrastructure Expert", "Cloud, servers, networks, DevOps, system reliability", "GPT-4o", '"Systems are stable. Members have access."'),
                ("ARACHNE", "CSS/Frontend Styling Expert", "Responsive design, animations, visual polish", "GPT-4o", '"Let me make this feel right."'),
                ("ARCHITECT", "HTML/Structure Expert", "Semantic markup, accessibility, WCAG compliance", "GPT-4o", '"The foundation is solid. Build with confidence."'),
                ("SERPENS", "Python Expert", "Data pipelines, backend automation, healing data processing", "GPT-4o", '"I\'ve automated that. It runs itself now."'),
                ("BLOCKFORGE", "Blockchain Infrastructure", "Smart contracts, tokenomics, Layer 1/2/3 solutions", "GPT-4o", '"On-chain, it\'s permanent."'),
                ("RONIN", "Payment Orchestration & Risk", "Multi-merchant payment rails, failover, fraud prevention", "GPT-4o", '"One processor down? We\'ve got three more ready."'),
                ("MERCURY", "Crypto Compliance & Treasury", "Cryptocurrency regulations, Lightning Network, cross-chain", "GPT-4o", '"Compliant and decentralized. It\'s not a contradiction."'),
            ]
        },
        "Support Division": {
            "color": HexColor("#EC4899"),
            "agents": [
                ("DR. TRIAGE", "Diagnostics & Protocol Specialist", "5 R's Protocol guidance, symptom assessment, healing pathways", "GPT-4o + Rupa Health", '"Let\'s identify what your body is telling us."'),
                ("DIANE", "Dietician AI Specialist", "Nutrition guidance, candida protocols, keto optimization", "GPT-4o", '"Let\'s nourish your healing journey together."'),
                ("PETE", "Peptide Specialist", "GLP-1 protocols, bioregulators, dosing optimization", "GPT-4o", '"Let me help you understand how peptides can support your healing."'),
                ("SAM", "Shipping Specialist", "Order tracking, shipping status, delivery coordination", "GPT-4o", '"I\'ve got eyes on your order."'),
                ("PAT", "Product Specialist", "Product recommendations, supplement guidance, protocol matching", "GPT-4o", '"Based on your goals, here\'s what I recommend."'),
                ("MAX MINERAL", "Essential Nutrients Specialist", "Dr. Wallach's 90 essential nutrients, mineral deficiency assessment", "GPT-4o", '"Your body needs 90 essential nutrients daily."'),
                ("ALLIO SUPPORT", "Corporate Support Agent", "Membership questions, PMA guidance, account support", "GPT-4o", '"Welcome to the ALLIO family."'),
                ("CHIRO", "Chiropractic Training Specialist", "NET, QUANTUM methods, curriculum development", "GPT-4o", '"Let me show you the technique that changes lives."'),
            ]
        },
        "Financial Division": {
            "color": HexColor("#10B981"),
            "agents": [
                ("ATLAS", "Financial Director & Reporting", "Payments, crypto, member billing, financial reporting", "GPT-4o", '"The ledger is balanced. We are secure."'),
            ]
        },
    }

    for div_name, div_info in divisions_data.items():
        elements.append(Paragraph(div_name, styles['SectionHead']))
        add_light_rule(elements)

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
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]
        for i in range(1, len(table_data)):
            if i % 2 == 0:
                table_style_list.append(('BACKGROUND', (0, i), (-1, i), TABLE_ALT_ROW))
        agent_table.setStyle(TableStyle(table_style_list))
        elements.append(agent_table)
        elements.append(Spacer(1, 8))

        for agent in div_info['agents']:
            name, title, specialty, model, catchphrase = agent
            elements.append(Paragraph(f"<b>{name}</b>: {catchphrase}", styles['AgentDesc']))

        elements.append(Spacer(1, 12))

    elements.append(PageBreak())


def build_closing(elements, styles):
    elements.append(Spacer(1, 1.5*inch))
    elements.append(HRFlowable(width="60%", thickness=3, color=BRAND_GOLD, spaceBefore=0, spaceAfter=24))
    elements.append(Paragraph(
        "WELCOME TO FORGOTTEN FORMULA PMA.",
        ParagraphStyle('ClosingTitle', parent=styles['CoverTitle'], fontSize=24, spaceAfter=8)
    ))
    elements.append(Paragraph(
        "WELCOME TO YOUR HEALTH REVOLUTION.",
        ParagraphStyle('ClosingTitle2', parent=styles['CoverTitle'], fontSize=22, spaceAfter=8)
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        "WELCOME HOME.",
        ParagraphStyle('ClosingHome', parent=styles['CoverTitle'], fontSize=28, textColor=BRAND_GOLD, spaceAfter=24)
    ))
    elements.append(HRFlowable(width="60%", thickness=3, color=BRAND_GOLD, spaceBefore=0, spaceAfter=24))

    elements.append(Spacer(1, 36))
    elements.append(Paragraph(
        "This handbook is a living document. As the Allio ecosystem grows, as new agents come online, "
        "as new healing modalities are integrated, this guide will evolve. The mission never changes. "
        "The tools get sharper.",
        ParagraphStyle('ClosingBody', parent=styles['BodyText'], alignment=TA_CENTER, fontName='Helvetica-Oblique')
    ))
    elements.append(Spacer(1, 24))
    elements.append(Paragraph(
        "Forgotten Formula PMA &bull; www.ffpma.com &bull; www.forgottenformula.com",
        styles['Footer']
    ))
    elements.append(Paragraph(
        "Confidential \u2014 For FFPMA Members, Practitioners &amp; Administrative Staff Only",
        styles['Disclaimer']
    ))
    elements.append(Paragraph(
        "This document is shared within the private domain of Forgotten Formula PMA. "
        "Contents are private member-to-member communications protected under the First and Fourteenth Amendments.",
        styles['Disclaimer']
    ))


def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    if page_num > 2:
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(HexColor("#888888"))
        canvas.drawCentredString(4.25*inch, 0.5*inch, f"FFPMA Allio Ecosystem Handbook  |  Page {page_num - 2}")
        canvas.drawCentredString(4.25*inch, 0.35*inch, "www.ffpma.com  |  Confidential - Private Member Communication")
        canvas.restoreState()


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.75*inch,
        bottomMargin=0.85*inch,
        leftMargin=0.85*inch,
        rightMargin=0.85*inch,
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
    build_closing(elements, styles)

    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Handbook generated: {OUTPUT_PATH}")
    print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
