import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { inventoryItems, skuMappings, skuVariations } from '@/db/schema';
import { eq, or, like, ilike, and } from 'drizzle-orm';

interface SkuMappingRequest {
  skus: string[];
  customerId?: number;
}

interface SkuSuggestion {
  original: string;
  suggested: string;
  description: string;
  confidence: number;
  source: 'inventory' | 'mapping' | 'variation';
}

// Calculate similarity between two strings (simple Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 100;
  
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 100;
  
  // Simple matching algorithm
  let matches = 0;
  const minLen = Math.min(len1, len2);
  
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  // Bonus for substring matches
  if (s1.includes(s2) || s2.includes(s1)) {
    matches += 2;
  }
  
  return Math.min(100, Math.round((matches / maxLen) * 100));
}

export async function POST(request: NextRequest) {
  try {
    const body: SkuMappingRequest = await request.json();
    
    if (!body.skus || !Array.isArray(body.skus) || body.skus.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'SKUs array is required'
      }, { status: 400 });
    }

    const suggestions: SkuSuggestion[] = [];

    for (const originalSku of body.skus) {
      const cleanSku = originalSku.trim();
      if (!cleanSku) continue;

      // 1. Check if SKU exists directly in inventory
      const directMatch = await db
        .select({
          sku: inventoryItems.sku,
          description: inventoryItems.description,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.sku, cleanSku))
        .limit(1);

      if (directMatch.length > 0) {
        // Skip if it's a direct match - not a non-standard SKU
        continue;
      }

      // 2. Check SKU mappings table
      const skuMapping = await db
        .select({
          standardSku: skuMappings.standardSku,
          description: skuMappings.standardDescription,
        })
        .from(skuMappings)
        .where(eq(skuMappings.standardSku, cleanSku))
        .limit(1);

      if (skuMapping.length > 0) {
        suggestions.push({
          original: originalSku,
          suggested: skuMapping[0].standardSku,
          description: skuMapping[0].description || 'Standard SKU mapping',
          confidence: 100,
          source: 'mapping'
        });
        continue;
      }

      // 3. Check customer-specific SKU variations
      if (body.customerId) {
        const customerVariation = await db
          .select({
            variationSku: skuVariations.variationSku,
            standardSku: skuMappings.standardSku,
            description: skuMappings.standardDescription,
          })
          .from(skuVariations)
          .innerJoin(skuMappings, eq(skuVariations.mappingId, skuMappings.id))
          .where(
            and(
              eq(skuVariations.customerId, body.customerId),
              eq(skuVariations.variationSku, cleanSku)
            )
          )
          .limit(1);

        if (customerVariation.length > 0) {
          suggestions.push({
            original: originalSku,
            suggested: customerVariation[0].standardSku,
            description: customerVariation[0].description || 'Customer-specific SKU variation',
            confidence: 100,
            source: 'variation'
          });
          continue;
        }
      }

      // 4. Fuzzy matching against inventory SKUs
      const fuzzyMatches = await db
        .select({
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          mpn: inventoryItems.mpn,
        })
        .from(inventoryItems)
        .where(
          or(
            ilike(inventoryItems.sku, `%${cleanSku}%`),
            ilike(inventoryItems.mpn, `%${cleanSku}%`),
            ilike(inventoryItems.sku, `%${cleanSku.replace(/[^a-z0-9]/gi, '')}%`)
          )
        )
        .limit(10);

      // Calculate similarity scores and find best matches
      const scoredMatches = fuzzyMatches
        .map(match => ({
          ...match,
          skuSimilarity: calculateSimilarity(cleanSku, match.sku),
          mpnSimilarity: match.mpn ? calculateSimilarity(cleanSku, match.mpn) : 0,
        }))
        .map(match => ({
          ...match,
          confidence: Math.max(match.skuSimilarity, match.mpnSimilarity),
        }))
        .filter(match => match.confidence >= 60) // Only suggest matches with 60%+ confidence
        .sort((a, b) => b.confidence - a.confidence);

      if (scoredMatches.length > 0) {
        const bestMatch = scoredMatches[0];
        suggestions.push({
          original: originalSku,
          suggested: bestMatch.sku,
          description: bestMatch.description || 'Similar SKU found',
          confidence: bestMatch.confidence,
          source: 'inventory'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 10), // Limit to top 10 suggestions
        nonStandardCount: suggestions.length,
      }
    });

  } catch (error) {
    console.warn('Error detecting SKU mappings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to detect SKU mappings'
    }, { status: 500 });
  }
} 