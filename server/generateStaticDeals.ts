import fs from 'fs';
import path from 'path';
import { fetchAffiliateProducts } from '../src/lib/affiliateApi';
import { buildDealHtml } from '../src/lib/publishDealHtml';

export async function generateStaticDeals(targetBaseDir?: string) {
  try {
    console.log('[Static Page Generator] 🚀 Starting static HTML generation for Deals...');
    const products = await fetchAffiliateProducts();
    
    if (!products || products.length === 0) {
      console.log('[Static Page Generator] No deals found to generate.');
      return;
    }

    const outputDirs = targetBaseDir 
      ? [targetBaseDir]
      : [path.join(process.cwd(), 'dist')];

    products.forEach((product) => {
      const dealId = product.id.replace(/^(\/)?deal\//i, '').replace(/\.html?$/i, '').trim();
      if (!dealId) return;

      const finalHtml = buildDealHtml(product);

      outputDirs.forEach((outDir) => {
        try {
          if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
          }

          // 1. /deal/[dealId]/index.html (This completely fixes the clean URL sharing on Amplify!)
          const dealDir = path.join(outDir, 'deal', dealId);
          if (!fs.existsSync(dealDir)) {
            fs.mkdirSync(dealDir, { recursive: true });
          }
          fs.writeFileSync(path.join(dealDir, 'index.html'), finalHtml, 'utf-8');

          // 2. /deal/[dealId].html (For explicit .html hits)
          const htmlPath = path.join(outDir, 'deal', `${dealId}.html`);
          fs.writeFileSync(htmlPath, finalHtml, 'utf-8');

        } catch (writeErr) {
          console.warn(`[Static Page Generator] Write error for deal ${dealId} in ${outDir}:`, writeErr);
        }
      });
    });

    console.log(`[Static Page Generator] ✅ Static HTML for ${products.length} deals generated successfully!`);
  } catch (err) {
    console.error('[Static Page Generator] Error generating deals:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('generateStaticDeals')) {
  generateStaticDeals().then(() => {
    console.log('Deals generation complete.');
    process.exit(0);
  });
}
