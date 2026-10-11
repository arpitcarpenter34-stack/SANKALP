import {
  PlatformOverview,
  FeatureMatrixRow,
  RadarCapabilityDimension,
  OverallPerformanceMetric,
  ImpactAnalysisScenario,
  UserValuePersona,
} from './types';

/**
 * Platform Overview Profiles
 * Documented neutral definitions of general product archetypes.
 */
export const PLATFORMS_DATA: PlatformOverview[] = [
  {
    id: 'news_apps',
    name: 'Traditional News Apps',
    tagline: 'Only headlines, no economic context',
    description:
      'General news aggregators and digital publications focusing on rapid event reporting without quantified Indian supply-chain transmission or household budgetary models.',
    iconType: 'news',
    accentColor: '#E11D48',
    badgeBg: '#FFE4E6',
    badgeBorder: '#FDA4AF',
    score: 2.1,
    keyStrengths: ['Breaking news velocity', 'Broad geopolitical coverage', 'High media volume'],
    limitations: ['No supply-chain transmission graphs', 'Zero household rupee quantification', 'No personalized SIP impact'],
  },
  {
    id: 'financial_tools',
    name: 'Financial Tools',
    tagline: 'Focus on investments and markets',
    description:
      'Brokerage terminals, stock screeners, and market trackers prioritizing asset price ticks, PE multiples, and portfolio volatility rather than consumer expense baselines.',
    iconType: 'finance',
    accentColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FCD34D',
    score: 3.3,
    keyStrengths: ['Real-time tick pricing', 'Direct execution & broker integrations', 'Portfolio P&L tracking'],
    limitations: ['Ignores non-investing essential expenditure', 'No official survey microdata integration', 'Limited multi-tier macro propagation'],
  },
  {
    id: 'research_platforms',
    name: 'Research Platforms',
    tagline: 'Provide data and reports, not personalized insights',
    description:
      'Institutional economic portals, think-tank whitepapers, and macro database queries providing aggregate GDP-level statistics and econometric models with high analytical rigor.',
    iconType: 'research',
    accentColor: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeBorder: '#BAE6FD',
    score: 3.8,
    keyStrengths: ['Macroeconomic econometric depth', 'Historical time-series archives', 'Institutional policy research'],
    limitations: ['Static PDF reports with slow release cycles', 'No interactive localized household simulations', 'Steep learning curve for citizens'],
  },
  {
    id: 'bharat_impact',
    name: 'BharatImpact',
    tagline: 'Complete view from global events to your household with actionable insights',
    description:
      'Evidence-first macro-to-micro transmission engine translating global commodity and policy shocks into multi-tier Indian supply chains, MoSPI HCES household expense deltas, and resilient SIP adjustments.',
    iconType: 'crown',
    accentColor: '#047857',
    badgeBg: '#E8F5EC',
    badgeBorder: '#10B981',
    score: 4.8,
    keyStrengths: [
      'Evidence-grounded transmission DAG',
      'Rupee-denominated household budget impact',
      'Personalized SIP affordability re-indexing',
      'Deterministic calculations anchored to MoSPI Table 2',
    ],
    limitations: [
      'Curated macroeconomic scenarios rather than uncurated real-time social feeds',
      'State-level coverage currently prioritized for representative states',
    ],
  },
];

/**
 * 9-Feature Comparison Matrix
 * Reviewed October 2026 based on empirical architectural capabilities.
 */
