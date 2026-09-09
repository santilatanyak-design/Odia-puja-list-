const fs = require('fs');

let file = fs.readFileSync('src/App.tsx', 'utf-8');
file = file.replace(/const \[viewMode, setViewMode\] = useState<ViewMode>\(\(\) => \{[\s\S]*?\}\);/,
`const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/deal/')) {
        return 'deal';
      }
    }
    return 'home';
  });`
);

// We need to keep AdminPanel routing working but simplify App.tsx render block.
// Ensure App.tsx only has the active views.

fs.writeFileSync('src/App.tsx', file);
