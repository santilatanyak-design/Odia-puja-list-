const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  /const saved = localStorage\.getItem\('puja_app_lang'\);\n\s*if \(saved === 'EN' \|\| saved === 'OD'\) return \(saved === 'OD' \? Language\.ODIA : Language\.ENGLISH\) as Language;/g,
  `const saved = localStorage.getItem('puja_app_lang');
      if (saved === 'EN' || saved === 'OD') return (saved === 'OD' ? Language.ODIA : Language.ENGLISH) as unknown as Language;`
);
fs.writeFileSync('src/App.tsx', app);

let contentApi = fs.readFileSync('src/lib/contentApi.ts', 'utf-8');
contentApi = contentApi.replace(
  /likesCount: data\.likesCount \|\| 0,/g,
  `likesCount: data.likesCount || 0,
      isFeatured: data.isFeatured || false,`
);
fs.writeFileSync('src/lib/contentApi.ts', contentApi);

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/fetchAndMatchStory\(storyId, false\)/g, "fetchAndMatchStory()");
blog = blog.replace(/onBack\(null, null\)/g, "onBack()");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);

console.log("Fixed final TS issues");
