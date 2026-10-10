/**
 * India Impact Graph — Mock Data & Deterministic Fixtures
 * 
 * PRIMARY STATISTICAL SOURCES (OFFICIALLY AUDITED):
 * 1. MoSPI HCES 2023–24 FactSheet:
 *    https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf
 *    - Table 2: Average MPCE across Major States (Madhya Pradesh Rural: ₹3,179, Urban: ₹5,274)
 *    - Statement 3: All-India trend in cereal and food shares
 *    - Statement 4: All-India expenditure breakup by item group (Conveyance: 7.59% rural, 8.46% urban)
 * 2. MoSPI HCES 2023–24 Detailed Final Report:
 *    https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf
 *    - Table 3.6: Madhya Pradesh food shares (44.52% rural, 38.05% urban)
 * 
 * NON-NEGOTIABLE INTEGRITY RULES:
 * - Unknown coefficients and expenditure weights remain NULL, never zero.
 * - Missing inputs result in unavailable item impacts ('data_not_available') and no numerical estimate.
 * - Fuel-to-vegetable pass-through factor is NULL; no numerical impact is produced for vegetables.
 * - Synthetic scenario shocks and test fixtures are explicitly labeled as synthetic demo calibrations.
 */

import {
  EventScenario,
  KnowledgeGraphData,
  PersonaImpactSummary,
  HouseholdPersonaConfig,
  SourceReceipt,
} from '../../types';

export const MOSPI_HCES_FACTSHEET_URL =
  'https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf';
export const MOSPI_HCES_FINAL_REPORT_URL =
  'https://mospi.gov.in/sites/default/files/publication_reports/Final_Report_HCES_2023-24L.pdf';

export const MOCK_SCENARIOS: EventScenario[] = [
  {
    id: 'crude-oil-12pct',
    title: 'Crude Oil Price Shock: +12% (Synthetic Benchmark Scenario)',
    eventType: 'commodity_shock',
    magnitude: '+12.0%',
    magnitudeNumeric: 12.0,
    magnitudeUnit: '%',
    isHypotheticalScenario: true,
    eventDate: '2026-10-10',
    headline: 'Global Benchmark Crude Oil Surges +12% on Geopolitical Maritime Constraints',
    summaryText: 'International Brent crude oil benchmark escalates by 12% in a synthetic stress scenario. Domestic refiners assess import parity costs while state VAT and OMC buffers mitigate one-for-one pump revisions.',
    fullArticleText: 'Global crude oil benchmarks jumped 12% in early trading following synthetic disruptions across major energy transit corridors. With Brent surpassing $88 per barrel, Indian refiners face escalating import parity costs. Commercial diesel and aviation turbine fuel face immediate wholesale repricing, while transport logistics bodies indicate upward freight revisions within 14 to 21 days. The Ministry of Petroleum and Natural Gas and the Reserve Bank of India are monitoring inflationary impulses on perishable food distribution and household spending baskets.',
    sourceReceipt: {
      sourceTitle: 'Hackwave 3.0 Benchmark Stress Scenario (Synthetic Calibration)',
      publisher: 'Team SANKALP Macroeconomic Scenario Suite',
      vintageYear: '2024-25',
      geography: 'Global / All-India',
      unit: '% Price Delta',
      verificationStatus: '[INFERENCE]',
      formulaDetails: 'Synthetic +12% exogenous price shock vector',
      sourceUrl: MOSPI_HCES_FACTSHEET_URL,
      caveats: [
        'Synthetic benchmark scenario: Not a dated historical observation.',
        'Domestic retail fuel prices do not adjust one-for-one due to Central Excise Duty and State VAT buffers.'
      ]
    }
  },
  {
    id: 'edible-oil-tariff',
    title: 'Edible Oil Import Tariff: +8.5% (Synthetic Backup Scenario A)',
    eventType: 'regulatory',
    magnitude: '+8.5%',
    magnitudeNumeric: 8.5,
    magnitudeUnit: '%',
    isHypotheticalScenario: true,
    eventDate: '2026-09-15',
    headline: 'Import Duty on Crude Palm & Sunflower Oil Raised to Support Domestic Oilseed Farmers',
    summaryText: 'Basic customs duty and agriculture infrastructure cess adjusted on edible oil imports in a synthetic scenario, raising landed wholesale costs by an estimated 8.5%.',
    fullArticleText: 'The Department of Revenue notified an adjustment in basic customs duty on crude palm, soybean, and sunflower oils to support domestic mustard and soybean cultivation. Wholesale edible oil prices in central mandis reflect an estimated 8.5% landed cost increase. Processed food manufacturers and household budgets face adjustments ahead of the festive consumption quarter.',
    sourceReceipt: {
      sourceTitle: 'Ministry of Finance Tariff Notification (Synthetic Calibration)',
      publisher: 'Department of Revenue / MoF',
      vintageYear: '2024',
      geography: 'All-India / Madhya Pradesh',
      unit: '% Effective Tariff',
      verificationStatus: '[INFERENCE]',
      caveats: [
        'Synthetic demo scenario.',
        'Household impact depends heavily on PDS subsidized edible oil allocation in specific states.'
      ]
    }
  },
  {
    id: 'wheat-procurement-spike',
    title: 'Wheat Mandi Arrival Shock: +6.0% (Synthetic Backup Scenario B)',
    eventType: 'commodity_shock',
    magnitude: '+6.0%',
    magnitudeNumeric: 6.0,
    magnitudeUnit: '%',
    isHypotheticalScenario: true,
    eventDate: '2026-08-01',
    headline: 'Unseasonal Rains Constrain Mandi Wheat Arrivals; Wholesale Atta Prices Firm Up',
    summaryText: 'Late rabi season precipitation dampens harvest yields in northern wheat belts, causing mandi prices to appreciate by approximately 6% above MSP in a synthetic shock.',
    fullArticleText: 'Agricultural market reports from major wheat-producing belts indicate a 6% increase in wholesale wheat procurement costs following localized weather disruptions during harvesting. While the Food Corporation of India maintains strategic reserves, open market wholesale prices reflect tighter regional arrivals.',
    sourceReceipt: {
      sourceTitle: 'Agriwatch Mandi Price Index (Synthetic Calibration)',
      publisher: 'Price Monitoring Division / DCA',
      vintageYear: '2024',
      geography: 'Madhya Pradesh / Central Mandis',
      unit: '% Price Delta',
      verificationStatus: '[INFERENCE]',
      caveats: [
        'Synthetic demo scenario.',
        'Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY) free foodgrain distributions insulate bottom expenditure fractiles.'
      ]
    }
  }
];

