const fs = require('fs');

// Fix App.tsx ViewMode
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /type ViewMode = (.*?);/,
  "type ViewMode = $1 | 'deal';"
);

// Fix App.tsx state variables if missing
if (!app.includes('selectedDealId')) {
  app = app.replace(
    /const \[selectedStoryId, setSelectedStoryId\] = useState<string \| null>\(null\);/,
    `const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);\n  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);\n  const [selectedDealData, setSelectedDealData] = useState<any | null>(null);`
  );
}

fs.writeFileSync('src/App.tsx', app);

// Fix AdminPanel AdminTab
let panel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
panel = panel.replace(
  /type AdminTab = (.*?);/,
  "type AdminTab = $1 | 'affiliate';"
);
fs.writeFileSync('src/components/AdminPanel.tsx', panel);

console.log("Fixed TS issues");