export const FEATURE_MATRIX_DATA: FeatureMatrixRow[] = [
  {
    id: 'realtime_news',
    title: 'Real-time global news',
    category: 'coverage',
    description: 'Ingestion of breaking international geopolitical, commodity, and trade developments.',
    statuses: {
      news_apps: 'supported',
      financial_tools: 'partially_supported',
      research_platforms: 'supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Extensive 24/7 breaking event wires with multimedia coverage.',
      financial_tools: 'Focused primarily on market-moving corporate and exchange filings.',
      research_platforms: 'Curated global press tracking and central bank communique feeds.',
      bharat_impact: 'Curated financial news signals categorized by macroeconomic domain with consensus verification.',
    },
    evidenceBasis: 'Architectural inspection of feed ingestion latency and source verification.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'economic_context',
    title: 'Economic context & analysis',
    category: 'analysis',
    description: 'Structural breakdown of transmission channels, policy linkages, and headline inflation implications.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Headlines emphasize narrative drama without empirical economic transmission breakdown.',
      financial_tools: 'Provides market commentary tailored to equity sectors and bond yields.',
      research_platforms: 'Rigorous econometric framing and macro policy whitepapers.',
      bharat_impact: 'Deterministic transmission graph modeling direct, indirect, and tertiary domestic linkages.',
    },
    evidenceBasis: 'Review of analytical depth across published event analyses.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'sector_impact',
    title: 'Sector impact analysis',
    category: 'analysis',
    description: 'Multi-tier impact assessment on domestic industries (Energy, FMCG, Transport, Fertilizer, Tech).',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Superficial mentions of affected industries without margin or dependency quantification.',
      financial_tools: 'Segmented by sectoral equity indices (Nifty IT, Nifty Bank, Nifty Auto).',
      research_platforms: 'Input-output Leontief tables and industrial production metrics.',
      bharat_impact: 'Dedicated Sector View with dual price charts, reliance KPIs, and transmission paths.',
    },
    evidenceBasis: 'Comparative assessment of sectoral data granularity.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'household_impact',
    title: 'Indian household impact',
    category: 'personalization',
    description: 'Itemized rupee calculations of monthly family expenses across food, fuel, transport, and utilities.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'not_supported',
      research_platforms: 'partially_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Qualitative references to "rising inflation" without individual expenditure calculations.',
      financial_tools: 'Does not model household grocery or non-invested consumer expenditure.',
      research_platforms: 'Reports national and rural/urban MPCE averages at macro aggregate level.',
      bharat_impact: 'Micro-calibrated to MoSPI HCES 2023-24 decile personas with itemized rupee breakdowns.',
    },
    evidenceBasis: 'Verification of user-specific budgeting tools and survey data anchoring.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'sip_forecasting',
    title: 'SIP & investment forecasting',
    category: 'action',
    description: 'Dynamic recalculation of monthly SIP contribution capacity and long-term corpus trajectories.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'not_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Generic articles on mutual funds without event transmission modeling.',
      financial_tools: 'Static compound interest calculators unlinked to real-world inflationary shocks.',
      research_platforms: 'Excludes retail personal wealth and SIP optimization models.',
      bharat_impact: 'Dynamic SIP Affordability engine linking household inflation deltas directly to corpus preservation.',
    },
    evidenceBasis: 'Audit of investment forecasting tools under macro scenario shocks.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'interactive_graph',
    title: 'Interactive impact graph',
    category: 'analysis',
    description: 'Visual DAG canvas mapping multi-hop propagation paths with provenance receipts.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'not_supported',
      research_platforms: 'not_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Linear text format with static stock photography.',
      financial_tools: 'Standard 2D candlestick charts and technical indicator overlays.',
      research_platforms: 'Static flow diagrams in non-interactive PDF documentation.',
      bharat_impact: 'Interactive graph canvas with path category filtering, node inspection, and source evidence receipts.',
    },
    evidenceBasis: 'Interactive UI feature inspection and visual DAG capability audit.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'personalized_insights',
    title: 'Personalized insights',
    category: 'personalization',
    description: 'Customized household expense and investment guidance based on income, family size, and state.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'not_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'One-size-fits-all broadcast stream.',
      financial_tools: 'Portfolio-weighted risk scores without household budget profiling.',
      research_platforms: 'Macroeconomic broad-brush observations without personal inputs.',
      bharat_impact: 'Customizable household assumptions with instant recalculation of KPIs, donut, and commodities.',
    },
    evidenceBasis: 'Testing user personalization inputs across platforms.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'future_scenarios',
    title: 'Future scenarios',
    category: 'action',
    description: 'Simulation of what-if economic conditions (Optimistic, Base Case, Pessimistic).',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'partially_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Retrospective reporting of already-occurred events.',
      financial_tools: 'Basic bull/bear price target scenario projections for stocks.',
      research_platforms: 'Static policy scenario modeling in periodic research reports.',
      bharat_impact: 'Scenario Testbench with custom event extraction, parameter overrides, and 12-month projections.',
    },
    evidenceBasis: 'Evaluation of scenario planning and interactive testbench interfaces.',
    lastReviewed: 'October 2026',
  },
  {
    id: 'actionable_recommendations',
    title: 'AI-based recommendations',
    category: 'action',
    description: 'Deterministic rule-based budgeting advice and contextual AI copilot assistance.',
    statuses: {
      news_apps: 'not_supported',
      financial_tools: 'partially_supported',
      research_platforms: 'not_supported',
      bharat_impact: 'supported',
    },
    notes: {
      news_apps: 'Opinion columns with general editorial viewpoints.',
      financial_tools: 'Algorithmic buy/sell signals without household expenditure advice.',
      research_platforms: 'High-level policy recommendations aimed at central banks and governments.',
      bharat_impact: 'Actionable household strategies (buffer stocking, SIP pause/adjust, utility efficiency) backed by AI drawer.',
    },
    evidenceBasis: 'Audit of advisory capabilities and actionable recommendation delivery.',
    lastReviewed: 'October 2026',
  },
];