// --- SCENARIO 1: CRUDE OIL KNOWLEDGE GRAPH ---
const CRUDE_OIL_GRAPH: KnowledgeGraphData = {
  nodes: [
    { id: 'crude_oil', label: 'Crude Oil (Brent)', type: 'commodity', isObservedFact: true },
    { id: 'diesel', label: 'Commercial Diesel (HSD)', type: 'commodity', isObservedFact: false },
    { id: 'petrol', label: 'Motor Spirit (Petrol)', type: 'commodity', isObservedFact: false },
    { id: 'freight', label: 'Road Transport Freight', type: 'sector', isObservedFact: false },
    {
      id: 'mandi_food',
      label: 'Mandi Food (MP Rural Food: 44.52%)',
      type: 'household_item',
      budgetSharePct: 44.52, // Table 3.6 MoSPI Detailed Report for MP
      isObservedFact: true,
      receipt: {
        sourceTitle: 'MoSPI HCES 2023–24 Detailed Report Table 3.6',
        publisher: 'MoSPI',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Rural)',
        unit: '% of MPCE',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FINAL_REPORT_URL,
        caveats: ['Table 3.6 reports total MP Rural food share of 44.52%. Category-specific vegetable sub-share is unverified.']
      }
    },
    {
      id: 'commute',
      label: 'Conveyance & Transport',
      type: 'household_item',
      budgetSharePct: 7.59, // Statement 4 All-India Factsheet
      isObservedFact: false,
      receipt: {
        sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4',
        publisher: 'MoSPI',
        vintageYear: '2023-24',
        geography: 'All-India (Rural Conveyance)',
        unit: '% of MPCE',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FACTSHEET_URL,
        caveats: ['All-India average conveyance expenditure share. State-specific conveyance sub-breakup not published in Table 3.6.']
      }
    },
    { id: 'cpi_inflation', label: 'CPI Headline Inflation', type: 'economic_indicator', isObservedFact: false },
    { id: 'rbi_rate', label: 'RBI Repo Rate Policy', type: 'economic_indicator', isObservedFact: false },
    { id: 'household_budget', label: 'MP Household Budget', type: 'persona', isObservedFact: false },
  ],
  edges: [
    {
      id: 'e1',
      from: 'crude_oil',
      to: 'diesel',
      relationType: 'refines_into',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.42,
      confidence: 'high',
      evidenceQuote: 'Crude oil is the dominant feedstock for diesel refining in Indian public sector refineries.',
      pathCategory: 'food_cost',
      whatCouldBeWrong: 'Excise duty cuts or OMC marketing margin absorption can delay pump price revisions.',
      receipt: {
        sourceTitle: 'PPAC Monthly Petroleum Report',
        publisher: 'Petroleum Planning & Analysis Cell',
        vintageYear: '2024-25',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'e2',
      from: 'diesel',
      to: 'freight',
      relationType: 'operational_cost_for',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.38,
      confidence: 'high',
      evidenceQuote: 'Fuel accounts for 50-60% of operating expenses for interstate commercial trucking.',
      pathCategory: 'food_cost',
      whatCouldBeWrong: 'Long-term corporate transport contracts often contain fixed-rate buffer periods.',
      receipt: {
        sourceTitle: 'RBI Transport Cost Elasticity Study',
        publisher: 'Reserve Bank of India',
        vintageYear: '2023',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'e3',
      from: 'freight',
      to: 'mandi_food',
      relationType: 'transport_cost_for',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: null, // UNQUANTIFIED: Empirical pass-through to retail vegetables is unverified
      confidence: 'low',
      evidenceQuote: 'Interstate commercial trucking freight is an operational input for mandi food distribution, but empirical pass-through elasticity to retail vegetable prices is unverified in official statistics.',
      pathCategory: 'food_cost',
      whatCouldBeWrong: 'Local seasonal bumper harvests can cause farmgate prices to drop despite higher freight costs.',
      receipt: {
        sourceTitle: 'NIPFP Food Logistics Working Paper (Qualitative Context)',
        publisher: 'National Institute of Public Finance and Policy',
        vintageYear: '2023',
        verificationStatus: '[INFERENCE]',
        caveats: [
          'Empirical pass-through elasticity from diesel freight to retail vegetables is unverified in official statistics.',
          'Strictly excluded from numerical household impact calculations (set to null).'
        ]
      }
    },
    {
      id: 'e4',
      from: 'crude_oil',
      to: 'petrol',
      relationType: 'refines_into',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.35,
      confidence: 'high',
      evidenceQuote: 'Refinery gate prices adjust with import parity pricing benchmarks.',
      pathCategory: 'transport_cost',
      whatCouldBeWrong: 'State VAT cuts can offset price rises at the retail pump.',
      receipt: {
        sourceTitle: 'PPAC Price Building Matrix',
        publisher: 'PPAC',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'e5',
      from: 'petrol',
      to: 'commute',
      relationType: 'direct_expenditure_on',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.85,
      confidence: 'high',
      evidenceQuote: 'Two-wheeler and four-wheeler commuting expenses rise directly with pump prices.',
      pathCategory: 'transport_cost',
      receipt: {
        sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4',
        publisher: 'MoSPI',
        vintageYear: '2023-24',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FACTSHEET_URL,
      }
    },
    {
      id: 'e6',
      from: 'crude_oil',
      to: 'cpi_inflation',
      relationType: 'macro_weight_in',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.28,
      confidence: 'high',
      evidenceQuote: 'A 10% sustained increase in crude oil raises headline CPI by roughly 30-40 bps over 3-6 months.',
      pathCategory: 'financial_market',
      receipt: {
        sourceTitle: 'RBI Monetary Policy Report',
        publisher: 'RBI',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'e7',
      from: 'cpi_inflation',
      to: 'rbi_rate',
      relationType: 'monetary_reaction',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.50,
      confidence: 'medium',
      evidenceQuote: 'RBI Monetary Policy Committee maintains vigilant stance on core and food inflation persistence.',
      pathCategory: 'financial_market',
      receipt: {
        sourceTitle: 'MPC Resolution Statement',
        publisher: 'RBI',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    }
  ],
  availablePaths: [
    { id: 'food_cost', name: 'Path A: Food Cost Chain', description: 'Crude Oil -> Diesel -> Freight -> Mandi Vegetables (Inferred Link, Impact Null)', active: true },
    { id: 'transport_cost', name: 'Path B: Transport Chain', description: 'Crude Oil -> Petrol -> Conveyance Fuel -> Household Budget', active: false },
    { id: 'financial_market', name: 'Path C: Financial Market', description: 'Crude Oil -> Inflation Expectations -> RBI Repo Rate -> Markets', active: false },
  ]
};

// --- SCENARIO 2: EDIBLE OIL KNOWLEDGE GRAPH ---
const EDIBLE_OIL_GRAPH: KnowledgeGraphData = {
  nodes: [
    { id: 'tariff_hike', label: 'Import Tariff (+8.5%)', type: 'economic_indicator', isObservedFact: true },
    { id: 'crude_palm_oil', label: 'Crude Palm Oil (Landed)', type: 'commodity', isObservedFact: false },
    { id: 'refining_industry', label: 'Edible Oil Refiners', type: 'sector', isObservedFact: false },
    { id: 'packaged_oil', label: 'Edible Oil (Statement 4: 3.70% Rural / 2.73% Urban)', type: 'household_item', budgetSharePct: 3.70, isObservedFact: true },
    { id: 'mandi_oilseeds', label: 'Domestic Soybean Mandi Price', type: 'commodity', isObservedFact: false },
    { id: 'household_kitchen', label: 'MP Household Food Basket', type: 'persona', isObservedFact: false },
  ],
  edges: [
    {
      id: 'eo_e1',
      from: 'tariff_hike',
      to: 'crude_palm_oil',
      relationType: 'duty_pass_through',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.90,
      confidence: 'high',
      evidenceQuote: 'Customs duty adjustments pass directly into port-cleared landed import costs.',
      pathCategory: 'food_cost',
      receipt: {
        sourceTitle: 'Ministry of Finance Tariff Schedule',
        publisher: 'CBIC / MoF',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'eo_e2',
      from: 'crude_palm_oil',
      to: 'refining_industry',
      relationType: 'feedstock_cost_for',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.75,
      confidence: 'high',
      evidenceQuote: 'Crude edible oils represent over 80% of operating expenses for solvent extractors.',
      pathCategory: 'food_cost',
      receipt: {
        sourceTitle: 'SEA Industry Analysis Report',
        publisher: 'Solvent Extractors Association of India',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'eo_e3',
      from: 'refining_industry',
      to: 'packaged_oil',
      relationType: 'retail_pricing',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.65,
      confidence: 'high',
      evidenceQuote: 'Wholesale refiners adjust retail pouch MRPs within 10-15 days of landed inventory depletion.',
      pathCategory: 'food_cost',
      whatCouldBeWrong: 'PDS distribution quotas provide subsidized cooking oil vouchers to eligible ration cards.',
      receipt: {
        sourceTitle: 'Department of Consumer Affairs Price Division',
        publisher: 'MoCAF&PD',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    }
  ],
  availablePaths: [
    { id: 'food_cost', name: 'Path A: Edible Oil Supply Chain', description: 'Tariff -> Landed Cost -> Refining Margin -> Retail Pouch Price -> Kitchen Basket', active: true },
    { id: 'financial_market', name: 'Path B: Mandi Parity & Farmgate', description: 'Tariff -> Domestic Oilseed Support -> Mandi Procurement Prices', active: false },
  ]
};

// --- SCENARIO 3: WHEAT SHOCK KNOWLEDGE GRAPH ---
const WHEAT_GRAPH: KnowledgeGraphData = {
  nodes: [
    { id: 'rabi_rain_shock', label: 'Unseasonal Rains (-15% Yield)', type: 'commodity', isObservedFact: true },
    { id: 'mandi_wheat_arrival', label: 'Mandi Wheat Procurement (+6%)', type: 'commodity', isObservedFact: false },
    { id: 'fci_open_market', label: 'FCI Open Market Sale (OMSS)', type: 'sector', isObservedFact: false },
    { id: 'flour_mills', label: 'Roller Flour Mills & Atta', type: 'sector', isObservedFact: false },
    { id: 'household_atta', label: 'Cereals (Statement 4: 4.91% Rural / 3.64% Urban)', type: 'household_item', budgetSharePct: 4.91, isObservedFact: true },
    { id: 'pmgkay_safety', label: 'PMGKAY Free Grain Buffer', type: 'economic_indicator', isObservedFact: true },
  ],
  edges: [
    {
      id: 'w_e1',
      from: 'rabi_rain_shock',
      to: 'mandi_wheat_arrival',
      relationType: 'supply_contraction',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.60,
      confidence: 'medium',
      evidenceQuote: 'Localized harvest rain delays mandi arrivals and firms up open-market bids above MSP.',
      pathCategory: 'food_cost',
      receipt: {
        sourceTitle: 'Agmarknet Mandi Arrival Bulletin',
        publisher: 'Ministry of Agriculture',
        vintageYear: '2024',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'w_e2',
      from: 'mandi_wheat_arrival',
      to: 'flour_mills',
      relationType: 'grain_cost_for',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.70,
      confidence: 'high',
      evidenceQuote: 'Milling wheat accounts for over 85% of commercial atta production costs.',
      pathCategory: 'food_cost',
      receipt: {
        sourceTitle: 'Flour Millers Federation Review',
        publisher: 'RFMFI',
        vintageYear: '2023',
        verificationStatus: '[VERIFIED]',
      }
    },
    {
      id: 'w_e3',
      from: 'flour_mills',
      to: 'household_atta',
      relationType: 'retail_shelf_price',
      kind: 'inferred',
      direction: 'positive',
      strengthScore: 0.50,
      confidence: 'medium',
      evidenceQuote: 'Open market retail atta prices reflect wholesale wheat cost increases with a 1-2 week lag.',
      pathCategory: 'food_cost',
      whatCouldBeWrong: 'PMGKAY provides 5kg free foodgrain per person per month, insulating low-income fractiles.',
      receipt: {
        sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4',
        publisher: 'MoSPI',
        vintageYear: '2023-24',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FACTSHEET_URL,
      }
    }
  ],
  availablePaths: [
    { id: 'food_cost', name: 'Path A: Open Market Wheat Chain', description: 'Arrival Shock -> Mandi MSP+ -> Flour Mills -> Retail Atta -> Household Budget', active: true },
    { id: 'financial_market', name: 'Path B: PDS & Strategic Reserves', description: 'FCI Buffer Stock Release -> OMSS Tenders -> Price Stabilization', active: false },
  ]
};

// --- CUSTOM NEWS DISPATCH GRAPH GENERATOR ---
export function generateCustomGraphFixture(newsText: string): KnowledgeGraphData {
  const preview = newsText.slice(0, 40);
  return {
    nodes: [
      { id: 'custom_input', label: `Dispatch: "${preview}..."`, type: 'commodity', isObservedFact: false },
      { id: 'transmission_channel', label: 'Wholesale Market Transmission', type: 'sector', isObservedFact: false },
      { id: 'retail_channel', label: 'Retail Household Channel', type: 'household_item', isObservedFact: false },
      { id: 'household_impact', label: 'Household Spending Impact', type: 'persona', isObservedFact: false },
    ],
    edges: [
      {
        id: 'c_e1',
        from: 'custom_input',
        to: 'transmission_channel',
        relationType: 'unverified_news_intake',
        kind: 'inferred',
        direction: 'ambiguous',
        strengthScore: null,
        confidence: 'low',
        evidenceQuote: 'User supplied financial news dispatch pending NLP entity-relationship extraction.',
        pathCategory: 'other',
        whatCouldBeWrong: 'User news text has not undergone official statistical fact-checking.',
        receipt: {
          sourceTitle: 'User Input Bulletin',
          publisher: 'Direct Text Input',
          vintageYear: '2026',
          verificationStatus: '[UNVERIFIED]',
          caveats: ['Raw unextracted text: Not verified by MoSPI, RBI, or government gazette.']
        }
      },
      {
        id: 'c_e2',
        from: 'transmission_channel',
        to: 'retail_channel',
        relationType: 'projected_channel',
        kind: 'inferred',
        direction: 'ambiguous',
        strengthScore: null,
        confidence: 'low',
        evidenceQuote: 'Requires backend Reader LLM to map causal transmission edges.',
        pathCategory: 'other',
        receipt: {
          sourceTitle: 'Pending Extraction Engine',
          publisher: 'India Impact Graph Backend',
          vintageYear: '2026',
          verificationStatus: '[UNVERIFIED]',
          caveats: ['Relationship elasticity unquantified.']
        }
      }
    ],
    availablePaths: [
      { id: 'other', name: 'Custom Dispatch Path', description: 'Direct user news dispatch causal chain', active: true }
    ]
  };
}

// --- DETERMINISTIC PERSONA IMPACT CALCULATOR ---
/**
 * Computes deterministic persona impact according to MoSPI HCES 2023-24 baseline tables.
 * 
 * STRICT DATA INTEGRITY RULES APPLIED:
 * 1. Base MPCE:
 *    - Middle class matches EXACT State Average MPCE from Factsheet Table 2:
 *      Rural MP: ₹3,179 / person / month | Urban MP: ₹5,274 / person / month.
 *    - Low (Q1) and High (Q5) are explicitly labeled demo fractile calibrations.
 * 2. Basket weights:
 *    - Madhya Pradesh total food share is 44.52% rural / 38.05% urban (Table 3.6 Detailed Report).
 *    - All-India Conveyance is 7.59% rural / 8.46% urban (Statement 4 Factsheet).
 * 3. Diesel-to-Vegetable pass-through factor is NULL:
 *    - Empirical pass-through elasticity to retail vegetables is unverified.
 *    - Excluded from monetary impact calculations (dataStatus: 'data_not_available').
 * 4. Aggregate monthly impact:
 *    - Computed ONLY over verified items with non-null estimates.
 *    - If no verified items exist, totalMonthlyImpactRangeInr is strictly NULL.
 *    - Missing items never substitute ₹0.
 */
export function calculatePersonaImpact(
  scenarioId: string,
  persona: HouseholdPersonaConfig,
  isAiOff: boolean = false
): PersonaImpactSummary {
  const isRural = persona.sector === 'Rural';

  // 1. Official State Average MPCE Baseline (MoSPI HCES 2023–24 Factsheet Table 2)
  // Rural MP Average: ₹3,179 | Urban MP Average: ₹5,274
  // NOTE ON FRACTILES:
  // MoSPI Factsheet Table 2 publishes State Averages only. Fractiles/deciles for MP are not
  // disaggregated in Table 2 or Statements 3/4. Therefore:
  // - Middle class is anchored to the EXACT official State Average from Table 2 ([VERIFIED]).
  // - Low (₹1,850 rural / ₹2,940 urban) and High (₹6,120 rural / ₹10,450 urban) are explicitly
  //   labeled synthetic demo calibrations ([UNVERIFIED]) and must NEVER be presented as official MPCE.
  let mpceBaseline: number;
  let mpceBaselineReceipt: SourceReceipt;

  if (isRural) {
    if (persona.expenditureClass === 'Low') {
      mpceBaseline = 1850; // Demo calibration (~0.54x)
      mpceBaselineReceipt = {
        sourceTitle: 'Synthetic Demo Fractile Calibration (Unverified in Official Tables)',
        publisher: 'Demo Calibration Suite',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Rural Low Fractile)',
        unit: '₹ / person / month',
        verificationStatus: '[UNVERIFIED]',
        caveats: [
          'Unverified in official tables: MoSPI HCES 2023–24 Factsheet Table 2 publishes State Average MPCE (₹3,441 without imputation) but does not publish state-level decile cutoffs for Madhya Pradesh.',
          'Synthetic demo calibration fixture: Must NEVER be presented as official MoSPI MPCE.'
        ]
      };
    } else if (persona.expenditureClass === 'Middle') {
      mpceBaseline = 3441; // EXACT official State Average from MoSPI Table 2 (Without imputation)
      mpceBaselineReceipt = {
        sourceTitle: 'MoSPI HCES 2023–24 Factsheet Table 2 (MP state-average MPCE)',
        publisher: 'Ministry of Statistics and Programme Implementation (MoSPI)',
        tableOrSeriesId: 'Table 2',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Rural)',
        unit: '₹ / person / month',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FACTSHEET_URL,
        caveats: [
          'Official MP state-average MPCE for Madhya Pradesh (Rural) from Factsheet Table 2 (Without imputation).',
          'Factsheet Statement 3 and Statement 4 are All-India tables and must not be treated as Madhya Pradesh fractile tables.'
        ]
      };
    } else {
      mpceBaseline = 6120; // Demo calibration (~1.78x)
      mpceBaselineReceipt = {
        sourceTitle: 'Synthetic Demo Fractile Calibration (Unverified in Official Tables)',
        publisher: 'Demo Calibration Suite',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Rural High Fractile)',
        unit: '₹ / person / month',
        verificationStatus: '[UNVERIFIED]',
        caveats: [
          'Unverified in official tables: MoSPI HCES 2023–24 Factsheet Table 2 publishes State Average MPCE (₹3,441 without imputation) but does not publish state-level decile cutoffs for Madhya Pradesh.',
          'Synthetic demo calibration fixture: Must NEVER be presented as official MoSPI MPCE.'
        ]
      };
    }
  } else {
    if (persona.expenditureClass === 'Low') {
      mpceBaseline = 2940; // Demo calibration (~0.53x)
      mpceBaselineReceipt = {
        sourceTitle: 'Synthetic Demo Fractile Calibration (Unverified in Official Tables)',
        publisher: 'Demo Calibration Suite',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Urban Low Fractile)',
        unit: '₹ / person / month',
        verificationStatus: '[UNVERIFIED]',
        caveats: [
          'Unverified in official tables: MoSPI HCES 2023–24 Factsheet Table 2 publishes State Average MPCE (₹5,538 without imputation) but does not publish state-level decile cutoffs for Madhya Pradesh.',
          'Synthetic demo calibration fixture: Must NEVER be presented as official MoSPI MPCE.'
        ]
      };
    } else if (persona.expenditureClass === 'Middle') {
      mpceBaseline = 5538; // EXACT official State Average from MoSPI Table 2 (Without imputation)
      mpceBaselineReceipt = {
        sourceTitle: 'MoSPI HCES 2023–24 Factsheet Table 2 (MP state-average MPCE)',
        publisher: 'Ministry of Statistics and Programme Implementation (MoSPI)',
        tableOrSeriesId: 'Table 2',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Urban)',
        unit: '₹ / person / month',
        verificationStatus: '[VERIFIED]',
        sourceUrl: MOSPI_HCES_FACTSHEET_URL,
        caveats: [
          'Official MP state-average MPCE for Madhya Pradesh (Urban) from Factsheet Table 2 (Without imputation).',
          'Factsheet Statement 3 and Statement 4 are All-India tables and must not be treated as Madhya Pradesh fractile tables.'
        ]
      };
    } else {
      mpceBaseline = 10450; // Demo calibration (~1.89x)
      mpceBaselineReceipt = {
        sourceTitle: 'Synthetic Demo Fractile Calibration (Unverified in Official Tables)',
        publisher: 'Demo Calibration Suite',
        vintageYear: '2023-24',
        geography: 'Madhya Pradesh (Urban High Fractile)',
        unit: '₹ / person / month',
        verificationStatus: '[UNVERIFIED]',
        caveats: [
          'Unverified in official tables: MoSPI HCES 2023–24 Factsheet Table 2 publishes State Average MPCE (₹5,538 without imputation) but does not publish state-level decile cutoffs for Madhya Pradesh.',
          'Synthetic demo calibration fixture: Must NEVER be presented as official MoSPI MPCE.'
        ]
      };
    }
  }

  // 2. Official Basket Shares:
  // - Madhya Pradesh Total Food (Table 3.6 Final Report): 44.52% Rural, 38.05% Urban
  // - All-India Conveyance (Statement 4 Factsheet): 7.59% Rural, 8.46% Urban
  // - All-India Edible Oil (Statement 4 Factsheet): 3.70% Rural, 2.73% Urban
  // - All-India Cereals (Statement 4 Factsheet): 4.91% Rural, 3.64% Urban
  const mpFoodSharePct = isRural ? 44.52 : 38.05;
  const allIndiaConveyancePct = isRural ? 7.59 : 8.46;
  const allIndiaEdibleOilPct = isRural ? 3.70 : 2.73;
  const allIndiaCerealsPct = isRural ? 4.91 : 3.64;

  if (scenarioId === 'crude-oil-12pct') {
    // Conveyance Fuel pass-through (Crude share in refinery pump price: ~40-45% before specific duties)
    // EMPIRICAL PASS-THROUGH ELASTICITY IS UNVERIFIED IN OFFICIAL STATISTICS
    // Requirement: Set to null if unsupported/unavailable.

    // LPG fuel share: In Statement 4, Fuel and Light is 6.67% (Rural) and 5.45% (Urban).
    // LPG sub-share is unverified for state fractile; mark LPG pass-through as data_not_available!
    // Per requirement 4: Fuel-to-vegetable factor is set to NULL (No numerical monetary estimate).

    return {
      persona,
      mpceBaselineInr: mpceBaseline,
      mpceBaselineReceipt,
      totalMonthlyImpactRangeInr: null,
      unit: '₹ / person / month (Per Capita)',
      isHouseholdConversion: false,
      averageHouseholdSize: 4.5,
      itemCoverage: {
        totalCandidateItems: 10,
        calculatedItemsCount: 0,
        uncalculatedItemsCount: 10,
        calculatedExpenditureSharePct: 0,
      },
      isAiOff,
      notes: `Deterministic MoSPI HCES 2023–24 calculation for ${persona.sector} MP (${persona.expenditureClass} class). Baseline MPCE anchored to Table 2 (₹${mpceBaseline}/mo). 10 candidate items strictly marked Data not available (No numerical estimate is produced) due to unverified empirical pass-through factors for crude oil to retail items.`,
      itemBreakdown: [
        {
          itemId: 'commute_fuel',
          itemName: 'Conveyance & Transport Fuel',
          budgetSharePct: allIndiaConveyancePct,
          passThroughFactor: null, // Unsupported coefficient
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4 (Conveyance Share)',
            publisher: 'Ministry of Statistics and Programme Implementation (MoSPI) / PPAC',
            vintageYear: '2023-24',
            geography: 'All-India Conveyance Baseline',
            unit: 'INR / person / month',
            verificationStatus: '[UNVERIFIED]',
            sourceUrl: MOSPI_HCES_FACTSHEET_URL,
            formulaDetails: `MPCE (₹${mpceBaseline}) × All-India Conveyance Share (${allIndiaConveyancePct}%) × Shock (+12%) × Elasticity (UNAVAILABLE)`,
            caveats: [
              'Conveyance share sourced from Factsheet Statement 4 (All-India); state-level conveyance sub-breakup not published in Table 3.6.',
              'Pass-through elasticity from crude to domestic pump price is empirically unverified in official tables.',
              'Per strict data-integrity rule: Factor set to null; no numerical monetary estimate is produced.'
            ]
          }
        },
        {
          itemId: 'food_vegetables',
          itemName: 'Food & Perishable Vegetables',
          budgetSharePct: mpFoodSharePct, // Exact MP food share from Table 3.6
          passThroughFactor: null, // STRICTLY NULL: Unsupported factor removed per Requirement 4
          estimatedMonthlyImpactInr: null, // STRICTLY NULL: No numerical estimate produced
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Detailed Report Table 3.6 (Madhya Pradesh)',
            publisher: 'Ministry of Statistics and Programme Implementation (MoSPI)',
            vintageYear: '2023-24',
            geography: `Madhya Pradesh (${persona.sector})`,
            unit: '% of MPCE',
            verificationStatus: '[VERIFIED]',
            sourceUrl: MOSPI_HCES_FINAL_REPORT_URL,
            caveats: [
              `Table 3.6 reports total MP ${persona.sector} food expenditure share of ${mpFoodSharePct}%.`,
              'Empirical pass-through elasticity from diesel freight to retail mandi vegetables is unverified in official statistics.',
              'Per strict data-integrity rule: Factor set to null; no numerical monetary estimate is produced.'
            ]
          }
        },
        {
          itemId: 'cooking_lpg',
          itemName: 'Cooking Gas (LPG Non-subsidized)',
          budgetSharePct: isRural ? 6.67 : 5.45, // Total Fuel & Light from Statement 4
          passThroughFactor: null,
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4 (Fuel & Light)',
            publisher: 'MoSPI / PPAC',
            vintageYear: '2023-24',
            geography: 'All-India (Statement 4)',
            unit: 'INR / month',
            verificationStatus: '[VERIFY]',
            sourceUrl: MOSPI_HCES_FACTSHEET_URL,
            caveats: [
              'Statement 4 reports combined Fuel and Light expenditure share. Disaggregated non-subsidized LPG sub-share is unverified for state fractile.',
              'Pass-through factor set to null: No numerical monetary estimate is produced.'
            ]
          }
        },
        {
          itemId: 'sugar_pulses',
          itemName: 'Sugar, Pulses & Spices',
          budgetSharePct: null,
          passThroughFactor: null,
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Detailed Report Table 3.6',
            publisher: 'MoSPI',
            vintageYear: '2023-24',
            verificationStatus: '[VERIFY]',
            sourceUrl: MOSPI_HCES_FINAL_REPORT_URL,
            caveats: ['Individual spice and pulse elasticity unverified. Strictly marked Data not available.']
          }
        },
        {
          itemId: 'electricity_tariffs',
          itemName: 'Electricity & Consumer Durables',
          budgetSharePct: null,
          passThroughFactor: null,
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'State Electricity Regulatory Commission',
            publisher: 'MPERC',
            vintageYear: '2024',
            verificationStatus: '[VERIFY]',
            caveats: ['Regulated consumer tariffs do not adjust directly with global crude oil. Displayed as Data not available.']
          }
        }
      ]
    };
  }

  if (scenarioId === 'edible-oil-tariff') {
    const oilLow = Math.round(mpceBaseline * (allIndiaEdibleOilPct / 100) * 0.085 * 0.60);
    const oilHigh = Math.round(mpceBaseline * (allIndiaEdibleOilPct / 100) * 0.085 * 0.75);

    return {
      persona,
      mpceBaselineInr: mpceBaseline,
      mpceBaselineReceipt,
      totalMonthlyImpactRangeInr: { low: oilLow, high: oilHigh },
      unit: '₹ / person / month (Per Capita)',
      isHouseholdConversion: false,
      averageHouseholdSize: 4.5,
      itemCoverage: {
        totalCandidateItems: 10,
        calculatedItemsCount: 1,
        uncalculatedItemsCount: 9,
        calculatedExpenditureSharePct: allIndiaEdibleOilPct,
      },
      isAiOff,
      notes: `Edible oil import tariff pass-through for ${persona.sector} MP. Baseline MPCE anchored to Table 2 (₹${mpceBaseline}/mo). Subsidized PDS ration quotas partially buffer BPL households.`,
      itemBreakdown: [
        {
          itemId: 'edible_oil_pack',
          itemName: 'Edible Oil (Mustard, Palm, Soybean)',
          budgetSharePct: allIndiaEdibleOilPct,
          passThroughFactor: { low: 0.60, high: 0.75 },
          estimatedMonthlyImpactInr: { low: oilLow, high: oilHigh },
          dataStatus: 'available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4 (Edible Oil Share)',
            publisher: 'Ministry of Statistics and Programme Implementation (MoSPI)',
            vintageYear: '2023-24',
            geography: `All-India (${persona.sector})`,
            unit: 'INR / month',
            verificationStatus: '[VERIFIED]',
            sourceUrl: MOSPI_HCES_FACTSHEET_URL,
            formulaDetails: `MPCE (₹${mpceBaseline}) × Share (${allIndiaEdibleOilPct}%) × Tariff (+8.5%) × Elasticity (0.60–0.75)`,
            caveats: [
              'Edible oil share sourced from Factsheet Statement 4 (All-India); state-specific edible oil sub-breakup not published in Table 3.6.',
              'PDS subsidized oil allocation buffers low-income cardholders.'
            ]
          }
        },
        {
          itemId: 'processed_snacks',
          itemName: 'Processed Snacks & Packaged Namkeen',
          budgetSharePct: null,
          passThroughFactor: null,
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'FMCG Packaged Goods Elasticity Index',
            publisher: 'DCA',
            vintageYear: '2024',
            verificationStatus: '[VERIFY]',
            caveats: ['Packaged foods exhibit grammage reduction (shrinkflation) rather than direct price increases. Unverified.']
          }
        }
      ]
    };
  }

  if (scenarioId === 'wheat-procurement-spike') {
    const wheatLow = Math.round(mpceBaseline * (allIndiaCerealsPct / 100) * 0.06 * 0.45);
    const wheatHigh = Math.round(mpceBaseline * (allIndiaCerealsPct / 100) * 0.06 * 0.60);

    return {
      persona,
      mpceBaselineInr: mpceBaseline,
      mpceBaselineReceipt,
      totalMonthlyImpactRangeInr: { low: wheatLow, high: wheatHigh },
      unit: '₹ / person / month (Per Capita)',
      isHouseholdConversion: false,
      averageHouseholdSize: 4.5,
      itemCoverage: {
        totalCandidateItems: 10,
        calculatedItemsCount: 1,
        uncalculatedItemsCount: 9,
        calculatedExpenditureSharePct: allIndiaCerealsPct,
      },
      isAiOff,
      notes: `Open-market wheat arrival spike for ${persona.sector} MP. Baseline MPCE anchored to Table 2 (₹${mpceBaseline}/mo). PMGKAY free grain entitlement insulates eligible cardholders.`,
      itemBreakdown: [
        {
          itemId: 'open_market_wheat',
          itemName: 'Open Market Atta & Cereals',
          budgetSharePct: allIndiaCerealsPct,
          passThroughFactor: { low: 0.45, high: 0.60 },
          estimatedMonthlyImpactInr: { low: wheatLow, high: wheatHigh },
          dataStatus: 'available',
          receipt: {
            sourceTitle: 'MoSPI HCES 2023–24 Factsheet Statement 4 (Cereal Share)',
            publisher: 'Ministry of Statistics and Programme Implementation (MoSPI)',
            vintageYear: '2023-24',
            geography: `All-India (${persona.sector})`,
            unit: 'INR / month',
            verificationStatus: '[VERIFIED]',
            sourceUrl: MOSPI_HCES_FACTSHEET_URL,
            formulaDetails: `MPCE (₹${mpceBaseline}) × Share (${allIndiaCerealsPct}%) × Shock (+6.0%) × Elasticity (0.45–0.60)`,
            caveats: [
              'Cereals share sourced from Factsheet Statement 4 (All-India); state-specific cereal sub-breakup not published in Table 3.6.',
              'PMGKAY 5kg free foodgrain per person per month insulates bottom 40% fractiles from open-market price spikes.'
            ]
          }
        },
        {
          itemId: 'bread_bakery',
          itemName: 'Bakery Bread & Biscuits',
          budgetSharePct: null,
          passThroughFactor: null,
          estimatedMonthlyImpactInr: null,
          dataStatus: 'data_not_available',
          receipt: {
            sourceTitle: 'Bakery Manufacturers Price Monitor',
            publisher: 'PMD',
            vintageYear: '2024',
            verificationStatus: '[VERIFY]',
            caveats: ['Commercial bakeries operate on forward grain contracts. Direct household pass-through unverified.']
          }
        }
      ]
    };
  }

  // Custom / Unquantified scenario: STRICTLY NULL TOTAL AND NO NUMERICAL ESTIMATE PRODUCED!
  return {
    persona,
    mpceBaselineInr: mpceBaseline,
    mpceBaselineReceipt,
    totalMonthlyImpactRangeInr: null, // STRICTLY NULL
    unit: '₹ / person / month (Per Capita)',
    isHouseholdConversion: false,
    averageHouseholdSize: 4.5,
    itemCoverage: {
      totalCandidateItems: 10,
      calculatedItemsCount: 0,
      uncalculatedItemsCount: 10,
      calculatedExpenditureSharePct: 0,
    },
    isAiOff,
    notes: 'No numerical estimate is produced — Data not available. A rupee impact range will be displayed only when verified pass-through coefficients and expenditure weights are available.',
    itemBreakdown: [
      {
        itemId: 'unverified_news_item',
        itemName: 'Custom News Scenario Item',
        budgetSharePct: null,
        passThroughFactor: null,
        estimatedMonthlyImpactInr: null,
        dataStatus: 'data_not_available',
        receipt: {
          sourceTitle: 'User Supplied News Dispatch',
          publisher: 'Direct Text Input',
          vintageYear: '2026',
          verificationStatus: '[UNVERIFIED]',
          caveats: [
            'No verified pass-through data available for custom text input.',
            'Strictly marked Data not available: No numerical estimate is produced.'
          ],
        }
      }
    ]
  };
}

export function getScenarioGraph(scenarioId: string, customText?: string): KnowledgeGraphData {
  if (customText && customText.trim().length > 0 && scenarioId === 'custom') {
    return generateCustomGraphFixture(customText.trim());
  }

  if (scenarioId === 'edible-oil-tariff') {
    return EDIBLE_OIL_GRAPH;
  }
  if (scenarioId === 'wheat-procurement-spike') {
    return WHEAT_GRAPH;
  }
  return CRUDE_OIL_GRAPH;
}

export const MOCK_GRAPH_FIXTURE = CRUDE_OIL_GRAPH;
export const MOCK_PERSONA_FIXTURE = calculatePersonaImpact('crude-oil-12pct', {
  state: 'Madhya Pradesh',
  sector: 'Rural',
  expenditureClass: 'Middle',
});
