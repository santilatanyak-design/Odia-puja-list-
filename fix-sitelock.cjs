const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const oldStr = `      (err) =>  { {
        console.warn('fsSubscribeSiteLock listener warning:', err);
        const local = localStorage.getItem('puja_app_site_locked') === 'true';
        callback(local);
      }
    );
  } catch (err) {
    console.warn('fsSubscribeSiteLock error:', err);
      callback(false);
    return () => {};
  }`;

const newStr = `      (err) => {
        console.warn('fsSubscribeSiteLock listener warning:', err);
        const local = localStorage.getItem('puja_app_site_locked') === 'true';
        callback(local);
      }
    );
  } catch (err) {
    console.warn('fsSubscribeSiteLock error:', err);
    callback(false);
    return () => {};
  }`;

if (code.includes(oldStr)) {
  fs.writeFileSync('src/lib/firebase.ts', code.replace(oldStr, newStr));
  console.log("Fixed fsSubscribeSiteLock.");
} else {
  console.log("Could not find the target string!");
}
