const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /useState<Language>\(\(\) => \{([^}]+)return Language\.ODIA;([^}]+)\}\);/s,
  `useState<Language>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('puja_app_lang');
      if (saved === 'EN' || saved === 'OD') return saved as Language;
    }
    return Language.ODIA;
  });`
);

app = app.replace(
  /const next = prev === Language.ODIA \? Language\.ENGLISH : Language\.ODIA;/s,
  `const next = prev === Language.ODIA ? Language.ENGLISH : Language.ODIA;`
);

fs.writeFileSync('src/App.tsx', app);
