"""
BharatImpact Institutional PPTX Generator
Generates a widescreen (16:9) presentation matching the BharatImpact institutional design system:
- Palette: Soft mint background (#F4F9F6), dark navy-charcoal (#192F3E), emerald green (#00866A), slate (#405365)
- Typography: Serif titles (Georgia / DM Serif Display), clean sans-serif body (Calibri / Inter)
- Generous whitespace, precise card panels, thin borders, clear visual hierarchy
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# 1. Colors & Palette
BG_COLOR = RGBColor(0xF4, 0xF9, 0xF6)        # Soft pale mint
TEXT_PRIMARY = RGBColor(0x19, 0x2F, 0x3E)    # Dark navy charcoal #192F3E
TEXT_SECONDARY = RGBColor(0x40, 0x53, 0x65)  # Muted slate #405365
TEXT_MUTED = RGBColor(0x6B, 0x7F, 0x91)      # Soft gray-slate
ACCENT_EMERALD = RGBColor(0x00, 0x86, 0x6A)  # Primary emerald #00866A
LIGHT_EMERALD = RGBColor(0xE0, 0xF2, 0xEC)   # Pale emerald tint
BORDER_MINT = RGBColor(0xB2, 0xDF, 0xDB)     # Subtle teal border
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)
CARD_BORDER = RGBColor(0xC8, 0xE6, 0xD9)
RED_ACCENT = RGBColor(0xC6, 0x28, 0x28)
AMBER_ACCENT = RGBColor(0xE6, 0x7E, 0x22)

FONT_SERIF = "Georgia"
FONT_SANS = "Calibri"

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR

def add_header(slide, section_tag, title_text, subtitle_text=""):
    # Section Tag Badge
    badge_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.5), Inches(0.35))
    tf = badge_box.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = section_tag.upper()
    p.font.name = FONT_SANS
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT_EMERALD

    # Slide Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.5), Inches(0.75))
    tf_t = title_box.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
    p_t = tf_t.paragraphs[0]
    p_t.text = title_text
    p_t.font.name = FONT_SERIF
    p_t.font.size = Pt(28)
    p_t.font.bold = True
    p_t.font.color.rgb = TEXT_PRIMARY

    # Subtitle
    if subtitle_text:
        sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.55), Inches(11.5), Inches(0.4))
        tf_s = sub_box.text_frame
        tf_s.word_wrap = True
        tf_s.margin_left = tf_s.margin_top = tf_s.margin_right = tf_s.margin_bottom = 0
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = FONT_SANS
        p_s.font.size = Pt(12)
        p_s.font.color.rgb = TEXT_SECONDARY

def add_footer(slide, current_idx, total=12):
    foot_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.73), Inches(0.35))
    tf = foot_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = f"BharatImpact • Institutional Research Deck                                                                                                                                           Slide {current_idx:02d} of {total:02d}"
    p.font.name = FONT_SANS
    p.font.size = Pt(9)
    p.font.color.rgb = TEXT_MUTED

def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1)
    return shape

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ==========================================================
    # SLIDE 1: TITLE & COVER
    # ==========================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Header
    add_header(s1, "00 | EXECUTIVE INTRODUCTION", 
               "BharatImpact: Autonomous Financial Event Market Impact Graph",
               "Bridging Macroeconomic Disruptions, Sector Transmission Channels, and Indian Household Budgets with Deterministic Rigor.")
    
    # 4 Cards
    col_w = Inches(2.78)
    col_gap = Inches(0.2)
    start_left = Inches(0.8)
    top_y = Inches(2.15)
    card_h = Inches(3.2)

    pillars = [
        ("01. GLOBAL EVENTS", "Macroeconomic Shocks", 
         "Real-time extraction of geopolitical conflicts, OPEC supply tightening, and benchmark commodity shifts via strict schema NLP."),
        ("02. SECTORS", "Input Cost Elasticity", 
         "Causal transmission across freight logistics, auto, aviation, and FMCG manufacturing with empirical pass-through factors."),
        ("03. HOUSEHOLD", "MoSPI HCES 2023–24", 
         "Microeconomic calibration to regional consumption baskets (Madhya Pradesh urban/rural) calculating monthly rupee burdens."),
        ("04. INVESTMENTS", "SIP Affordability", 
         "Actionable wealth resilience simulating 6-month budget compression to prevent panic SIP cancellations and long-term erosion.")
    ]

    for i, (pill, heading, desc) in enumerate(pillars):
        c_left = start_left + i * (col_w + col_gap)
        add_card(s1, c_left, top_y, col_w, card_h)
        tb = s1.shapes.add_textbox(c_left + Inches(0.2), top_y + Inches(0.2), col_w - Inches(0.4), card_h - Inches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = pill
        p1.font.name = FONT_SANS
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD

        p2 = tf.add_paragraph()
        p2.text = heading
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_before = Pt(8)

        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.name = FONT_SANS
        p3.font.size = Pt(11)
        p3.font.color.rgb = TEXT_SECONDARY
        p3.space_before = Pt(8)

    # Bottom summary box
    bot_card = add_card(s1, Inches(0.8), Inches(5.6), Inches(11.73), Inches(1.1), bg_color=WHITE, border_color=ACCENT_EMERALD)
    tb_b = s1.shapes.add_textbox(Inches(1.0), Inches(5.7), Inches(11.33), Inches(0.9))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    pb = tf_b.paragraphs[0]
    pb.text = "PROJECT PROFILE: Hackwave 3.0 • Problem Statement 5 (Autonomous Financial Event Market Impact Graph)"
    pb.font.name = FONT_SANS
    pb.font.size = Pt(11)
    pb.font.bold = True
    pb.font.color.rgb = ACCENT_EMERALD
    
    pb2 = tf_b.add_paragraph()
    pb2.text = "Engine Modality: Deterministic + Zero-AI Calculation   |   Baseline Data: MoSPI HCES 2023-24 & PPAC   |   Geography: Indore / Madhya Pradesh"
    pb2.font.name = FONT_SANS
    pb2.font.size = Pt(11)
    pb2.font.color.rgb = TEXT_PRIMARY
    pb2.space_before = Pt(4)

    add_footer(s1, 1)

    # ==========================================================
    # SLIDE 2: THE PROBLEM STATEMENT (Section 4 Exact Spec)
    # ==========================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "01 | PROBLEM STATEMENT", "The Problem Statement", 
               "The structural disconnect between macro financial news and the everyday Indian household's monthly budget.")

    # 1. Central Challenge Panel
    add_card(s2, Inches(0.8), Inches(2.05), Inches(11.73), Inches(1.5), bg_color=WHITE, border_color=BORDER_MINT)
    tb_cc = s2.shapes.add_textbox(Inches(1.05), Inches(2.15), Inches(11.23), Inches(1.3))
    tf_cc = tb_cc.text_frame
    tf_cc.word_wrap = True
    
    p_ccl = tf_cc.paragraphs[0]
    p_ccl.text = "CENTRAL CHALLENGE"
    p_ccl.font.name = FONT_SANS
    p_ccl.font.size = Pt(10)
    p_ccl.font.bold = True
    p_ccl.font.color.rgb = ACCENT_EMERALD

    p_cct = tf_cc.add_paragraph()
    p_cct.text = '"Global macroeconomic shocks ripple across international supply chains and domestic financial markets, yet Indian citizens, retail investors, and financial planners lack an evidence-backed mechanism to trace how headline disruptions translate directly into household expenses and monthly SIP affordability."'
    p_cct.font.name = FONT_SERIF
    p_cct.font.size = Pt(15)
    p_cct.font.bold = True
    p_cct.font.color.rgb = TEXT_PRIMARY
    p_cct.space_before = Pt(6)

    # 2. Main Challenges Grid (4 Cards)
    top_g = Inches(3.75)
    card_g_h = Inches(1.85)
    grid_items = [
        ("CHALLENGE 01", "Fragmented Jargon", 
         "Headlines like 'Brent surges 12%' are reported in isolated silos without downstream consumer transmission links."),
        ("CHALLENGE 02", "Black-Box AI Guesses", 
         "Standard LLMs hallucinate financial metrics without citations, official formulas, or deterministic guarantees."),
        ("CHALLENGE 03", "Missing Micro-Linkage", 
         "Financial portals stop at stock indices, failing to calculate impacts on cooking fuel, groceries, and freight."),
        ("CHALLENGE 04", "Compounding Wealth Loss", 
         "Inflation panics cause citizens to halt ongoing SIPs entirely, destroying irreversible long-term terminal wealth.")
    ]
    for i, (tag, t, d) in enumerate(grid_items):
        c_left = start_left + i * (col_w + col_gap)
        add_card(s2, c_left, top_g, col_w, card_g_h)
        tb_g = s2.shapes.add_textbox(c_left + Inches(0.18), top_g + Inches(0.15), col_w - Inches(0.36), card_g_h - Inches(0.3))
        tf_g = tb_g.text_frame
        tf_g.word_wrap = True
        
        pg1 = tf_g.paragraphs[0]
        pg1.text = tag
        pg1.font.name = FONT_SANS
        pg1.font.size = Pt(9)
        pg1.font.bold = True
        pg1.font.color.rgb = ACCENT_EMERALD

        pg2 = tf_g.add_paragraph()
        pg2.text = t
        pg2.font.name = FONT_SANS
        pg2.font.size = Pt(13)
        pg2.font.bold = True
        pg2.font.color.rgb = TEXT_PRIMARY
        pg2.space_before = Pt(4)

        pg3 = tf_g.add_paragraph()
        pg3.text = d
        pg3.font.name = FONT_SANS
        pg3.font.size = Pt(10)
        pg3.font.color.rgb = TEXT_SECONDARY
        pg3.space_before = Pt(4)

    # 3. The Gap Takeaway Panel
    add_card(s2, Inches(0.8), Inches(5.8), Inches(11.73), Inches(0.95), bg_color=WHITE, border_color=ACCENT_EMERALD)
    tb_gap = s2.shapes.add_textbox(Inches(1.05), Inches(5.88), Inches(11.23), Inches(0.75))
    tf_gap = tb_gap.text_frame
    tf_gap.word_wrap = True
    pgap = tf_gap.paragraphs[0]
    pgap.text = "THE GAP:  A verifiable, dual-engine transmission pipeline that pairs transparent NLP news ingestion with a deterministic, official-data-calibrated input-output graph grounded in MoSPI HCES 2023-24 baseline data."
    pgap.font.name = FONT_SANS
    pgap.font.size = Pt(11)
    pgap.font.color.rgb = TEXT_PRIMARY

    add_footer(s2, 2)

    # ==========================================================
    # SLIDE 3: EXISTING SOLUTIONS & LIMITATIONS
    # ==========================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "02 | MARKET LANDSCAPE", "Existing Solutions & Architectural Limitations", 
               "Current financial information ecosystems fail to connect macro news with personal economic reality.")

    w3 = Inches(3.75)
    gap3 = Inches(0.24)
    top3 = Inches(2.1)
    h3 = Inches(3.6)

    sol_items = [
        ("CATEGORY 01: FINANCIAL MEDIA", "Financial News Portals", "Bloomberg, ET, Moneycontrol",
         "• Siloed Reporting: Focuses on isolated tickers without multi-hop dependency mapping.\n• Qualitative Sentiment: Speculative commentary with zero personalized household calculation.\n• Opaque Jargon: Geared for institutional traders; completely unhelpful for monthly budgeting.",
         "Fatal Flaw: Zero transmission modeling to household consumption."),
        ("CATEGORY 02: FINTECH APPS", "Robo-Advisors & Portals", "Groww, Zerodha Coin, INDmoney",
         "• Static Simulators: Fixed interest rate formulas blind to real-time supply chain shocks.\n• Disconnected Portfolios: No linkage between fuel/freight price surges and ongoing investments.\n• Binary Guidance: Lacks tactical budgeting advice during short-term inflationary spikes.",
         "Fatal Flaw: Completely blind to macro input cost shocks."),
        ("CATEGORY 03: GENAI LLMS", "Generic AI Chatbots", "ChatGPT, Perplexity, Claude",
         "• Mathematical Hallucinations: Invents inflation numbers without empirical verification.\n• Non-Deterministic: Repeated queries produce wildly differing impact percentages.\n• Unverifiable Lineage: Cannot produce official MoSPI survey receipts or deterministic audits.",
         "Fatal Flaw: Unaudited numbers destroying institutional trust.")
    ]

    for i, (tag, t, sub, pts, flaw) in enumerate(sol_items):
        cx = start_left + i * (w3 + gap3)
        add_card(s3, cx, top3, w3, h3)
        tb_s = s3.shapes.add_textbox(cx + Inches(0.2), top3 + Inches(0.2), w3 - Inches(0.4), h3 - Inches(0.4))
        tf_s = tb_s.text_frame
        tf_s.word_wrap = True

        p1 = tf_s.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = RED_ACCENT if "01" in tag or "03" in tag else AMBER_ACCENT

        p2 = tf_s.add_paragraph()
        p2.text = t
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_before = Pt(4)

        p3 = tf_s.add_paragraph()
        p3.text = pts
        p3.font.name = FONT_SANS
        p3.font.size = Pt(10)
        p3.font.color.rgb = TEXT_SECONDARY
        p3.space_before = Pt(6)

        p4 = tf_s.add_paragraph()
        p4.text = flaw
        p4.font.name = FONT_SANS
        p4.font.size = Pt(10)
        p4.font.bold = True
        p4.font.color.rgb = RED_ACCENT
        p4.space_before = Pt(8)

    # Bottom Callout
    add_card(s3, Inches(0.8), Inches(5.9), Inches(11.73), Inches(0.85), bg_color=LIGHT_EMERALD, border_color=ACCENT_EMERALD)
    tb_c3 = s3.shapes.add_textbox(Inches(1.05), Inches(5.98), Inches(11.23), Inches(0.65))
    tf_c3 = tb_c3.text_frame
    tf_c3.word_wrap = True
    pc3 = tf_c3.paragraphs[0]
    pc3.text = "THE BHARATIMPACT DIFFERENTIATOR: Dual-Engine Architecture — AI Reads and Explains; Verified Empirical Formulas Calculate the Numbers with Zero Variance."
    pc3.font.name = FONT_SANS
    pc3.font.size = Pt(11)
    pc3.font.bold = True
    pc3.font.color.rgb = ACCENT_EMERALD

    add_footer(s3, 3)

    # ==========================================================
    # SLIDE 4: PROPOSED SOLUTION
    # ==========================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "03 | PROPOSED SOLUTION", "BharatImpact: The Macro-to-Household Engine", 
               "An autonomous financial event market impact graph delivering transparent, evidence-first economic intelligence.")

    # Core Definition Card
    add_card(s4, Inches(0.8), Inches(2.1), Inches(11.73), Inches(1.35), bg_color=WHITE, border_color=ACCENT_EMERALD)
    tb_p4 = s4.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(11.23), Inches(1.15))
    tf_p4 = tb_p4.text_frame
    tf_p4.word_wrap = True
    p1 = tf_p4.paragraphs[0]
    p1.text = "SOLUTION VISION & ARCHITECTURE"
    p1.font.name = FONT_SANS
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = ACCENT_EMERALD

    p2 = tf_p4.add_paragraph()
    p2.text = "BharatImpact parses verified global financial events into structured JSON, traverses a curated causal Directed Acyclic Graph (DAG) across key sectors, and computes microeconomic rupee impacts on Indian households using official MoSPI HCES 2023–24 fractile data."
    p2.font.name = FONT_SANS
    p2.font.size = Pt(12)
    p2.font.color.rgb = TEXT_PRIMARY
    p2.space_before = Pt(4)

    # 3 Pillars
    top4 = Inches(3.65)
    h4 = Inches(2.05)
    sol_cols = [
        ("PILLAR 1", "Causal Knowledge Graph", 
         "Multi-hop transmission network distinguishing Observed Facts (solid lines) from Inferred Elasticities (dashed lines), preventing false certainty."),
        ("PILLAR 2", "Household Impact Engine", 
         "Deterministic calculation calibrated to regional expenditure baskets (Madhya Pradesh urban/rural) across food, fuel, transport, and utilities."),
        ("PILLAR 3", "SIP Defensibility Simulator", 
         "Dynamic 6-month budget horizon forecasting that calculates safe, calibrated SIP modifications (e.g., reduce by ₹500/mo instead of canceling ₹5,000/mo).")
    ]
    for i, (tag, t, d) in enumerate(sol_cols):
        cx = start_left + i * (w3 + gap3)
        add_card(s4, cx, top4, w3, h4)
        tb = s4.shapes.add_textbox(cx + Inches(0.2), top4 + Inches(0.15), w3 - Inches(0.4), h4 - Inches(0.3))
        tf = tb.text_frame
        tf.word_wrap = True
        
        pt1 = tf.paragraphs[0]
        pt1.text = tag
        pt1.font.name = FONT_SANS
        pt1.font.size = Pt(9)
        pt1.font.bold = True
        pt1.font.color.rgb = ACCENT_EMERALD

        pt2 = tf.add_paragraph()
        pt2.text = t
        pt2.font.name = FONT_SERIF
        pt2.font.size = Pt(14)
        pt2.font.bold = True
        pt2.font.color.rgb = TEXT_PRIMARY
        pt2.space_before = Pt(3)

        pt3 = tf.add_paragraph()
        pt3.text = d
        pt3.font.name = FONT_SANS
        pt3.font.size = Pt(10)
        pt3.font.color.rgb = TEXT_SECONDARY
        pt3.space_before = Pt(4)

    # Key Metrics Bar
    metrics = [("100%", "Deterministic Calculations"), ("<15ms", "Traversal Latency"), ("MoSPI", "HCES 2023-24 Calibration"), ("AI-Off", "Zero-Variance Guarantee")]
    top_m = Inches(5.9)
    card_m_w = Inches(2.78)
    for i, (val, lbl) in enumerate(metrics):
        cx = start_left + i * (card_m_w + col_gap)
        add_card(s4, cx, top_m, card_m_w, Inches(0.85))
        tb_m = s4.shapes.add_textbox(cx, top_m + Inches(0.08), card_m_w, Inches(0.7))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        pm1 = tf_m.paragraphs[0]
        pm1.alignment = PP_ALIGN.CENTER
        pm1.text = val
        pm1.font.name = FONT_SERIF
        pm1.font.size = Pt(18)
        pm1.font.bold = True
        pm1.font.color.rgb = ACCENT_EMERALD
        
        pm2 = tf_m.add_paragraph()
        pm2.alignment = PP_ALIGN.CENTER
        pm2.text = lbl
        pm2.font.name = FONT_SANS
        pm2.font.size = Pt(9)
        pm2.font.color.rgb = TEXT_MUTED

    add_footer(s4, 4)

    # ==========================================================
    # SLIDE 5: SYSTEM ARCHITECTURE & DATA PIPELINE
    # ==========================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "04 | SYSTEM ARCHITECTURE", "Dual-Engine Architecture: AI Explains, Formulas Calculate", 
               "Strict isolation between AI natural language interpretation and deterministic mathematical computation.")

    # 4 Pipeline Stages
    top5 = Inches(2.1)
    h5 = Inches(3.2)
    stages = [
        ("STAGE 01", "News & Event Ingestion", "FastAPI / Pydantic Parser",
         "• Ingests verified global news wires.\n• Extracts structured JSON schema.\n• Validates magnitude & geography.\n• Missing attributes remain null."),
        ("STAGE 02", "Knowledge Graph Engine", "NetworkX / Directed DAG",
         "• 6 node types (Commodity, Sector, Item).\n• Multi-hop causal path finding.\n• Solid (Observed) vs Dashed (Inferred).\n• Source receipt attached to every edge."),
        ("STAGE 03", "Deterministic Math Engine", "Pure Python / Zero AI",
         "• MoSPI HCES 2023–24 fractile data.\n• PPAC fuel tax & freight elasticity.\n• Formula: ΔExp = MPCE × w × ΔP × η.\n• Zero synthetic zero substitutions."),
        ("STAGE 04", "Interactive UI & Audit", "React 19 / TypeScript / Vite",
         "• Dynamic 16:9 responsive viewport.\n• Clickable edge evidence drawers.\n• Persona-based expenditure breakdowns.\n• Instant AI-Off zero-variance toggle.")
    ]

    for i, (tag, t, sub, pts) in enumerate(stages):
        cx = start_left + i * (col_w + col_gap)
        add_card(s5, cx, top5, col_w, h5)
        tb = s5.shapes.add_textbox(cx + Inches(0.18), top5 + Inches(0.18), col_w - Inches(0.36), h5 - Inches(0.36))
        tf = tb.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD

        p2 = tf.add_paragraph()
        p2.text = t
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_before = Pt(3)

        p3 = tf.add_paragraph()
        p3.text = sub
        p3.font.name = FONT_SANS
        p3.font.size = Pt(9)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(2)

        p4 = tf.add_paragraph()
        p4.text = pts
        p4.font.name = FONT_SANS
        p4.font.size = Pt(10)
        p4.font.color.rgb = TEXT_SECONDARY
        p4.space_before = Pt(6)

    # Architectural Rules
    add_card(s5, Inches(0.8), Inches(5.5), Inches(5.75), Inches(1.25))
    tb_r1 = s5.shapes.add_textbox(Inches(1.0), Inches(5.55), Inches(5.35), Inches(1.15))
    tf_r1 = tb_r1.text_frame
    tf_r1.word_wrap = True
    pr1 = tf_r1.paragraphs[0]
    pr1.text = "ARCHITECTURAL RULE 1: Zero-Hallucination Firewall"
    pr1.font.name = FONT_SANS
    pr1.font.size = Pt(10)
    pr1.font.bold = True
    pr1.font.color.rgb = ACCENT_EMERALD
    pr1_d = tf_r1.add_paragraph()
    pr1_d.text = "LLMs summarize news and extract schema fields. Arithmetic calculations are 100% blocked from LLMs and handled exclusively by verified math functions."
    pr1_d.font.name = FONT_SANS
    pr1_d.font.size = Pt(10)
    pr1_d.font.color.rgb = TEXT_SECONDARY
    pr1_d.space_before = Pt(2)

    add_card(s5, Inches(6.78), Inches(5.5), Inches(5.75), Inches(1.25))
    tb_r2 = s5.shapes.add_textbox(Inches(6.98), Inches(5.55), Inches(5.35), Inches(1.15))
    tf_r2 = tb_r2.text_frame
    tf_r2.word_wrap = True
    pr2 = tf_r2.paragraphs[0]
    pr2.text = "ARCHITECTURAL RULE 2: Strict Missing-Data Contract"
    pr2.font.name = FONT_SANS
    pr2.font.size = Pt(10)
    pr2.font.bold = True
    pr2.font.color.rgb = ACCENT_EMERALD
    pr2_d = tf_r2.add_paragraph()
    pr2_d.text = "When empirical elasticity data is absent, the engine strictly outputs 'Data not available' rather than inserting 0 or inventing synthetic pass-through values."
    pr2_d.font.name = FONT_SANS
    pr2_d.font.size = Pt(10)
    pr2_d.font.color.rgb = TEXT_SECONDARY
    pr2_d.space_before = Pt(2)

    add_footer(s5, 5)

    # ==========================================================
    # SLIDE 6: METHODOLOGY & DATA RIGOR
    # ==========================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "05 | METHODOLOGY & DATA RIGOR", "Empirical Foundations: Zero-Hallucination Data Calibration", 
               "Grounding macroeconomic estimates in peer-reviewed econometric literature and official Government of India surveys.")

    # Left: Formula Box
    add_card(s6, Inches(0.8), Inches(2.1), Inches(5.75), Inches(3.6))
    tb_f = s6.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.35), Inches(3.4))
    tf_f = tb_f.text_frame
    tf_f.word_wrap = True
    
    pf1 = tf_f.paragraphs[0]
    pf1.text = "THE VERIFIED PASS-THROUGH FORMULA"
    pf1.font.name = FONT_SANS
    pf1.font.size = Pt(10)
    pf1.font.bold = True
    pf1.font.color.rgb = ACCENT_EMERALD

    pf2 = tf_f.add_paragraph()
    pf2.text = "ΔExpense_i = MPCE_baseline × w_i × (ΔP_shock × η_i) × (1 - β_policy)"
    pf2.font.name = "Courier New"
    pf2.font.size = Pt(11)
    pf2.font.bold = True
    pf2.font.color.rgb = TEXT_PRIMARY
    pf2.space_before = Pt(8)

    pf3 = tf_f.add_paragraph()
    pf3.text = "• MPCE_baseline: Monthly per capita consumer expenditure (HCES 2023–24).\n• w_i: Category expenditure weight (Food 28%, Fuel 19.4%, Utilities 19.5%).\n• ΔP_shock: Event magnitude shock extracted from verified source news (+12%).\n• η_i: Empirical pass-through elasticity factor (OMC pricing, freight costs).\n• β_policy: Fiscal mitigation cushion (e.g., state fuel VAT reduction buffer)."
    pf3.font.name = FONT_SANS
    pf3.font.size = Pt(10)
    pf3.font.color.rgb = TEXT_SECONDARY
    pf3.space_before = Pt(8)

    # Right: Audited Data Registers
    add_card(s6, Inches(6.78), Inches(2.1), Inches(5.75), Inches(3.6))
    tb_d = s6.shapes.add_textbox(Inches(6.98), Inches(2.2), Inches(5.35), Inches(3.4))
    tf_d = tb_d.text_frame
    tf_d.word_wrap = True

    pd1 = tf_d.paragraphs[0]
    pd1.text = "OFFICIAL GOVERNMENT DATA REGISTERS"
    pd1.font.name = FONT_SANS
    pd1.font.size = Pt(10)
    pd1.font.bold = True
    pd1.font.color.rgb = ACCENT_EMERALD

    pd2 = tf_d.add_paragraph()
    pd2.text = "• MoSPI HCES 2023–24 Factsheet (Aug 2024 Release):\n   - Madhya Pradesh Rural MPCE: ₹3,179\n   - Madhya Pradesh Urban MPCE: ₹5,200\n   - Fractile expenditure distributions across Q1–Q5 classes.\n• PPAC Historical Fuel Bulletins:\n   - Diesel/petrol retail pricing breakdown and OMC margin lag.\n• RBI & MoCI WPI-to-CPI Bulletins:\n   - 14–21 day wholesale-to-retail freight transmission delay.\n• Central Statistical Organisation (CSO):\n   - CPI basket weights for food and transport commodities."
    pd2.font.name = FONT_SANS
    pd2.font.size = Pt(10)
    pd2.font.color.rgb = TEXT_SECONDARY
    pd2.space_before = Pt(6)

    # Bottom: AI-Off Proof
    add_card(s6, Inches(0.8), Inches(5.9), Inches(11.73), Inches(0.85), bg_color=LIGHT_EMERALD, border_color=ACCENT_EMERALD)
    tb_p = s6.shapes.add_textbox(Inches(1.05), Inches(5.98), Inches(11.23), Inches(0.65))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True
    pp = tf_p.paragraphs[0]
    pp.text = "THE AI-OFF PROOF: Toggling AI to OFF removes natural language summaries, but leaves 100% of graph paths, node weights, and calculated rupee values completely unchanged with 0.00% variance."
    pp.font.name = FONT_SANS
    pp.font.size = Pt(11)
    pp.font.bold = True
    pp.font.color.rgb = ACCENT_EMERALD

    add_footer(s6, 6)

    # ==========================================================
    # SLIDE 7: ECONOMIC IMPACT GRAPH & TRANSMISSION
    # ==========================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "06 | KNOWLEDGE GRAPH", "Multi-Hop Event Propagation: From Global Shock to Kitchen", 
               "Visualizing the causal chain for the benchmark scenario: Crude Oil Price Shock (+12.0%).")

    # Benchmark Flow Panel
    add_card(s7, Inches(0.8), Inches(2.1), Inches(11.73), Inches(2.3), bg_color=WHITE, border_color=BORDER_MINT)
    tb_flow = s7.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(11.23), Inches(2.1))
    tf_flow = tb_flow.text_frame
    tf_flow.word_wrap = True

    p_fh = tf_flow.paragraphs[0]
    p_fh.text = "PRIMARY BENCHMARK TRANSMISSION CHAIN: CRUDE OIL (+12.0%)"
    p_fh.font.name = FONT_SANS
    p_fh.font.size = Pt(10)
    p_fh.font.bold = True
    p_fh.font.color.rgb = RED_ACCENT

    # Chain nodes
    nodes = [
        ("GLOBAL SHOCK", "Crude Oil", "+12.0% (Brent $82.4)"),
        ("REFINERY", "Petrol & Diesel", "+8.5% (OMC Pricing)"),
        ("FREIGHT", "Commercial Logistics", "+6.2% (Interstate Trucks)"),
        ("WHOLESALE", "Mandi Vegetables", "+3.2% (Transit Spoilage)"),
        ("HOUSEHOLD", "Urban Middle Class", "+₹2,450 /mo (+4.3%)")
    ]
    p_fn = tf_flow.add_paragraph()
    p_fn.text = "  →  ".join([f"[{stage}: {item} ({val})]" for stage, item, val in nodes])
    p_fn.font.name = FONT_SANS
    p_fn.font.size = Pt(11)
    p_fn.font.bold = True
    p_fn.font.color.rgb = TEXT_PRIMARY
    p_fn.space_before = Pt(8)

    p_fd = tf_flow.add_paragraph()
    p_fd.text = "Edge Epistemology: Solid Lines represent Observed Facts (Government OMC decrees, PPAC records); Dashed Lines represent Inferred Elasticities (Econometric regression estimates with confidence scores)."
    p_fd.font.name = FONT_SANS
    p_fd.font.size = Pt(10)
    p_fd.font.color.rgb = TEXT_SECONDARY
    p_fd.space_before = Pt(8)

    # 3 Pathways
    top7 = Inches(4.6)
    h7 = Inches(2.15)
    paths = [
        ("PATH A", "Food Cost Chain", "Crude → Diesel → Long-Haul Logistics → Mandi Arrival → Retail Kitchen Groceries (+₹720/mo burden)."),
        ("PATH B", "Transport & Freight", "Crude → Retail Petrol & Diesel → Daily Commute in Tier-2 Indian cities (+₹750/mo direct fuel burden)."),
        ("PATH C", "Financial Markets & SIP", "Crude → Inflation Expectations → Bond Yields & Discretionary Squeeze → SIP capacity contraction (-10%).")
    ]
    for i, (tag, t, d) in enumerate(paths):
        cx = start_left + i * (w3 + gap3)
        add_card(s7, cx, top7, w3, h7)
        tb_p = s7.shapes.add_textbox(cx + Inches(0.2), top7 + Inches(0.18), w3 - Inches(0.4), h7 - Inches(0.36))
        tf_p = tb_p.text_frame
        tf_p.word_wrap = True

        p1 = tf_p.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD

        p2 = tf_p.add_paragraph()
        p2.text = t
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(14)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_before = Pt(3)

        p3 = tf_p.add_paragraph()
        p3.text = d
        p3.font.name = FONT_SANS
        p3.font.size = Pt(10)
        p3.font.color.rgb = TEXT_SECONDARY
        p3.space_before = Pt(4)

    add_footer(s7, 7)

    # ==========================================================
    # SLIDE 8: MARKET & SECTOR ANALYSIS
    # ==========================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "07 | SECTOR ANALYSIS", "Sectoral Vulnerability, Margins & Pass-Through Elasticity", 
               "Analyzing margin compression, import dependence, and pricing power across Indian industrial sectors.")

    top8 = Inches(2.1)
    h8 = Inches(3.4)
    sectors = [
        ("HIGH EXPOSURE", "Automotive & EV", "85% Exposure Score",
         "• Production costs: +10.0%\n• Higher steel & freight costs\n• Vehicle sticker price hikes\n• Consumer elasticity: -0.6"),
        ("HIGH EXPOSURE", "Aviation & Logistics", "70% Exposure Score",
         "• ATF Fuel prices: +11.0%\n• Operating margin hit: -3.5%\n• Freight cargo surcharges\n• Immediate earnings drop"),
        ("MEDIUM EXPOSURE", "FMCG & Food", "55% Exposure Score",
         "• Packaging & diesel: +3.2%\n• Edible oil import pressures\n• Pack grammage reduction\n• Muted rural volume growth"),
        ("DEFENSIVE", "IT & Digital Services", "30% Exposure Score",
         "• Indirect overhead: +0.8%\n• Insulated from fuel costs\n• Currency depreciation hedge\n• Defensive market role")
    ]

    for i, (tag, t, sub, pts) in enumerate(sectors):
        cx = start_left + i * (col_w + col_gap)
        add_card(s8, cx, top8, col_w, h8)
        tb_sec = s8.shapes.add_textbox(cx + Inches(0.18), top8 + Inches(0.18), col_w - Inches(0.36), h8 - Inches(0.36))
        tf_sec = tb_sec.text_frame
        tf_sec.word_wrap = True

        p1 = tf_sec.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = RED_ACCENT if "HIGH" in tag else (AMBER_ACCENT if "MEDIUM" in tag else ACCENT_EMERALD)

        p2 = tf_sec.add_paragraph()
        p2.text = t
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY
        p2.space_before = Pt(3)

        p3 = tf_sec.add_paragraph()
        p3.text = sub
        p3.font.name = FONT_SANS
        p3.font.size = Pt(9)
        p3.font.color.rgb = TEXT_MUTED
        p3.space_before = Pt(2)

        p4 = tf_sec.add_paragraph()
        p4.text = pts
        p4.font.name = FONT_SANS
        p4.font.size = Pt(10)
        p4.font.color.rgb = TEXT_SECONDARY
        p4.space_before = Pt(6)

    # Bottom Dependency Callout
    add_card(s8, Inches(0.8), Inches(5.7), Inches(11.73), Inches(1.05))
    tb_imp = s8.shapes.add_textbox(Inches(1.05), Inches(5.78), Inches(11.23), Inches(0.85))
    tf_imp = tb_imp.text_frame
    tf_imp.word_wrap = True
    pi1 = tf_imp.paragraphs[0]
    pi1.text = "IMPORT DEPENDENCE VULNERABILITY: India imports 85%+ of crude oil and 76% of semiconductors."
    pi1.font.name = FONT_SANS
    pi1.font.size = Pt(11)
    pi1.font.bold = True
    pi1.font.color.rgb = ACCENT_EMERALD
    pi2 = tf_imp.add_paragraph()
    pi2.text = "Sectors with zero domestic raw material substitution suffer immediate cost-push margin degradation, which firms pass directly to retail consumers within 30 to 60 days."
    pi2.font.name = FONT_SANS
    pi2.font.size = Pt(10)
    pi2.font.color.rgb = TEXT_SECONDARY
    pi2.space_before = Pt(3)

    add_footer(s8, 8)

    # ==========================================================
    # SLIDE 9: HOUSEHOLD IMPACT & REGIONAL CALIBRATION
    # ==========================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "08 | HOUSEHOLD BUDGET IMPACT", "Microeconomic Calibration: Quantifying the Rupee Burden", 
               "Grounding macroeconomic shocks into monthly rupee expense line-items for middle-class Indian families.")

    # 3 Summary Cards
    top9 = Inches(2.1)
    h9 = Inches(1.8)
    hcards = [
        ("PERSONA ARCHETYPE", "Urban Middle Class", "Indore, Madhya Pradesh (Family of 4)\n• Monthly Income: ₹60,000\n• Baseline Expenses: ₹42,550/mo"),
        ("SHOCK EXPANSION", "+₹2,450 / month", "+4.3% expansion over baseline\n• Post-shock budget: ₹45,000/mo\n• Savings compressed to ₹10,000/mo"),
        ("SURVEY CALIBRATION", "MoSPI HCES 2023–24", "Empirical Baseline Calibration\n• MP Urban MPCE: ₹5,200\n• Realistic commodity weights")
    ]
    for i, (tag, t, d) in enumerate(hcards):
        cx = start_left + i * (w3 + gap3)
        add_card(s9, cx, top9, w3, h9)
        tb_h = s9.shapes.add_textbox(cx + Inches(0.2), top9 + Inches(0.15), w3 - Inches(0.4), h9 - Inches(0.3))
        tf_h = tb_h.text_frame
        tf_h.word_wrap = True

        p1 = tf_h.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = RED_ACCENT if "SHOCK" in tag else ACCENT_EMERALD

        p2 = tf_h.add_paragraph()
        p2.text = t
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = RED_ACCENT if "SHOCK" in tag else TEXT_PRIMARY
        p2.space_before = Pt(3)

        p3 = tf_h.add_paragraph()
        p3.text = d
        p3.font.name = FONT_SANS
        p3.font.size = Pt(10)
        p3.font.color.rgb = TEXT_SECONDARY
        p3.space_before = Pt(3)

    # Itemized Table
    top_t = Inches(4.1)
    add_card(s9, Inches(0.8), top_t, Inches(11.73), Inches(2.65))
    tb_tab = s9.shapes.add_textbox(Inches(1.05), top_t + Inches(0.15), Inches(11.23), Inches(2.35))
    tf_tab = tb_tab.text_frame
    tf_tab.word_wrap = True

    pt_h = tf_tab.paragraphs[0]
    pt_h.text = "ITEMIZED MONTHLY EXPENSE SHOCK BREAKDOWN (CRUDE +12% SHOCK)"
    pt_h.font.name = FONT_SANS
    pt_h.font.size = Pt(10)
    pt_h.font.bold = True
    pt_h.font.color.rgb = ACCENT_EMERALD

    items = [
        ("Transport & Fuel", "+₹750 /mo", "+10.0%", "Direct petrol, diesel, and scooter commute expenses"),
        ("Food & Groceries", "+₹720 /mo", "+6.0%", "Mandi vegetable freight and edible oil distribution"),
        ("Consumer Electronics", "+₹380 /mo", "+3.5%", "Component tariffs and replacement appliances"),
        ("Housing & Utilities", "+₹280 /mo", "+3.5%", "LPG cylinder refilling and electricity tariffs"),
        ("Healthcare & Other", "+₹320 /mo", "+4.7%", "Packaging and transport costs for essential medicines")
    ]

    for cat, amt, pct, note in items:
        p_row = tf_tab.add_paragraph()
        p_row.text = f"• {cat:<24} {amt:<16} ({pct:<6}) — {note}"
        p_row.font.name = FONT_SANS
        p_row.font.size = Pt(10)
        p_row.font.color.rgb = TEXT_PRIMARY
        p_row.space_before = Pt(3)

    add_footer(s9, 9)

    # ==========================================================
    # SLIDE 10: SIP AFFORDABILITY & COMPOUNDING PRESERVATION
    # ==========================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "09 | INVESTMENTS & SIP AFFORDABILITY", "Preserving the Retail Investor: The SIP Defensibility Model", 
               "Transforming inflationary budget pressure into disciplined micro-adjustments instead of wealth-destroying SIP cancellations.")

    w2 = Inches(5.75)
    gap2 = Inches(0.23)
    top10 = Inches(2.1)
    h10 = Inches(2.1)

    # Left: The Trap
    add_card(s10, Inches(0.8), top10, w2, h10)
    tb_t = s10.shapes.add_textbox(Inches(1.0), top10 + Inches(0.15), w2 - Inches(0.4), h10 - Inches(0.3))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True
    p1 = tf_t.paragraphs[0]
    p1.text = "THE PANIC CANCELLATION REFLEX"
    p1.font.name = FONT_SANS
    p1.font.size = Pt(10)
    p1.font.bold = True
    p1.font.color.rgb = RED_ACCENT
    p2 = tf_t.add_paragraph()
    p2.text = "When monthly expenses surge by ₹2,450, retail investors panic and halt their entire ₹5,000 ongoing monthly SIP. Stopping a SIP for 12 months causes an irreversible loss of ₹26.8 Lakhs in projected 15-year wealth."
    p2.font.name = FONT_SANS
    p2.font.size = Pt(11)
    p2.font.color.rgb = TEXT_SECONDARY
    p2.space_before = Pt(4)

    # Right: BharatImpact Solution
    add_card(s10, Inches(6.78), top10, w2, h10, bg_color=WHITE, border_color=ACCENT_EMERALD)
    tb_sol = s10.shapes.add_textbox(Inches(6.98), top10 + Inches(0.15), w2 - Inches(0.4), h10 - Inches(0.3))
    tf_sol = tb_sol.text_frame
    tf_sol.word_wrap = True
    p1s = tf_sol.paragraphs[0]
    p1s.text = "BHARATIMPACT TACTICAL RECALIBRATION"
    p1s.font.name = FONT_SANS
    p1s.font.size = Pt(10)
    p1s.font.bold = True
    p1s.font.color.rgb = ACCENT_EMERALD
    p2s = tf_sol.add_paragraph()
    p2s.text = "BharatImpact calculates a disciplined tactical adjustment: reduce SIP by only ₹500 (10%) to ₹4,500/month during the 6-month shock window. This preserves 90% of the compounding snowball, securing a ₹1.07 Cr terminal corpus."
    p2s.font.name = FONT_SANS
    p2s.font.size = Pt(11)
    p2s.font.color.rgb = TEXT_PRIMARY
    p2s.space_before = Pt(4)

    # 3 Wealth Outcomes
    top_w = Inches(4.4)
    hw = Inches(2.35)
    w_outcomes = [
        ("BASELINE SCENARIO", "₹1.34 Crore", "Ongoing SIP: ₹5,000 / month", "Full compounding snowball rolling uninterrupted @ 12% CAGR."),
        ("BHARATIMPACT TACTICAL", "₹1.07 Crore", "Calibrated SIP: ₹4,500 / month", "Protects 80%+ of terminal wealth with a minor ₹500/mo buffer."),
        ("PANIC CANCELLATION", "₹80.3 Lakhs", "Halted SIP: ₹3,000 or complete stop", "Permanent wealth destruction of ₹27 Lakhs+ avoided by BharatImpact.")
    ]
    for i, (tag, val, sub, note) in enumerate(w_outcomes):
        cx = start_left + i * (w3 + gap3)
        add_card(s10, cx, top_w, w3, hw, bg_color=WHITE, border_color=ACCENT_EMERALD if "TACTICAL" in tag else CARD_BORDER)
        tb_w = s10.shapes.add_textbox(cx + Inches(0.2), top_w + Inches(0.18), w3 - Inches(0.4), hw - Inches(0.36))
        tf_w = tb_w.text_frame
        tf_w.word_wrap = True

        p1 = tf_w.paragraphs[0]
        p1.text = tag
        p1.font.name = FONT_SANS
        p1.font.size = Pt(9)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD if "TACTICAL" in tag else (RED_ACCENT if "PANIC" in tag else TEXT_MUTED)

        p2 = tf_w.add_paragraph()
        p2.text = val
        p2.font.name = FONT_SERIF
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = ACCENT_EMERALD if "TACTICAL" in tag else (RED_ACCENT if "PANIC" in tag else TEXT_PRIMARY)
        p2.space_before = Pt(4)

        p3 = tf_w.add_paragraph()
        p3.text = sub
        p3.font.name = FONT_SANS
        p3.font.size = Pt(10)
        p3.font.bold = True
        p3.font.color.rgb = TEXT_PRIMARY
        p3.space_before = Pt(2)

        p4 = tf_w.add_paragraph()
        p4.text = note
        p4.font.name = FONT_SANS
        p4.font.size = Pt(10)
        p4.font.color.rgb = TEXT_SECONDARY
        p4.space_before = Pt(4)

    add_footer(s10, 10)

    # ==========================================================
    # SLIDE 11: IMPLEMENTATION STATUS & BENCHMARKS
    # ==========================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "10 | IMPLEMENTATION & BENCHMARKS", "Engine Verification, Test Coverage & Acceptance Benchmarks", 
               "Fully implemented production architecture validated through rigorous test suites and empirical telemetry.")

    # 4 Stat Cards
    top11 = Inches(2.1)
    h11 = Inches(1.3)
    bench_stats = [
        ("270", "Backend Unit Tests", "100% PyTest Clean"),
        ("198", "Frontend Unit Tests", "20/20 Vitest Suites"),
        ("<15ms", "Recalculation Latency", "Deterministic Graph"),
        ("0.0 MB", "Memory Leak Footprint", "Zero Memory Drift")
    ]
    for i, (val, lbl, sub) in enumerate(bench_stats):
        cx = start_left + i * (col_w + col_gap)
        add_card(s11, cx, top11, col_w, h11)
        tb_st = s11.shapes.add_textbox(cx, top11 + Inches(0.1), col_w, h11 - Inches(0.2))
        tf_st = tb_st.text_frame
        tf_st.word_wrap = True
        
        p1 = tf_st.paragraphs[0]
        p1.alignment = PP_ALIGN.CENTER
        p1.text = val
        p1.font.name = FONT_SERIF
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_EMERALD

        p2 = tf_st.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        p2.text = lbl
        p2.font.name = FONT_SANS
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_PRIMARY

        p3 = tf_st.add_paragraph()
        p3.alignment = PP_ALIGN.CENTER
        p3.text = sub
        p3.font.name = FONT_SANS
        p3.font.size = Pt(9)
        p3.font.color.rgb = TEXT_MUTED

    # Acceptance Criteria Verification Table
    top_act = Inches(3.6)
    h_act = Inches(3.1)
    add_card(s11, Inches(0.8), top_act, Inches(11.73), h_act)
    tb_act = s11.shapes.add_textbox(Inches(1.05), top_act + Inches(0.15), Inches(11.23), h_act - Inches(0.3))
    tf_act = tb_act.text_frame
    tf_act.word_wrap = True

    p_ah = tf_act.paragraphs[0]
    p_ah.text = "HACKWAVE 3.0 ACCEPTANCE CRITERIA VERIFICATION MATRIX"
    p_ah.font.name = FONT_SANS
    p_ah.font.size = Pt(10)
    p_ah.font.bold = True
    p_ah.font.color.rgb = ACCENT_EMERALD

    criteria = [
        ("Structured Schema Extraction", "PASSED", "JSON conforms to event-extraction-schema.json; missing fields remain null."),
        ("Observed vs Inferred Distinction", "PASSED", "Visual hierarchy renders solid green lines for facts and dashed for elasticities."),
        ("Three Distinct Propagation Paths", "PASSED", "Path A (Food), Path B (Transport), and Path C (Financial Markets) fully navigable."),
        ("Inspectable Edge Receipts", "PASSED", "Evidence drawer displays source title, vintage, table ID, and breakout caveats."),
        ("Regional Persona Selector", "PASSED", "Calibrated for Madhya Pradesh (Urban & Rural) across Q1-Q5 expenditure classes."),
        ("Deterministic Rupee Calculations", "PASSED", "Zero-AI math formulas grounded in MoSPI HCES 2023-24 baseline MPCE."),
        ("Strict Missing-Data Handling", "PASSED", "Displays explicit 'Data not available' state; zero synthetic 0 insertions."),
        ("AI-Off Parity Verification", "PASSED", "Toggling AI off leaves all graph structures and rupee calculations 100% identical.")
    ]

    for title, status, desc in criteria:
        p_c = tf_act.add_paragraph()
        p_c.text = f"✓ {title:<32} [{status}] — {desc}"
        p_c.font.name = FONT_SANS
        p_c.font.size = Pt(9.5)
        p_c.font.color.rgb = TEXT_PRIMARY
        p_c.space_before = Pt(3)

    add_footer(s11, 11)

    # ==========================================================
    # SLIDE 12: LIMITATIONS, GOVERNANCE & CONCLUSION
    # ==========================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "11 | CONCLUSION & ROADMAP", "Intellectual Honesty, Model Boundaries & Strategic Vision", 
               "Acknowledging model boundaries while charting the roadmap to democratize economic foresight for every Indian household.")

    top12 = Inches(2.1)
    h12 = Inches(3.3)

    # Left: Limitations
    add_card(s12, Inches(0.8), top12, w2, h12)
    tb_l = s12.shapes.add_textbox(Inches(1.0), top12 + Inches(0.18), w2 - Inches(0.4), h12 - Inches(0.36))
    tf_l = tb_l.text_frame
    tf_l.word_wrap = True

    pl1 = tf_l.paragraphs[0]
    pl1.text = "MODEL BOUNDARIES & GOVERNANCE"
    pl1.font.name = FONT_SANS
    pl1.font.size = Pt(10)
    pl1.font.bold = True
    pl1.font.color.rgb = AMBER_ACCENT

    pl2 = tf_l.add_paragraph()
    pl2.text = "• No Equity Market Speculation:\n   - BharatImpact maps input cost pass-through, not day-trading stock forecasts.\n• Commercial Contract Absorption Lag:\n   - Long-term corporate freight contracts delay price transmission by 14–30 days.\n• Unannounced Fiscal Interventions:\n   - Sudden excise cuts or export curbs alter pass-through chains; captured as explicit caveats in evidence receipts.\n• Data Freshness Constraints:\n   - Official HCES data releases occur periodically; interim periods use degraded confidence scoring."
    pl2.font.name = FONT_SANS
    pl2.font.size = Pt(10)
    pl2.font.color.rgb = TEXT_SECONDARY
    pl2.space_before = Pt(6)

    # Right: Roadmap
    add_card(s12, Inches(6.78), top12, w2, h12)
    tb_rm = s12.shapes.add_textbox(Inches(6.98), top12 + Inches(0.18), w2 - Inches(0.4), h12 - Inches(0.36))
    tf_rm = tb_rm.text_frame
    tf_rm.word_wrap = True

    pr1 = tf_rm.paragraphs[0]
    pr1.text = "STRATEGIC ROADMAP (POST-HACKATHON)"
    pr1.font.name = FONT_SANS
    pr1.font.size = Pt(10)
    pr1.font.bold = True
    pr1.font.color.rgb = ACCENT_EMERALD

    pr2 = tf_rm.add_paragraph()
    pr2.text = "• Account Aggregator (AA) Integration:\n   - Consent-driven banking feed synchronization for dynamic, hyper-personalized household spending elasticity.\n• Vernacular Voice Interface:\n   - Hindi, Marathi, and Bengali conversational queries for rural agricultural households.\n• Real-Time Mandi API Linkages:\n   - Direct integration with Agmarknet for district-level agricultural price tracking.\n• Central Bank & Regulatory Policy Parser:\n   - Automated MPC rate cut transmission modeling to home loan EMIs."
    pr2.font.name = FONT_SANS
    pr2.font.size = Pt(10)
    pr2.font.color.rgb = TEXT_SECONDARY
    pr2.space_before = Pt(6)

    # Closing Callout
    add_card(s12, Inches(0.8), Inches(5.6), Inches(11.73), Inches(1.15), bg_color=LIGHT_EMERALD, border_color=ACCENT_EMERALD)
    tb_close = s12.shapes.add_textbox(Inches(1.05), Inches(5.68), Inches(11.23), Inches(0.95))
    tf_close = tb_close.text_frame
    tf_close.word_wrap = True
    
    pcl1 = tf_close.paragraphs[0]
    pcl1.text = '"Democratizing macroeconomic intelligence from global financial corridors to everyday Indian kitchens."'
    pcl1.font.name = FONT_SERIF
    pcl1.font.size = Pt(14)
    pcl1.font.bold = True
    pcl1.font.color.rgb = TEXT_PRIMARY

    pcl2 = tf_close.add_paragraph()
    pcl2.text = "BharatImpact demonstrates that AI interpretation and empirical financial rigor can coexist seamlessly: leveraging NLP for comprehension, while anchoring every single rupee in verified government truth."
    pcl2.font.name = FONT_SANS
    pcl2.font.size = Pt(11)
    pcl2.font.color.rgb = ACCENT_EMERALD
    pcl2.space_before = Pt(4)

    add_footer(s12, 12)

    # Save PPTX
    out_dir = r"e:\SANKALP 3.0\india-impact-graph\docs\presentation"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "BharatImpact_Institutional_Presentation.pptx")
    prs.save(out_path)
    print(f"Successfully generated 16:9 presentation at: {out_path}")

if __name__ == "__main__":
    create_presentation()
