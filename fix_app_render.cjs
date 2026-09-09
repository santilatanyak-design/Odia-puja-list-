const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /<Suspense fallback=\{<div className="p-4 text-center">Loading\.\.\.<\/div>\}>[\s\S]*?<\/Suspense>/,
  `<Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            {viewMode === 'admin' ? (
              <AdminPanel
                onBack={() => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  setViewMode('home');
                }}
              />
            ) : viewMode === 'deal' ? (
              <AffiliateProductView 
                productId={selectedDealId || ''} 
                onBack={() => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
                  setViewMode('home');
                }}
              />
            ) : viewMode === 'categories' ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-3xl font-black text-slate-900 mb-4">Categories</h2>
                <p className="text-slate-500 mb-8">Our premium categories are being updated.</p>
                <button onClick={() => setViewMode('home')} className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold">Back to Home</button>
              </div>
            ) : viewMode === 'deals' ? (
              <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
                <h2 className="text-3xl font-black text-slate-900 mb-4">All Deals</h2>
                <p className="text-slate-500 mb-8">Browse all our premium deals soon.</p>
                <button onClick={() => setViewMode('home')} className="bg-slate-900 text-white px-6 py-2 rounded-full font-semibold">Back to Home</button>
              </div>
            ) : (
              <HomePage
                onNavigateToDeal={(dealId: string) => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/deal/' + dealId);
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  setSelectedDealId(dealId);
                  setViewMode('deal');
                }}
                onNavigateToCategories={() => setViewMode('categories')}
              />
            )}
          </Suspense>`
);
fs.writeFileSync('src/App.tsx', app);
