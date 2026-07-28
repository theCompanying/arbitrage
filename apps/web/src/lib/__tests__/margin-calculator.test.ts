import {
  calculateMargin,
  getFbaSizeTier,
  calculateMonthlyStorageFee,
  calculateProfitabilityScore,
  getRecommendation,
  type MarginCalculationInput,
  type Category,
} from '../margin-calculator';

describe('getFbaSizeTier', () => {
  it('should classify as small_standard for small lightweight items', () => {
    const size = getFbaSizeTier(12, 10, 0.5, 0.5); // 12oz
    expect(size).toBe('small_standard');
  });

  it('should classify as large_standard for medium items', () => {
    const size = getFbaSizeTier(16, 12, 6, 15); // 15 lb
    expect(size).toBe('large_standard');
  });

  it('should classify as small_oversize for larger items', () => {
    const size = getFbaSizeTier(50, 30, 20, 50); // 50 lb
    expect(size).toBe('small_oversize');
  });

  it('should classify as medium_oversize for very large items', () => {
    const size = getFbaSizeTier(100, 50, 30, 120); // 120 lb
    expect(size).toBe('medium_oversize');
  });

  it('should classify as large_oversize for oversized items', () => {
    const size = getFbaSizeTier(120, 60, 40, 200); // 200 lb
    expect(size).toBe('large_oversize');
  });

  it('should handle edge case at small_standard boundary', () => {
    const size = getFbaSizeTier(15, 12, 0.75, 0.75); // Exactly at boundary
    expect(size).toBe('small_standard');
  });

  it('should handle edge case at large_standard boundary', () => {
    const size = getFbaSizeTier(18, 14, 8, 20); // Exactly at boundary
    expect(size).toBe('large_standard');
  });
});

describe('calculateMonthlyStorageFee', () => {
  it('should calculate storage fee for non-peak season', () => {
    // 12" x 12" x 12" = 1 cubic foot
    const fee = calculateMonthlyStorageFee(12, 12, 12, 3); // April
    expect(fee).toBeCloseTo(0.87, 2);
  });

  it('should calculate storage fee for peak season (Oct-Dec)', () => {
    // 12" x 12" x 12" = 1 cubic foot
    const fee = calculateMonthlyStorageFee(12, 12, 12, 10); // November
    expect(fee).toBeCloseTo(2.40, 2);
  });

  it('should calculate proportional fee for smaller items', () => {
    // 6" x 6" x 6" = 0.125 cubic foot
    const fee = calculateMonthlyStorageFee(6, 6, 6, 3); // April
    expect(fee).toBeCloseTo(0.11, 2); // 0.125 * 0.87
  });
});