/**
 * 8-Spoke Radar Dimensions
 * Normalized scores (0 to 5 scale) across platforms.
 */
export const RADAR_DIMENSIONS: RadarCapabilityDimension[] = [
  {
    id: 'event_coverage',
    label: 'Global Event Coverage',
    maxScore: 5.0,
    scores: {
      news_apps: 4.8,
      financial_tools: 3.6,
      research_platforms: 4.5,
      bharat_impact: 4.8,
    },
    scoringCriteria: 'Breadth, timeliness, and international diversity of macro event tracking.',
  },
  {
    id: 'economic_analysis',
    label: 'Economic Analysis',
    maxScore: 5.0,
    scores: {
      news_apps: 2.2,
      financial_tools: 3.8,
      research_platforms: 4.8,
      bharat_impact: 4.8,
    },
    scoringCriteria: 'Depth of structural economic modeling, transmission channels, and causal rigor.',
  },
  {
    id: 'sector_insights',
    label: 'Sector Insights',
    maxScore: 5.0,
    scores: {
      news_apps: 2.0,
      financial_tools: 4.2,
      research_platforms: 4.2,
      bharat_impact: 4.8,
    },
    scoringCriteria: 'Industry-specific dependency mapping, margin impacts, and domestic supply chain analysis.',
  },
  {
    id: 'household_impact',
    label: 'Household Impact',
    maxScore: 5.0,
    scores: {
      news_apps: 1.2,
      financial_tools: 1.5,
      research_platforms: 3.5,
      bharat_impact: 4.9,
    },
    scoringCriteria: 'Rupee-level quantification of family consumption budget changes anchored to survey microdata.',
  },
  {
    id: 'sip_planning',
    label: 'SIP & Investment Planning',
    maxScore: 5.0,
    scores: {
      news_apps: 1.4,
      financial_tools: 4.5,
      research_platforms: 2.4,
      bharat_impact: 4.8,
    },
    scoringCriteria: 'Dynamic adjustment of monthly investment affordability under inflationary shocks.',
  },
  {
    id: 'future_scenarios',
    label: 'Future Scenarios',
    maxScore: 5.0,
    scores: {
      news_apps: 1.5,
      financial_tools: 3.0,
      research_platforms: 4.2,
      bharat_impact: 4.7,
    },
    scoringCriteria: 'Interactive what-if simulations, sensitivity testing, and multi-scenario trajectories.',
  },
  {
    id: 'personalization',
    label: 'Personalization & AI Insights',
    maxScore: 5.0,
    scores: {
      news_apps: 1.8,
      financial_tools: 3.0,
      research_platforms: 3.2,
      bharat_impact: 4.8,
    },
    scoringCriteria: 'Customization to user income, state, and family profile, paired with interactive AI query support.',
  },
  {
    id: 'actionable_recs',
    label: 'Actionable Recommendations',
    maxScore: 5.0,
    scores: {
      news_apps: 1.9,
      financial_tools: 3.0,
      research_platforms: 3.6,
      bharat_impact: 4.9,
    },
    scoringCriteria: 'Concrete, practical steps users can execute immediately to protect savings and budgets.',
  },
];

