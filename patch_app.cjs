const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');

// Add lazy import for AffiliateProductView
app = app.replace(
  /const StoreView = lazyWithRetry\(\(\) => import\('\.\/components\/StoreView'\)\.then\(\(m\) => \(\{ default: m\.StoreView \}\)\)\);/,
  `const StoreView = lazyWithRetry(() => import('./components/StoreView').then((m) => ({ default: m.StoreView })));
const AffiliateProductView = lazyWithRetry(() => import('./components/AffiliateProductView').then((m) => ({ default: m.AffiliateProductView })));`
);

// Add state for selectedDealId
app = app.replace(
  /const \[selectedStoryId, setSelectedStoryId\] = useState<string \| null>\(null\);/,
  `const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealData, setSelectedDealData] = useState<any | null>(null);`
);

// Add logic to read /deal/ URL
app = app.replace(
  /const getInitialView = \(\): ViewMode => \{/,
  `const getInitialDealParam = () => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\\/deal\\/([^\\/]+)/);
      if (match && match[1]) {
        return match[1].replace(/\\.html?$/i, '').trim();
      }
    }
    return null;
  };

  const getInitialView = (): ViewMode => {`
);

app = app.replace(
  /if \(getInitialStoryParam\(\)\) \{/,
  `if (getInitialDealParam()) {
            return 'deal';
          }
          if (getInitialStoryParam()) {`
);

app = app.replace(
  /const initialStoryId = getInitialStoryParam\(\);/,
  `const initialStoryId = getInitialStoryParam();
    const initialDealId = getInitialDealParam();
    if (initialDealId) {
      setSelectedDealId(initialDealId);
      if (typeof window !== 'undefined' && (window as any).__PRELOADED_STATE__ && (window as any).__PRELOADED_STATE__.viewMode === 'deal') {
        setSelectedDealData((window as any).__PRELOADED_STATE__.deal);
      }
    }`
);

// Add condition for viewMode === 'deal'
app = app.replace(
  /\} else if \(viewMode === 'store'\) \{/,
  `} else if (viewMode === 'deal') {
      updateDocumentSeoAndCanonical('Bhakti Ananda Odia TV - Exclusive Deal', 'Grab this exclusive offer today on Bhakti Ananda.', '/deal');
    } else if (viewMode === 'store') {`
);

// Render AffiliateProductView in the main return
app = app.replace(
  /\) : viewMode === 'store' \? \(/,
  `) : viewMode === 'deal' ? (
              <AffiliateProductView
                productId={selectedDealId}
                initialData={selectedDealData}
                onBack={() => setViewMode('home')}
              />
            ) : viewMode === 'store' ? (`
);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx patched for AffiliateProductView");