describe('calculateMargin', () => {
  const baseInput: MarginCalculationInput = {
    productCost: 5.00,
    shippingToAmazon: 2.00,
    amazonPrice: 24.99,
    length: 10,
    width: 8,
    height: 4,
    weight: 1.5,
    category: 'home_kitchen' as Category,
  };

  it('should calculate margin for standard home & kitchen product', () => {
    const result = calculateMargin(baseInput);

    expect(result.revenue).toBe(24.99);
    expect(result.productCost).toBe(5.00);
    expect(result.shippingCost).toBe(2.00);
    expect(result.fbaFulfillmentFee).toBe(4.75); // large_standard
    expect(result.referralFee).toBeCloseTo(3.75, 2); // 15% of 24.99
    expect(result.totalCosts).toBeGreaterThan(10);
    expect(result.grossProfit).toBeGreaterThan(0);
    expect(result.grossMarginPercent).toBeGreaterThan(0);
    expect(result.netMarginPercent).toBe(result.grossMarginPercent);
    expect(result.breakEvenPrice).toBeGreaterThan(0);
    expect(result.minimumViablePrice).toBeGreaterThan(result.breakEvenPrice);
    expect(result.roi).toBeGreaterThan(0);
  });

  it('should calculate margin for electronics (lower referral fee)', () => {
    const electronicsInput: MarginCalculationInput = {
      ...baseInput,
      category: 'electronics',
    };

    const result = calculateMargin(electronicsInput);

    // Electronics has 8% referral fee vs 15% for home_kitchen
    expect(result.referralFee).toBeLessThan(
      calculateMargin(baseInput).referralFee
    );
    expect(result.grossProfit).toBeGreaterThan(
      calculateMargin(baseInput).grossProfit
    );
  });

  it('should calculate margin for beauty (higher referral fee)', () => {
    const beautyInput: MarginCalculationInput = {
      ...baseInput,
      category: 'beauty',
    };

    const result = calculateMargin(beautyInput);

    // Beauty has 20% referral fee vs 15% for home_kitchen
    expect(result.referralFee).toBeGreaterThan(
      calculateMargin(baseInput).referralFee
    );
    expect(result.grossProfit).toBeLessThan(
      calculateMargin(baseInput).grossProfit
    );
  });

  it('should enforce minimum referral fee of $0.30', () => {
    const lowPriceInput: MarginCalculationInput = {
      ...baseInput,
      amazonPrice: 3.00, // Very low price
    };

    const result = calculateMargin(lowPriceInput);

    expect(result.referralFee).toBeGreaterThanOrEqual(0.30);
  });

  it('should handle small_standard size tier', () => {
    const smallInput: MarginCalculationInput = {
      ...baseInput,
      length: 12,
      width: 10,
      height: 0.5,
      weight: 0.5, // 8 oz
    };

    const result = calculateMargin(smallInput);

    expect(result.fbaFulfillmentFee).toBe(3.22); // small_standard fee
  });

  it('should calculate break-even price correctly', () => {
    const result = calculateMargin(baseInput);

    // At break-even price, profit should be ~0
    const breakEvenResult = calculateMargin({
      ...baseInput,
      amazonPrice: result.breakEvenPrice,
    });

    expect(breakEvenResult.grossProfit).toBeCloseTo(0, 1);
  });

  it('should handle high-cost low-margin scenario', () => {
    const highCostInput: MarginCalculationInput = {
      ...baseInput,
      productCost: 15.00, // High product cost
    };

    const result = calculateMargin(highCostInput);

    expect(result.grossMarginPercent).toBeLessThan(
      calculateMargin(baseInput).grossMarginPercent
    );
    expect(result.netProfit).toBeLessThan(calculateMargin(baseInput).netProfit);
  });
});

describe('calculateProfitabilityScore', () => {
  it('should give high score for excellent margins', () => {
    const excellentResult = {
      revenue: 29.99,
      productCost: 4.00,
      shippingCost: 2.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 4.50,
      totalCosts: 15.25,
      grossProfit: 14.74,
      grossMarginPercent: 49.15,
      netProfit: 14.74,
      netMarginPercent: 49.15,
      breakEvenPrice: 18.50,
      minimumViablePrice: 20.50,
      roi: 163.78,
    };

    const score = calculateProfitabilityScore(excellentResult);

    expect(score).toBeGreaterThanOrEqual(70);
  });

  it('should give medium score for decent margins', () => {
    const decentResult = {
      revenue: 24.99,
      productCost: 8.00,
      shippingCost: 3.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 3.75,
      totalCosts: 19.50,
      grossProfit: 5.49,
      grossMarginPercent: 21.97,
      netProfit: 5.49,
      netMarginPercent: 21.97,
      breakEvenPrice: 21.00,
      minimumViablePrice: 23.00,
      roi: 49.91,
    };

    const score = calculateProfitabilityScore(decentResult);

    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThan(70);
  });

  it('should give low score for poor margins', () => {
    const poorResult = {
      revenue: 19.99,
      productCost: 12.00,
      shippingCost: 4.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 3.00,
      totalCosts: 23.75,
      grossProfit: -3.76,
      grossMarginPercent: -18.81,
      netProfit: -3.76,
      netMarginPercent: -18.81,
      breakEvenPrice: 24.00,
      minimumViablePrice: 26.00,
      roi: -23.52,
    };

    const score = calculateProfitabilityScore(poorResult);

    expect(score).toBeLessThan(40);
  });

  it('should clamp score between 0 and 100', () => {
    const extremeGood = {
      revenue: 100,
      productCost: 1,
      shippingCost: 1,
      fbaFulfillmentFee: 1,
      referralFee: 1,
      totalCosts: 4,
      grossProfit: 96,
      grossMarginPercent: 96,
      netProfit: 96,
      netMarginPercent: 96,
      breakEvenPrice: 5,
      minimumViablePrice: 7,
      roi: 4800,
    };

    const extremeBad = {
      revenue: 10,
      productCost: 100,
      shippingCost: 50,
      fbaFulfillmentFee: 20,
      referralFee: 1.5,
      totalCosts: 171.5,
      grossProfit: -161.5,
      grossMarginPercent: -1615,
      netProfit: -161.5,
      netMarginPercent: -1615,
      breakEvenPrice: 200,
      minimumViablePrice: 202,
      roi: -1000,
    };

    expect(calculateProfitabilityScore(extremeGood)).toBeLessThanOrEqual(100);
    expect(calculateProfitabilityScore(extremeBad)).toBeGreaterThanOrEqual(0);
  });
});