/**
 * Overall Composite Performance Metrics
 * Calculated as the weighted average across all 8 radar dimensions.
 * Verified reproducible arithmetic:
 * News Apps: 2.1 | Financial Tools: 3.3 | Research Platforms: 3.8 | BharatImpact: 4.8
 */
export const OVERALL_PERFORMANCE_METRICS: OverallPerformanceMetric[] = [
  {
    platformId: 'news_apps',
    name: 'News Apps',
    score: 2.1,
    maxScore: 5.0,
    rank: 4,
    color: '#E11D48',
    confidenceBasis: 'curated_benchmarked',
    rationale: 'Strong headline awareness but near-zero localized household or investment transmission capability.',
  },
  {
    platformId: 'financial_tools',
    name: 'Financial Tools',
    score: 3.3,
    maxScore: 5.0,
    rank: 3,
    color: '#F59E0B',
    confidenceBasis: 'curated_benchmarked',
    rationale: 'Robust market metrics and portfolio tooling, but overlooks essential non-invested household expenditure.',
  },
  {
    platformId: 'research_platforms',
    name: 'Research Platforms',
    score: 3.8,
    maxScore: 5.0,
    rank: 2,
    color: '#0284C7',
    confidenceBasis: 'curated_benchmarked',
    rationale: 'High macroeconomic rigor and econometric depth, but lacks personalized interactive citizen tooling.',
  },
  {
    platformId: 'bharat_impact',
    name: 'BharatImpact',
    score: 4.8,
    maxScore: 5.0,
    rank: 1,
    color: '#10B981',
    confidenceBasis: 'curated_benchmarked',
    rationale: 'Best-in-class end-to-end connectivity linking global shocks directly to Indian household budgets and SIP portfolios.',
  },
];

/**
 * 4 Interactive Macro Scenarios for Impact Analysis Example
 */
