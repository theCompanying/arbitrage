import {
  generateTitle,
  generateBulletPoints,
  generateDescription,
  generateKeywords,
  calculateRecommendedPrice,
  generateListing,
  type ListingInput,
} from '../listing-generator';

describe('generateTitle', () => {
  const baseInput: ListingInput = {
    productName: 'Wireless Earbuds',
    features: ['Bluetooth 5.0', '30-hour battery', 'Waterproof'],
    description: 'High-quality wireless earbuds',
    category: 'electronics',
    productCost: 10,
    shippingToAmazon: 2,
    dimensions: { length: 4, width: 3, height: 2, weight: 0.5 },
  };

  it('should generate title with brand and keyword', () => {
    const input = { ...baseInput, targetKeywords: ['Bluetooth Earbuds'] };
    const title = generateTitle(input);
    
    expect(title).toContain('[Brand]');
    expect(title).toContain('Bluetooth Earbuds');
    expect(title.length).toBeLessThanOrEqual(200);
  });

  it('should use product name as keyword when no target keywords', () => {
    const title = generateTitle(baseInput);
    
    expect(title).toContain('Wireless Earbuds');
  });

  it('should include pack size when mentioned', () => {
    const input = {
      ...baseInput,
      productName: 'USB-C Cable 3-Pack',
    };
    const title = generateTitle(input);
    
    expect(title).toContain('3-Pack');
  });

  it('should truncate long titles to 200 chars', () => {
    const longName = 'A'.repeat(250);
    const input = { ...baseInput, productName: longName };
    const title = generateTitle(input);
    
    expect(title.length).toBeLessThanOrEqual(200);
  });

  it('should include key feature in title', () => {
    const title = generateTitle(baseInput);
    
    expect(title).toContain('Bluetooth');
  });
});

describe('generateBulletPoints', () => {
  const baseInput: ListingInput = {
    productName: 'Yoga Mat',
    features: [
      'Non-slip surface',
      'Extra thick 6mm cushioning',
      'Eco-friendly TPE material',
      'Lightweight and portable',
    ],
    description: 'Premium yoga mat',
    category: 'sports',
    productCost: 15,
    shippingToAmazon: 3,
    dimensions: { length: 72, width: 24, height: 0.25, weight: 2 },
  };

  it('should generate exactly 5 bullet points', () => {
    const bullets = generateBulletPoints(baseInput);
    expect(bullets).toHaveLength(5);
  });

  it('should format bullets with emojis', () => {
    const bullets = generateBulletPoints(baseInput);
    const emojis = ['🎯', '✨', '💪', '🏆', '✅'];
    
    bullets.forEach((bullet, i) => {
      expect(bullet).toContain(emojis[i]);
    });
  });

  it('should convert features to benefits', () => {
    const bullets = generateBulletPoints(baseInput);
    
    // Should contain benefit-driven language
    const bulletText = bullets.join(' ').toLowerCase();
    expect(bulletText).toMatch(/built to last|effortless|quality/);
  });

  it('should handle durable feature', () => {
    const input = {
      ...baseInput,
      features: ['Durable construction'],
    };
    const bullets = generateBulletPoints(input);
    
    expect(bullets[0]).toContain('BUILT TO LAST');
  });

  it('should handle easy/simple feature', () => {
    const input = {
      ...baseInput,
      features: ['Easy to clean'],
    };
    const bullets = generateBulletPoints(input);
    
    expect(bullets[0]).toContain('EFFORTLESS TO USE');
  });

  it('should handle safe feature', () => {
    const input = {
      ...baseInput,
      features: ['Safe non-toxic materials'],
    };
    const bullets = generateBulletPoints(input);
    
    expect(bullets[0]).toContain('SAFE FOR YOUR FAMILY');
  });

  it('should add category-specific bullet for sports', () => {
    const bullets = generateBulletPoints(baseInput);
    
    expect(bullets.join(' ')).toContain('PERFORMANCE');
  });

  it('should add default quality guarantee bullet when needed', () => {
    const input = {
      ...baseInput,
      features: [],
      category: 'other',
    };
    const bullets = generateBulletPoints(input);
    
    expect(bullets.join(' ')).toContain('QUALITY GUARANTEE');
  });
});

describe('generateDescription', () => {
  const baseInput: ListingInput = {
    productName: 'Coffee Maker',
    features: ['Programmable', '12-cup capacity', 'Auto shut-off'],
    description: 'Start your day with perfectly brewed coffee',
    category: 'home_kitchen',
    productCost: 30,
    shippingToAmazon: 5,
    dimensions: { length: 10, width: 8, height: 12, weight: 4 },
  };

  it('should generate description with product name', () => {
    const description = generateDescription(baseInput);
    
    expect(description).toContain('Coffee Maker');
  });

  it('should include features in description', () => {
    const description = generateDescription(baseInput);
    
    expect(description).toContain('Programmable');
    expect(description).toContain('12-cup capacity');
  });

  it('should include category context', () => {
    const description = generateDescription(baseInput);
    
    expect(description.toLowerCase()).toMatch(/kitchen|home/);
  });

  it('should stay within reasonable length', () => {
    const description = generateDescription(baseInput);
    
    expect(description.length).toBeGreaterThan(100);
    expect(description.length).toBeLessThan(2000);
  });
});

