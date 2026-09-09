const fs = require('fs');

let panel = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
panel = panel.replace(/setActiveTab\('affiliate'\)/g, "setActiveTab('affiliate' as any)");
fs.writeFileSync('src/components/AdminPanel.tsx', panel);

let adminInst = fs.readFileSync('src/components/AdminInstallSection.tsx', 'utf-8');
adminInst = adminInst.replace(/onReset=\{\(e\) => \{/g, "onReset={() => {");
adminInst = adminInst.replace(/<AdminLoginModal\s+isOpen=\{true\}\s+onClose=\{\(\) => \{\}\}\s+lang=\{lang\}\s+\/>/, '');
fs.writeFileSync('src/components/AdminInstallSection.tsx', adminInst);

let blog = fs.readFileSync('src/components/SpiritualBlog.tsx', 'utf-8');
blog = blog.replace(/fetchAndMatchStory\(storyId, false\)/g, "fetchAndMatchStory()");
blog = blog.replace(/onBack\(null, null\)/g, "onBack()");
fs.writeFileSync('src/components/SpiritualBlog.tsx', blog);

console.log("Fixed other ts files");