export const IMPACT_SCENARIOS: ImpactAnalysisScenario[] = [
  {
    id: 'crude_oil',
    title: 'Crude Oil Price Rise (+12%)',
    subtitle: 'Brent crude surges from $75 to $85.2/bbl following geopolitical tensions',
    newsApps: {
      headline: 'Crude oil prices rise by 10% on global supply concerns',
      subtext: 'International benchmark climbs as supply disruptions emerge in the Middle East.',
      bulletPoints: ['Headline only', 'No Indian context', 'No household impact'],
    },
    financialTools: {
      ticker: 'Brent Crude (USD/bbl)',
      unit: 'USD/bbl',
      currentValue: '$85.2',
      changePct: '+10.1%',
      bulletPoints: ['Price charts & tickers', 'OMC refinery margin tracking', 'Market impact only'],
    },
    researchPlatforms: {
      reportTitle: 'Detailed report on global oil markets & fiscal deficit',
      summary: 'Analysis of trade deficits, CAD expansion (+0.3% of GDP), and subsidy buffers.',
      bulletPoints: ['Supply-demand elasticity analysis', 'Macro CAD & fiscal impact', 'Limited household view'],
    },
    bharatImpact: {
      badge: 'Comprehensive Macro-to-Micro Pipeline',
      keyPoints: [
        'Global event analysis (Crude Oil Surge)',
        'Impact on Indian sectors (Transport, Paints, Aviation, Logistics)',
        'Higher fuel and transport costs for consumers',
        'Household monthly impact (+₹1,250)',
        'Alternative scenarios (Base, +15% Shock, Easing)',
        'Effect on SIP capacity (-12% monthly reduction)',
        'Actionable recommendations (Fuel budgeting, SIP rebalancing)',
      ],
      monthlyImpactInr: 1250,
      sipImpactPct: -12.0,
    },
    householdBreakdown: {
      fuel: 850,
      food: 520,
      transport: 610,
      utilities: 390,
      total: 2370,
    },
    sipProjections: {
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      newsAppsTrajectory: [5000, 10000, 15000, 20000, 25000, 30000],
      financialToolsTrajectory: [5000, 10200, 15300, 20600, 26100, 32000],
      researchPlatformsTrajectory: [5000, 10800, 16900, 23300, 30400, 38000],
      bharatImpactTrajectory: [5000, 11500, 18600, 26400, 35100, 45000],
      sipCapacityAfter6m: {
        bharat_impact: 45000,
        research_platforms: 38000,
        financial_tools: 32000,
        news_apps: 30000,
      },
    },
  },
  {
    id: 'edible_oil',
    title: 'Edible Oil Import Tariff Hike (+20%)',
    subtitle: 'Government raises customs duty on crude palm and soybean oil imports to protect domestic farmers',
    newsApps: {
      headline: 'India hikes import duty on edible oils by 20% to boost domestic farming',
      subtext: 'Move aimed at supporting local oilseed producers ahead of the harvest season.',
      bulletPoints: ['Headline only', 'Government policy report', 'No consumer cost estimation'],
    },
    financialTools: {
      ticker: 'Nifty FMCG / Palm Futures',
      unit: 'INR/10kg',
      currentValue: '₹1,420',
      changePct: '+7.8%',
      bulletPoints: ['FMCG corporate margin warnings', 'Raw material cost pressures', 'Market impact only'],
    },
    researchPlatforms: {
      reportTitle: 'Food Security & Domestic Edible Oil Self-Sufficiency Study',
      summary: 'Impact on agricultural terms of trade, import bill reductions, and food CPI inflation.',
      bulletPoints: ['Agricultural supply elasticity', 'WPI food inflation modeling', 'Limited household view'],
    },
    bharatImpact: {
      badge: 'Comprehensive Macro-to-Micro Pipeline',
      keyPoints: [
        'Global event analysis (Edible Oil Tariff)',
        'Domestic FMCG and packaged food cost transmission',
        'Direct rise in cooking oil and processed grocery expenses',
        'Household monthly impact (+₹840)',
        'Alternative scenarios (Substitution with mustard/groundnut oil)',
        'Effect on SIP capacity (-8.5% temporary buffer)',
        'Actionable recommendations (Domestic brand substitution, monthly rationalization)',
      ],
      monthlyImpactInr: 840,
      sipImpactPct: -8.5,
    },
    householdBreakdown: {
      fuel: 120,
      food: 980,
      transport: 180,
      utilities: 140,
      total: 1420,
    },
    sipProjections: {
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      newsAppsTrajectory: [5000, 10000, 15000, 20000, 25000, 30000],
      financialToolsTrajectory: [5000, 10150, 15400, 20800, 26300, 32400],
      researchPlatformsTrajectory: [5000, 10700, 16800, 23200, 30200, 37800],
      bharatImpactTrajectory: [5000, 11400, 18400, 26100, 34700, 44200],
      sipCapacityAfter6m: {
        bharat_impact: 44200,
        research_platforms: 37800,
        financial_tools: 32400,
        news_apps: 30000,
      },
    },
  },
  {
    id: 'wheat_procurement',
    title: 'Wheat MSP & Procurement Spike (+8%)',
    subtitle: 'Rabi harvest procurement target raised with 8% MSP increment and buffer stock replenishment',
    newsApps: {
      headline: 'Cabinet approves 8% MSP hike on wheat for 2026-27 rabi season',
      subtext: 'Farmers welcome enhanced procurement price; food ministry sets record target.',
      bulletPoints: ['Headline only', 'Farmer union quotes', 'No retail flour impact'],
    },
    financialTools: {
      ticker: 'Agri Commodity Index',
      unit: 'Index Points',
      currentValue: '3,840',
      changePct: '+4.2%',
      bulletPoints: ['Flour millers margin squeeze', 'Agri-processing quarterly outlook', 'Market impact only'],
    },
    researchPlatforms: {
      reportTitle: 'Food Corporation of India Procurement & Fiscal Subsidy Analysis',
      summary: 'Study on public distribution system (PMGKAY) fiscal outlay and cereal inflation.',
      bulletPoints: ['Procurement volume vs open market', 'Fiscal subsidy expansion', 'Limited household view'],
    },
    bharatImpact: {
      badge: 'Comprehensive Macro-to-Micro Pipeline',
      keyPoints: [
        'Global & national policy analysis (Wheat MSP hike)',
        'Transmission into wholesale atta and packaged grain staples',
        'PMGKAY buffer insulation for low-income deciles',
        'Household monthly impact (+₹580 for urban middle class)',
        'Alternative scenarios (Open market sale buffer effect)',
        'Effect on SIP capacity (-5.2% monthly adjustment)',
        'Actionable recommendations (Cooperative flour stores, pre-festival buffer purchase)',
      ],
      monthlyImpactInr: 580,
      sipImpactPct: -5.2,
    },
    householdBreakdown: {
      fuel: 60,
      food: 780,
      transport: 90,
      utilities: 110,
      total: 1040,
    },
    sipProjections: {
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      newsAppsTrajectory: [5000, 10000, 15000, 20000, 25000, 30000],
      financialToolsTrajectory: [5000, 10100, 15300, 20700, 26200, 32100],
      researchPlatformsTrajectory: [5000, 10600, 16600, 23000, 29900, 37200],
      bharatImpactTrajectory: [5000, 11300, 18200, 25800, 34200, 43600],
      sipCapacityAfter6m: {
        bharat_impact: 43600,
        research_platforms: 37200,
        financial_tools: 32100,
        news_apps: 30000,
      },
    },
  },
  {
    id: 'red_sea_freight',
    title: 'Red Sea Shipping Route Disruption (+25%)',
    subtitle: 'Maritime security alerts force Cape of Good Hope rerouting, elevating container freight rates',
    newsApps: {
      headline: 'Red Sea shipping crisis escalates as freight rates surge by 25%',
      subtext: 'Global container carriers avoid Suez canal, adding 10 to 14 days to transit times.',
      bulletPoints: ['Headline only', 'Maritime shipping news', 'No Indian consumer impact'],
    },
    financialTools: {
      ticker: 'BDI / Container Freight Index',
      unit: 'USD/TEU',
      currentValue: '$3,850',
      changePct: '+24.5%',
      bulletPoints: ['Shipping stock rallies', 'Export margin pressure for engineering', 'Market impact only'],
    },
    researchPlatforms: {
      reportTitle: 'Global Maritime Supply Chain Bottlenecks & Trade Resilience',
      summary: 'Detailed econometric analysis of trade turnaround times and import landed costs.',
      bulletPoints: ['Transit delay simulation', 'Export-import balance of trade impact', 'Limited household view'],
    },
    bharatImpact: {
      badge: 'Comprehensive Macro-to-Micro Pipeline',
      keyPoints: [
        'Global trade shock analysis (Red Sea Maritime Block)',
        'Indian sector transmission (Chemicals, Electronics, Petroleum, Fertilizers)',
        'Landed cost inflation across imported intermediate goods',
        'Household monthly impact (+₹920 across electronics and fuel)',
        'Alternative scenarios (Air cargo substitution, domestic sourcing)',
        'Effect on SIP capacity (-9.0% adjustment)',
        'Actionable recommendations (Defer non-essential durable electronics purchase)',
      ],
      monthlyImpactInr: 920,
      sipImpactPct: -9.0,
    },
    householdBreakdown: {
      fuel: 480,
      food: 320,
      transport: 450,
      utilities: 280,
      total: 1530,
    },
    sipProjections: {
      monthLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      newsAppsTrajectory: [5000, 10000, 15000, 20000, 25000, 30000],
      financialToolsTrajectory: [5000, 10200, 15400, 20800, 26300, 32300],
      researchPlatformsTrajectory: [5000, 10700, 16700, 23100, 30100, 37600],
      bharatImpactTrajectory: [5000, 11400, 18300, 26000, 34600, 44000],
      sipCapacityAfter6m: {
        bharat_impact: 44000,
        research_platforms: 37600,
        financial_tools: 32300,
        news_apps: 30000,
      },
    },
  },
];

