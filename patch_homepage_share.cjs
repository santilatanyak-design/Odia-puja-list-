const fs = require('fs');
let file = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');

// 1. Add import
file = file.replace(
  /import \{ AffiliateProduct, fetchAffiliateProducts \} from '\.\.\/lib\/affiliateApi';/,
  "import { AffiliateProduct, fetchAffiliateProducts } from '../lib/affiliateApi';\nimport { ShareButton } from './ShareButton';"
);

// 2. Add Share to Hero Banner
file = file.replace(
  /<button \n\s*onClick=\{\(\) => onNavigateToDeal\(heroProduct\.id\)\}\n\s*className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-transform hover:-translate-y-1 shadow-lg shadow-slate-900\/20"\n\s*>\n\s*View Deal\n\s*<\/button>\n\s*<span className="text-2xl font-bold text-slate-900">/,
  `<button 
                    onClick={() => onNavigateToDeal(heroProduct.id)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition-transform hover:-translate-y-1 shadow-lg shadow-slate-900/20"
                  >
                    View Deal
                  </button>
                  <ShareButton productId={heroProduct.id} title={heroProduct.title} variant="icon" className="p-4 w-14 h-14" />
                  <span className="text-2xl font-bold text-slate-900">`
);

// 3. Add Share to Trending Deals
file = file.replace(
  /<div>\n\s*<span className="text-xl font-black text-slate-900 block">\n\s*\{product\.discountPrice \|\| product\.price\}\n\s*<\/span>[\s\S]*?<\/div>\n\s*<button/g,
  `<div>
                        <span className="text-xl font-black text-slate-900 block">
                          {product.discountPrice || product.price}
                        </span>
                        {product.discountPrice && (
                          <span className="text-sm text-slate-400 line-through">
                            {product.price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <ShareButton productId={product.id} title={product.title} variant="icon" className="p-3 w-11 h-11 bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-800" />
                        <button`
);

fs.writeFileSync('src/components/HomePage.tsx', file);
