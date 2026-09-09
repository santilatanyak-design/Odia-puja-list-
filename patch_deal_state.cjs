const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

if (!app.includes('const [selectedDealId, setSelectedDealId]')) {
  app = app.replace(
    /const \[selectedTempleId, setSelectedTempleId\] = useState<string \| null>\(\(\) => \{/,
    `const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealData, setSelectedDealData] = useState<any | null>(null);
  const [selectedTempleId, setSelectedTempleId] = useState<string | null>(() => {`
  );
}

fs.writeFileSync('src/App.tsx', app);
console.log("Patched deal state in App.tsx");
