const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');

// 1. Add import
file = file.replace(
  /import \{ AffiliateProduct, fetchAffiliateProducts \} from '\.\.\/lib\/affiliateApi';/,
  "import { AffiliateProduct, fetchAffiliateProducts } from '../lib/affiliateApi';\nimport { ShareButton } from './ShareButton';"
);

// 2. Add ShareButton
file = file.replace(
  /<button \n\s*onClick=\{\(e\) => handleDeepLink\(e, product\.affiliateUrl, product\.platform as any \|\| 'amazon'\)\}\n\s*className="w-full bg-slate-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-slate-900\/20 hover:bg-slate-800 transition-transform hover:-translate-y-1 flex items-center justify-center gap-3"\n\s*>\n\s*Buy Now Securely <ExternalLink className="w-5 h-5" \/>\n\s*<\/button>/,
  `<div className="flex flex-col gap-3">
              <button 
                onClick={(e) => handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon')}
                className="w-full bg-slate-900 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-transform hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Buy Now Securely <ExternalLink className="w-5 h-5" />
              </button>
              <ShareButton 
                productId={product.id} 
                title={product.title} 
                variant="button" 
                className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold text-lg py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all" 
              />
            </div>`
);

fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
