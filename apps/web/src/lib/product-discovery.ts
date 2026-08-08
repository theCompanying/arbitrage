import { prisma, DiscoveryRule, DiscoveryResult, DiscoveryStatus, Product, ProductStatus } from '@arbitrage/database';

export interface DiscoveryCriteria {
  minMargin?: number;
  maxBsr?: number;
  maxReviews?: number;
  minRating?: number;
  priceRange?: { min: number; max: number };
  categories?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

export interface DiscoveredProduct {
  title: string;
  url: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  bsr?: number;
  category?: string;
  estimatedMargin: number;
  estimatedProfit: number;
  score: number;
}

export interface AliExpressProduct {
  title: string;
  url: string;
  price: number;
  shipping?: number;
  rating?: number;
  reviewCount?: number;
  orders?: number;
  imageUrl?: string;
  category?: string;
}

const AMAZON_REFERRAL_RATE = 0.15;
const FBA_FEE_ESTIMATE = 5.00;

export function calculateOpportunityScore(product: DiscoveredProduct): number {
  let score = 0;

  if (product.estimatedMargin >= 30) score += 30;
  else if (product.estimatedMargin >= 25) score += 20;
  else if (product.estimatedMargin >= 20) score += 10;

  if (product.bsr && product.bsr <= 10000) score += 25;
  else if (product.bsr && product.bsr <= 50000) score += 15;
  else if (product.bsr && product.bsr <= 100000) score += 5;

  if (product.reviewCount && product.reviewCount <= 100) score += 20;
  else if (product.reviewCount && product.reviewCount <= 500) score += 10;
  else if (product.reviewCount && product.reviewCount <= 1000) score += 5;

  if (product.rating && product.rating >= 4.0) score += 10;
  else if (product.rating && product.rating >= 3.5) score += 5;

  if (product.estimatedProfit >= 15) score += 15;
  else if (product.estimatedProfit >= 10) score += 10;
  else if (product.estimatedProfit >= 5) score += 5;

  return Math.min(score, 100);
}

export function calculateMarginAndProfit(
  aliexpressPrice: number,
  shippingCost: number = 0,
  amazonPrice?: number
): { margin: number; profit: number } {
  if (!amazonPrice) {
    return { margin: 0, profit: 0 };
  }

  const totalCost = aliexpressPrice + shippingCost;
  const referralFee = amazonPrice * AMAZON_REFERRAL_RATE;
  const fbaFee = FBA_FEE_ESTIMATE;
  const totalFees = referralFee + fbaFee;
  
  const profit = amazonPrice - totalCost - totalFees;
  const margin = (profit / amazonPrice) * 100;

  return {
    margin: Math.max(0, parseFloat(margin.toFixed(2))),
    profit: Math.max(0, parseFloat(profit.toFixed(2)))
  };
}

export async function scanAliExpressCategories(
  rule: DiscoveryRule
): Promise<DiscoveredProduct[]> {
  const categories = rule.categories.length > 0 
    ? rule.categories 
    : ['home-garden', 'sports-entertainment', 'toys-hobbies'];

  const allProducts: DiscoveredProduct[] = [];

  for (const category of categories) {
    try {
      const products = await fetchAliExpressCategory(category, rule);
      allProducts.push(...products);
    } catch (error) {
      console.error(`Error scanning category ${category}:`, error);
    }
  }

  return allProducts;
}

async function fetchAliExpressCategory(
  category: string,
  rule: DiscoveryRule
): Promise<DiscoveredProduct[]> {
  const baseUrl = 'https://www.aliexpress.com/wholesale';
  const params = new URLSearchParams({
    SearchText: rule.keywords.join(' ') || '',
    SortType: 'order_asc',
    MinimumPrice: rule.priceRange ? String((rule.priceRange as any).min || '') : '',
    MaximumPrice: rule.priceRange ? String((rule.priceRange as any).max || '') : '',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const products = parseAliExpressHtml(html, rule);
    return products;
  } catch (error) {
    console.error(`Failed to fetch category ${category}:`, error);
    return [];
  }
}

function parseAliExpressHtml(html: string, rule: DiscoveryRule): DiscoveredProduct[] {
  const products: DiscoveredProduct[] = [];
  
  const titleMatch = html.match(/data-title="([^"]+)"/g);
  const priceMatch = html.match(/data-price="([^"]+)"/g);
  const urlMatch = html.match(/href="(https?:\/\/www\.aliexpress\.com\/item\/[^"]+)"/g);
  const ratingMatch = html.match(/data-rating="([^"]+)"/g);
  const reviewsMatch = html.match(/data-reviews="([^"]+)"/g);

  if (!titleMatch || !priceMatch) {
    return products;
  }

  const maxProducts = Math.min(titleMatch.length, 20);

  for (let i = 0; i < maxProducts; i++) {
    try {
      const title = titleMatch[i]?.replace('data-title="', '').replace('"', '') || '';
      const priceStr = priceMatch[i]?.replace('data-price="', '').replace('"', '') || '0';
      const price = parseFloat(priceStr);

      if (isNaN(price) || price <= 0) continue;

      const url = urlMatch?.[i]?.replace('href="', '').replace('"', '') || '';
      const rating = ratingMatch?.[i] 
        ? parseFloat(ratingMatch[i].replace('data-rating="', '').replace('"', ''))
        : undefined;
      const reviewCount = reviewsMatch?.[i]
        ? parseInt(reviewsMatch[i].replace('data-reviews="', '').replace('"', ''), 10)
        : undefined;

      if (shouldExcludeProduct(title, rule)) {
        continue;
      }

      const amazonPrice = estimateAmazonPrice(price);
      const { margin, profit } = calculateMarginAndProfit(price, 0, amazonPrice);

      const product: DiscoveredProduct = {
        title: title.substring(0, 200),
        url,
        price,
        rating,
        reviewCount,
        estimatedMargin: margin,
        estimatedProfit: profit,
        score: 0,
      };

      product.score = calculateOpportunityScore(product);
      products.push(product);
    } catch (error) {
      console.error('Error parsing product:', error);
    }
  }

  return products;
}