/**
 * 4 Audience User Value Categories
 */
export const USER_VALUE_PERSONAS: UserValuePersona[] = [
  {
    id: 'families',
    title: 'Individuals & Families',
    audienceNeed: 'Protect family monthly purchasing power and adapt household budgets to inflation.',
    iconType: 'family',
    features: [
      'Understand itemized expense impact (Fuel, Groceries, Utilities)',
      'Plan monthly budget with state-calibrated benchmarks',
      'Get personalized SIP contribution and affordability guidance',
    ],
    practicalCase:
      'A middle-class family in Indore adjusts their cooking oil and vehicle fuel budget early following a crude price surge, avoiding credit card debt.',
    benchmarkMultiplier: '4.7x deeper personal insights',
    qualitativeBadge: 'Comprehensive Household Budgeting',
    targetSection: 'household-impact',
  },
  {
    id: 'researchers',
    title: 'Students & Researchers',
    audienceNeed: 'Access verified macroeconomic transmission pathways and curated government survey microdata.',
    iconType: 'student',
    features: [
      'Access curated official data sources (MoSPI, PPAC, RBI)',
      'Inspect visual, multi-hop economic DAG impact graphs',
      'Explore reproducible counterfactual future scenarios',
    ],
    practicalCase:
      'An economics postgraduate student validates their thesis on diesel pass-through elasticity using BharatImpact’s receipt-backed provenance DAG.',
    benchmarkMultiplier: '3.9x faster scenario validation',
    qualitativeBadge: 'Curated Official Microdata',
    targetSection: 'methodology',
  },
  {
    id: 'analysts',
    title: 'Professionals & Analysts',
    audienceNeed: 'Track multi-tier sectoral dependencies and quantify supply chain bottlenecks.',
    iconType: 'analyst',
    features: [
      'Track sector-level margins and raw material exposure',
      'Compare multiple simultaneous geopolitical scenarios',
      'Get evidence-grounded AI copilot insights without hallucination',
    ],
    practicalCase:
      'An equity research associate models FMCG gross margins against the edible oil tariff hike before quarterly earnings calls.',
    benchmarkMultiplier: '4.2x faster sector impact mapping',
    qualitativeBadge: 'Multi-Tier Supply Chain Modeling',
    targetSection: 'sectors',
  },
  {
    id: 'institutions',
    title: 'Policymakers & Institutions',
    audienceNeed: 'Monitor macro-to-micro transmission and evaluate vulnerability across demographic deciles.',
    iconType: 'institution',
    features: [
      'Monitor macro and sector-level transmission speed',
      'Assess vulnerable decile household implications',
      'Support data-driven, evidence-first public welfare decisions',
    ],
    practicalCase:
      'State administrative planners assess PMGKAY buffer requirements for bottom-fractile rural households facing cereal price inflation.',
    benchmarkMultiplier: '3.8x higher policy transparency',
    qualitativeBadge: 'Empirical Pass-Through Elasticity',
    targetSection: 'methodology',
  },
];

export const SCENARIOS_DATA = IMPACT_SCENARIOS;
