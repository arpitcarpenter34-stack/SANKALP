import { describe, it, expect } from 'vitest';
import { SECTOR_CATEGORIES, SECTORS_DATA } from '../sectorsData';

describe('Sectors Dashboard Data & Integrity Tests', () => {
  it('defines all 7 economic sector categories matching reference architecture', () => {
    expect(SECTOR_CATEGORIES).toHaveLength(7);
    const categoryIds = SECTOR_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('semiconductors');
    expect(categoryIds).toContain('petrol');
    expect(categoryIds).toContain('lpg');
    expect(categoryIds).toContain('food');
    expect(categoryIds).toContain('shipping');
    expect(categoryIds).toContain('currency');
    expect(categoryIds).toContain('energy');
  });

  it('provides a complete, validated dataset for every defined sector', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const data = SECTORS_DATA[cat.id];
      expect(data).toBeDefined();
      expect(data.id).toBe(cat.id);
      expect(data.name).toBe(cat.name);
      expect(data.description.length).toBeGreaterThan(15);
      expect(data.domainId).toBeDefined();
    }
  });

  it('guarantees each sector has exactly 4 compact KPI cards with sparklines', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const data = SECTORS_DATA[cat.id];
      expect(data.kpis).toHaveLength(4);
      for (const kpi of data.kpis) {
        expect(kpi.title.length).toBeGreaterThan(3);
        expect(kpi.value.length).toBeGreaterThan(1);
        expect(kpi.change.length).toBeGreaterThan(1);
        expect(['bar', 'line', 'donut']).toContain(kpi.sparklineType);
        expect(kpi.sparklineData.length).toBeGreaterThan(0);
      }
    }
  });

  it('verifies import dependence categories sum exactly to 100% for each sector', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const { categories, totalDependencePct } = SECTORS_DATA[cat.id].importDependence;
      expect(totalDependencePct).toBeGreaterThanOrEqual(0);
      expect(totalDependencePct).toBeLessThanOrEqual(100);

      const sum = categories.reduce((acc, curr) => acc + curr.percentage, 0);
      expect(sum).toBe(100);
    }
  });

  it('validates dual-series price comparison charts for all time ranges', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const chart = SECTORS_DATA[cat.id].priceComparison;
      expect(chart.title.length).toBeGreaterThan(5);
      expect(chart.seriesAName.length).toBeGreaterThan(2);
      expect(chart.seriesBName.length).toBeGreaterThan(2);

      for (const range of ['6M', '1Y', '3Y', '5Y'] as const) {
        const rangeData = chart.ranges[range];
        expect(rangeData).toBeDefined();
        expect(rangeData.dates.length).toBeGreaterThan(0);
        expect(rangeData.seriesA.length).toBe(rangeData.dates.length);
        expect(rangeData.seriesB.length).toBe(rangeData.dates.length);
      }
    }
  });

  it('verifies downstream industry impacts have valid severity and key effects', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const impacts = SECTORS_DATA[cat.id].downstreamImpacts;
      expect(impacts.length).toBeGreaterThanOrEqual(3);
      for (const imp of impacts) {
        expect(imp.name.length).toBeGreaterThan(2);
        expect(['High', 'Medium', 'Low']).toContain(imp.severity);
        expect(imp.keyEffectNum).toBeGreaterThan(0);
        expect(imp.details.length).toBeGreaterThan(5);
      }
    }
  });

  it('ensures stock index performance lists related indices and time series points', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const stock = SECTORS_DATA[cat.id].stockPerformance;
      expect(stock.indices.length).toBeGreaterThanOrEqual(2);
      for (const idx of stock.indices) {
        expect(idx.name.length).toBeGreaterThan(2);
        expect(idx.chartPoints.length).toBe(idx.months.length);
        expect(idx.minY).toBeLessThan(idx.maxY);
      }
    }
  });

  it('confirms news coverage and key takeaways are well-populated and cited', () => {
    for (const cat of SECTOR_CATEGORIES) {
      const { news, takeaways, details } = SECTORS_DATA[cat.id];
      expect(news.length).toBeGreaterThanOrEqual(1);
      expect(takeaways.length).toBeGreaterThanOrEqual(3);
      expect(details.globalShare.length).toBeGreaterThan(2);
      expect(details.importDependence.length).toBeGreaterThan(2);
      expect(details.householdConnection.length).toBeGreaterThan(5);
    }
  });

  it('specifically validates semiconductor data matches the reference screenshot numbers', () => {
    const semi = SECTORS_DATA.semiconductors;
    expect(semi.kpis[0].title).toBe('Global Chip Price Index');
    expect(semi.kpis[0].value).toBe('218.4');
    expect(semi.kpis[0].change).toBe('+18% ↑');

    expect(semi.kpis[1].title).toBe('India Imports (Value)');
    expect(semi.kpis[1].value).toBe('₹1.9 Lakh Cr');
    expect(semi.kpis[1].change).toBe('+12% ↑');

    expect(semi.kpis[2].title).toBe('Sector Market Index');
    expect(semi.kpis[2].value).toBe('14,230');
    expect(semi.kpis[2].change).toBe('+6.2% ↑');

    expect(semi.kpis[3].title).toBe('Import Dependence');
    expect(semi.kpis[3].value).toBe('76%');

    // Donut categories
    const icCat = semi.importDependence.categories.find((c) => c.id === 'ic');
    expect(icCat?.percentage).toBe(42);

    // Downstream rows
    expect(semi.downstreamImpacts[0].name).toBe('Consumer Electronics');
    expect(semi.downstreamImpacts[0].keyEffectPct).toBe('+8%');
  });
});
