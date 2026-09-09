const fs = require('fs');
let file = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');

file = file.replace(
  /<div className="flex items-center gap-2">[\s\S]*?<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\}\)\}/,
  `<div className="flex items-center gap-2">
                        <ShareButton productId={product.id} title={product.title} variant="icon" className="p-3 w-11 h-11 bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-800" />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeepLink(e, product.affiliateUrl, product.platform as any || 'amazon');
                          }}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 rounded-full p-3 transition-colors flex items-center justify-center"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}`
);

fs.writeFileSync('src/components/HomePage.tsx', file);
