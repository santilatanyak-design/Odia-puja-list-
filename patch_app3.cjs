const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /onNavigateToPanchang=\{\(\) => setViewMode\('panchang'\)\}\n\s*\/>\n\s*\) : \(/,
  `onNavigateToPanchang={() => setViewMode('panchang')}
              />
            ) : viewMode === 'categories' ? (
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">Categories</h2><p>Coming soon...</p><button onClick={() => setViewMode('home')} className="mt-4 text-orange-600">Back to Home</button></div>
            ) : viewMode === 'deals' ? (
              <div className="p-8 text-center"><h2 className="text-2xl font-bold">All Deals</h2><p>Coming soon...</p><button onClick={() => setViewMode('home')} className="mt-4 text-orange-600">Back to Home</button></div>
            ) : (`
);

fs.writeFileSync('src/App.tsx', app);