function shouldExcludeProduct(title: string, rule: DiscoveryRule): boolean {
  const lowerTitle = title.toLowerCase();

  for (const keyword of rule.excludeKeywords) {
    if (lowerTitle.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  if (rule.keywords.length > 0) {
    const hasKeyword = rule.keywords.some(k => 
      lowerTitle.includes(k.toLowerCase())
    );
    if (!hasKeyword) {
      return true;
    }
  }

  return false;
}

function estimateAmazonPrice(aliexpressPrice: number): number {
  const multiplier = 3.5;
  return parseFloat((aliexpressPrice * multiplier).toFixed(2));
}

export async function applyDiscoveryFilters(
  products: DiscoveredProduct[],
  rule: DiscoveryRule
): Promise<DiscoveredProduct[]> {
  return products.filter(product => {
    if (rule.minMargin && product.estimatedMargin < Number(rule.minMargin)) {
      return false;
    }

    if (rule.maxBsr && product.bsr && product.bsr > rule.maxBsr) {
      return false;
    }

    if (rule.maxReviews && product.reviewCount && product.reviewCount > rule.maxReviews) {
      return false;
    }

    if (rule.minRating && product.rating && product.rating < Number(rule.minRating)) {
      return false;
    }

    return true;
  });
}

export async function saveDiscoveryResults(
  ruleId: string,
  products: DiscoveredProduct[]
): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];

  for (const product of products) {
    const isDuplicate = await checkDuplicate(product.url);

    if (isDuplicate) {
      continue;
    }

    try {
      const result = await prisma.discoveryResult.create({
        data: {
          ruleId,
          title: product.title,
          url: product.url,
          price: product.price,
          rating: product.rating,
          reviewCount: product.reviewCount,
          bsr: product.bsr,
          category: product.category,
          estimatedMargin: product.estimatedMargin,
          estimatedProfit: product.estimatedProfit,
          score: product.score,
          status: DiscoveryStatus.NEW,
        },
      });
      results.push(result);
    } catch (error) {
      console.error('Error saving discovery result:', error);
    }
  }

  await prisma.discoveryRule.update({
    where: { id: ruleId },
    data: {
      productsFound: { increment: products.length },
      lastScanAt: new Date(),
    },
  });

  return results;
}

async function checkDuplicate(url: string): Promise<boolean> {
  const existing = await prisma.discoveryResult.findFirst({
    where: { url },
  });

  if (existing) {
    return true;
  }

  const existingProduct = await prisma.product.findFirst({
    where: { aliexpressUrl: url },
  });

  return !!existingProduct;
}

export async function importDiscoveryResult(
  resultId: string
): Promise<Product | null> {
  const result = await prisma.discoveryResult.findUnique({
    where: { id: resultId },
    include: { rule: true },
  });

  if (!result) {
    return null;
  }

  const product = await prisma.product.create({
    data: {
      title: result.title,
      aliexpressUrl: result.url,
      aliexpressPrice: Number(result.price),
      amazonPrice: Number(result.price) * 3.5,
      estimatedMargin: Number(result.estimatedMargin),
      estimatedProfit: Number(result.estimatedProfit),
      bsr: result.bsr,
      reviewCount: result.reviewCount,
      avgRating: result.rating ? Number(result.rating) : null,
      status: ProductStatus.RESEARCH,
      notes: `Discovered via rule: ${result.rule.name}`,
    },
  });

  await prisma.discoveryResult.update({
    where: { id: resultId },
    data: {
      status: DiscoveryStatus.IMPORTED,
      productId: product.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.discoveryRule.update({
    where: { id: result.ruleId },
    data: {
      productsImported: { increment: 1 },
    },
  });

  return product;
}

export async function executeDiscoveryScan(ruleId: string): Promise<{
  productsFound: number;
  productsImported: number;
  results: DiscoveryResult[];
}> {
  const rule = await prisma.discoveryRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule) {
    throw new Error(`Discovery rule ${ruleId} not found`);
  }

  const products = await scanAliExpressCategories(rule);
  const filtered = await applyDiscoveryFilters(products, rule);
  const results = await saveDiscoveryResults(ruleId, filtered);

  const nextScanAt = calculateNextScanAt(rule.scanFrequency);

  await prisma.discoveryRule.update({
    where: { id: ruleId },
    data: {
      nextScanAt,
      lastScanAt: new Date(),
    },
  });

  return {
    productsFound: filtered.length,
    productsImported: results.length,
    results,
  };
}

function calculateNextScanAt(frequency: string): Date {
  const now = new Date();

  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function getDiscoveryStats(ruleId?: string) {
  const where = ruleId ? { ruleId } : {};

  const totalResults = await prisma.discoveryResult.count({ where });
  const newResults = await prisma.discoveryResult.count({
    where: { ...where, status: DiscoveryStatus.NEW },
  });
  const importedResults = await prisma.discoveryResult.count({
    where: { ...where, status: DiscoveryStatus.IMPORTED },
  });
  const rejectedResults = await prisma.discoveryResult.count({
    where: { ...where, status: DiscoveryStatus.REJECTED },
  });

  return {
    totalResults,
    newResults,
    importedResults,
    rejectedResults,
  };
}