describe('getRecommendation', () => {
  it('should return GO for high-scoring products', () => {
    const excellentResult = {
      revenue: 29.99,
      productCost: 4.00,
      shippingCost: 2.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 4.50,
      totalCosts: 15.25,
      grossProfit: 14.74,
      grossMarginPercent: 49.15,
      netProfit: 14.74,
      netMarginPercent: 49.15,
      breakEvenPrice: 18.50,
      minimumViablePrice: 20.50,
      roi: 163.78,
    };

    const recommendation = getRecommendation(excellentResult);

    expect(recommendation.verdict).toBe('GO');
    expect(recommendation.reason).toContain('Strong margins');
  });

  it('should return MAYBE for medium-scoring products', () => {
    const decentResult = {
      revenue: 24.99,
      productCost: 8.00,
      shippingCost: 3.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 3.75,
      totalCosts: 19.50,
      grossProfit: 5.49,
      grossMarginPercent: 21.97,
      netProfit: 5.49,
      netMarginPercent: 21.97,
      breakEvenPrice: 21.00,
      minimumViablePrice: 23.00,
      roi: 49.91,
    };

    const recommendation = getRecommendation(decentResult);

    expect(recommendation.verdict).toBe('MAYBE');
    expect(recommendation.reason).toContain('Decent margins');
  });

  it('should return NO_GO for low-scoring products', () => {
    const poorResult = {
      revenue: 19.99,
      productCost: 12.00,
      shippingCost: 4.00,
      fbaFulfillmentFee: 4.75,
      referralFee: 3.00,
      totalCosts: 23.75,
      grossProfit: -3.76,
      grossMarginPercent: -18.81,
      netProfit: -3.76,
      netMarginPercent: -18.81,
      breakEvenPrice: 24.00,
      minimumViablePrice: 26.00,
      roi: -23.52,
    };

    const recommendation = getRecommendation(poorResult);

    expect(recommendation.verdict).toBe('NO_GO');
    expect(recommendation.reason).toContain('Margins too low');
  });
});

describe('Margin Calculator Integration', () => {
  it('should provide complete workflow from input to recommendation', () => {
    const input: MarginCalculationInput = {
      productCost: 6.50,
      shippingToAmazon: 2.50,
      amazonPrice: 27.99,
      length: 11,
      width: 9,
      height: 5,
      weight: 2.0,
      category: 'sports',
    };

    const result = calculateMargin(input);
    const score = calculateProfitabilityScore(result);
    const recommendation = getRecommendation(result);

    // Verify all parts work together
    expect(result).toBeDefined();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(['GO', 'MAYBE', 'NO_GO']).toContain(recommendation.verdict);
    expect(recommendation.reason.length).toBeGreaterThan(0);
  });
});