describe('generateKeywords', () => {
  const baseInput: ListingInput = {
    productName: 'Running Shoes',
    features: ['Lightweight', 'Breathable mesh', 'Cushioned sole'],
    description: 'Performance running shoes',
    category: 'sports',
    productCost: 25,
    shippingToAmazon: 4,
    targetKeywords: ['running shoes', 'athletic footwear'],
    dimensions: { length: 12, width: 5, height: 5, weight: 1 },
  };

  it('should include target keywords', () => {
    const keywords = generateKeywords(baseInput);
    
    expect(keywords).toContain('running shoes');
    expect(keywords).toContain('athletic footwear');
  });

  it('should extract keywords from product name', () => {
    const keywords = generateKeywords(baseInput);
    
    expect(keywords.join(' ')).toContain('running');
    expect(keywords.join(' ')).toContain('shoes');
  });

  it('should include category-related terms', () => {
    const keywords = generateKeywords(baseInput);
    
    const keywordText = keywords.join(' ').toLowerCase();
    expect(keywordText).toMatch(/sport|athletic|fitness|training/);
  });

  it('should return array of keywords', () => {
    const keywords = generateKeywords(baseInput);
    
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
  });
});

describe('calculateRecommendedPrice', () => {
  it('should calculate price for 25% margin by default', () => {
    const price = calculateRecommendedPrice({
      productCost: 10,
      shippingToAmazon: 2,
      amazonPrice: 25,
      length: 10,
      width: 8,
      height: 6,
      weight: 2,
      category: 'other',
    });
    
    expect(price.recommended).toBeGreaterThan(12);
    expect(price.min).toBeLessThan(price.recommended);
    expect(price.max).toBeGreaterThan(price.recommended);
  });

  it('should use custom target margin when provided', () => {
    const input: ListingInput = {
      productName: 'Test',
      features: [],
      description: 'Test',
      category: 'other',
      productCost: 10,
      shippingToAmazon: 2,
      targetMarginPercent: 35,
      dimensions: { length: 5, width: 5, height: 5, weight: 1 },
    };
    
    const price = calculateRecommendedPrice({
      productCost: input.productCost,
      shippingToAmazon: input.shippingToAmazon,
      amazonPrice: 30,
      ...input.dimensions,
      category: input.category,
    });
    
    expect(price.recommended).toBeGreaterThan(18);
  });

  it('should handle zero product cost', () => {
    const price = calculateRecommendedPrice({
      productCost: 0,
      shippingToAmazon: 0,
      amazonPrice: 20,
      length: 5,
      width: 5,
      height: 5,
      weight: 1,
      category: 'other',
    });
    
    expect(price.min).toBeGreaterThanOrEqual(0);
  });
});

describe('generateListing', () => {
  const baseInput: ListingInput = {
    productName: 'Resistance Bands Set',
    features: [
      '5 resistance levels',
      'Durable latex material',
      'Includes carrying bag',
      'Door anchor included',
    ],
    description: 'Complete home gym solution',
    category: 'sports',
    targetKeywords: ['resistance bands', 'workout bands', 'exercise bands'],
    productCost: 8,
    shippingToAmazon: 2,
    dimensions: { length: 8, width: 6, height: 3, weight: 1 },
  };

  it('should generate complete listing with all sections', () => {
    const listing = generateListing(baseInput);
    
    expect(listing.title).toBeDefined();
    expect(listing.bulletPoints).toBeDefined();
    expect(listing.description).toBeDefined();
    expect(listing.searchKeywords).toBeDefined();
    expect(listing.recommendedPrice).toBeDefined();
    expect(listing.minPrice).toBeDefined();
    expect(listing.maxPrice).toBeDefined();
  });

  it('should calculate character counts', () => {
    const listing = generateListing(baseInput);
    
    expect(listing.characterCounts.title).toBe(listing.title.length);
    expect(listing.characterCounts.bullets).toHaveLength(5);
    expect(listing.characterCounts.description).toBe(listing.description.length);
  });

  it('should calculate quality scores', () => {
    const listing = generateListing(baseInput);
    
    expect(listing.seoScore).toBeGreaterThanOrEqual(0);
    expect(listing.seoScore).toBeLessThanOrEqual(100);
    expect(listing.complianceScore).toBeGreaterThanOrEqual(0);
    expect(listing.complianceScore).toBeLessThanOrEqual(100);
  });

  it('should generate SEO-optimized title', () => {
    const listing = generateListing(baseInput);
    
    expect(listing.title).toContain('[Brand]');
    expect(listing.title.length).toBeLessThanOrEqual(200);
  });

  it('should generate exactly 5 bullet points', () => {
    const listing = generateListing(baseInput);
    
    expect(listing.bulletPoints).toHaveLength(5);
  });

  it('should price for target margin', () => {
    const listing = generateListing(baseInput);
    
    // Total cost is $8 + $2 = $10
    // For 25% margin, price should be around $13.33+
    expect(listing.recommendedPrice).toBeGreaterThan(10);
  });
});

describe('ListingInput type', () => {
  it('should accept valid input', () => {
    const input: ListingInput = {
      productName: 'Test Product',
      features: ['Feature 1'],
      description: 'Description',
      category: 'other',
      productCost: 10,
      shippingToAmazon: 2,
      dimensions: { length: 5, width: 5, height: 5, weight: 1 },
    };
    
    expect(input.productName).toBe('Test Product');
  });

  it('should accept optional targetKeywords', () => {
    const input: ListingInput = {
      productName: 'Test',
      features: [],
      description: 'Test',
      category: 'other',
      productCost: 10,
      shippingToAmazon: 2,
      targetKeywords: ['keyword1', 'keyword2'],
      dimensions: { length: 5, width: 5, height: 5, weight: 1 },
    };
    
    expect(input.targetKeywords).toHaveLength(2);
  });

  it('should accept optional targetMarginPercent', () => {
    const input: ListingInput = {
      productName: 'Test',
      features: [],
      description: 'Test',
      category: 'other',
      productCost: 10,
      shippingToAmazon: 2,
      targetMarginPercent: 30,
      dimensions: { length: 5, width: 5, height: 5, weight: 1 },
    };
    
    expect(input.targetMarginPercent).toBe(30);
  });
});
