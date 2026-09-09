const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(/const PujariPortal = lazy\(\(\) => import\('\.\/components\/PujariPortal'\)\.then\(m => \(\{ default: m\.PujariPortal \}\)\)\);\n/, '');
app = app.replace(/const PujariLogin = lazy\(\(\) => import\('\.\/components\/PujariLogin'\)\.then\(m => \(\{ default: m\.PujariLogin \}\)\)\);\n/, '');
app = app.replace(/const StoreView = lazy\(\(\) => import\('\.\/components\/StoreView'\)\.then\(m => \(\{ default: m\.StoreView \}\)\)\);\n/, '');
app = app.replace(/const TempleBookingView = lazy\(\(\) => import\('\.\/components\/TempleBookingView'\)\.then\(m => \(\{ default: m\.TempleBookingView \}\)\)\);\n/, '');
app = app.replace(/const SpiritualBlog = lazy\(\(\) => import\('\.\/components\/SpiritualBlog'\)\.then\(m => \(\{ default: m\.SpiritualBlog \}\)\)\);\n/, '');
app = app.replace(/const TempleShortsFeed = lazy\(\(\) => import\('\.\/components\/TempleShortsFeed'\)\.then\(m => \(\{ default: m\.TempleShortsFeed \}\)\)\);\n/, '');
app = app.replace(/const PanchangPage = lazy\(\(\) => import\('\.\/components\/PanchangPage'\)\.then\(m => \(\{ default: m\.PanchangPage \}\)\)\);\n/, '');
app = app.replace(/const SiteLockOverlay = lazy\(\(\) => import\('\.\/components\/SiteLockOverlay'\)\.then\(m => \(\{ default: m\.SiteLockOverlay \}\)\)\);\n/, '');

app = app.replace(/\{viewMode !== 'shorts' && viewMode !== 'admin' && <Footer \/>\}/, '{viewMode !== "admin" && <Footer />}');
app = app.replace(/<SiteLockOverlay \/>/, '');

fs.writeFileSync('src/App.tsx', app);
