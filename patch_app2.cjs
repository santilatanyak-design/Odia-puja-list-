const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /type ViewMode = (.*?);/,
  "type ViewMode = 'home' | 'login' | 'portal' | 'temple' | 'admin' | 'store' | 'shorts' | 'panchang' | 'blog' | 'deal' | 'categories' | 'deals';"
);

app = app.replace(
  /<BottomNav\n\s*currentView=\{viewMode\}\n\s*activePujari=\{activePujari\}\n\s*onNavigateHome=\{.*?\n\s*\}\}\n\s*onNavigateBookings=\{.*?\n\s*\}\}\n\s*onNavigateTemples=\{.*?\}\n\s*onNavigateProfile=\{.*?\n\s*\}\}\n\s*\/>/g,
  `<BottomNav
          currentView={viewMode}
          activePujari={activePujari}
          onNavigateHome={() => setViewMode('home')}
          onNavigateCategories={() => setViewMode('categories')}
          onNavigateDeals={() => setViewMode('deals')}
          onNavigateProfile={() => {
            if (activePujari) {
              setViewMode('portal');
            } else {
              setViewMode('login');
            }
          }}
        />`
);

app = app.replace(
  /<HomePage[\s\S]*?onNavigateToLogin=\{.*?\}\n\s*\/>/g,
  `<HomePage
                onNavigateToDeal={(dealId: string) => {
                  if (typeof window !== 'undefined') window.history.pushState({}, '', '/deal/' + dealId);
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  setSelectedDealId(dealId);
                  setViewMode('deal');
                }}
                onNavigateToCategories={() => setViewMode('categories')}
              />`
);

fs.writeFileSync('src/App.tsx', app);
console.log("App patched for new bottom nav and homepage");
