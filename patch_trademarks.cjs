const fs = require('fs');

// Patch Navbar
let nav = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');
nav = nav.replace(/<h1 className="text-xl italic font-bold tracking-tight text-white leading-none">Flipkart<\/h1>/, '<h1 className="text-xl font-bold tracking-tight text-white leading-none">Bhakti Store</h1>');
nav = nav.replace(/<span className="text-\[10px\] text-white\/80 italic hover:underline">Explore <span className="text-yellow-400 font-bold">Plus<\/span><\/span>/, '');
fs.writeFileSync('src/components/Navbar.tsx', nav);

// Patch Login
let login = fs.readFileSync('src/components/PujariLogin.tsx', 'utf-8');
login = login.replace(/<h1 className="text-3xl font-bold italic mb-2">Flipkart<\/h1>/, '<h1 className="text-3xl font-bold mb-2">Bhakti Store</h1>');
login = login.replace(/Login to access your Orders, Wishlist and Recommendations/g, 'Login to Bhakti Store to access your Orders and Wishlist');
login = login.replace(/By continuing, you agree to Flipkart's/g, "By continuing, you agree to Bhakti Store's");
login = login.replace(/New to Flipkart\?/g, 'New to Bhakti Store?');
fs.writeFileSync('src/components/PujariLogin.tsx', login);

// Check Footer
if (fs.existsSync('src/components/Footer.tsx')) {
  let footer = fs.readFileSync('src/components/Footer.tsx', 'utf-8');
  footer = footer.replace(/Bhakti Ananda Odia TV/g, 'Bhakti Store');
  footer = footer.replace(/Flipkart/gi, 'Bhakti Store');
  footer = footer.replace(/Amazon/gi, 'Bhakti Store');
  footer = footer.replace(/Myntra/gi, 'Bhakti Store');
  footer = footer.replace(/Meesho/gi, 'Bhakti Store');
  fs.writeFileSync('src/components/Footer.tsx', footer);
}

// Check HomePage
let home = fs.readFileSync('src/components/HomePage.tsx', 'utf-8');
home = home.replace(/Amazon/gi, 'Bhakti Store');
home = home.replace(/Flipkart/gi, 'Bhakti Store');
home = home.replace(/Myntra/gi, 'Bhakti Store');
home = home.replace(/Meesho/gi, 'Bhakti Store');
fs.writeFileSync('src/components/HomePage.tsx', home);

console.log("Trademarks patched");
