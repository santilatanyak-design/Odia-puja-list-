const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/import \{ BottomNav \} from '\.\/components\/BottomNav';\n/, '');
app = app.replace(/import \{ PujariLogin \} from '\.\/components\/PujariLogin';\n/, '');
app = app.replace(/import \{ PujariPortal \} from '\.\/components\/PujariPortal';\n/, '');

app = app.replace(
  /type ViewMode = (.*?);/,
  "type ViewMode = 'home' | 'admin' | 'deal' | 'categories' | 'deals';"
);

app = app.replace(/<Navbar[\s\S]*?onLogoutAdmin=\{handleAdminLogout\}\n\s*\/>/, 
  `<Navbar
        currentView={viewMode}
        setViewMode={setViewMode}
        onGoHome={() => setViewMode('home')}
      />`);

// Remove BottomNav rendering
app = app.replace(/\{\/\* Fixed Native Mobile App Bottom Navigation Bar[\s\S]*?\/>\n\s*\)\}/, '');
app = app.replace(/<BottomNav[\s\S]*?\/>/, ''); // Fallback just in case

// Keep only active views
const viewsToKeep = ['home', 'admin', 'deal', 'categories', 'deals'];
app = app.replace(/viewMode === 'login' \? \([\s\S]*?\) : viewMode === 'portal' \? \([\s\S]*?\) : viewMode === 'temple' \? \([\s\S]*?\) : viewMode === 'panchang' \? \([\s\S]*?\) : viewMode === 'blog' \? \([\s\S]*?\) : viewMode === 'categories'/g, 
  "viewMode === 'categories'");
app = app.replace(/viewMode === 'store' \? \([\s\S]*?\) : viewMode === 'shorts' \? \([\s\S]*?\) : viewMode === 'admin' /g, "viewMode === 'admin' ");

fs.writeFileSync('src/App.tsx', app);
