const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

// Replace pujaris
code = code.replace(
  /(fsSubscribePujaris[\s\S]*?\(err\) => )(console\.error\('fsSubscribePujaris Error:', err\))/g,
  '$1 { $2; callback([]); }'
);

// Replace lists
code = code.replace(
  /(fsSubscribeLists[\s\S]*?\(err\) => )(console\.error\('fsSubscribeLists Error:', err\))/g,
  '$1 { $2; callback([]); }'
);

// Replace payments
code = code.replace(
  /(fsSubscribePayments[\s\S]*?\(err\) => )(console\.error\('fsSubscribePayments Error:', err\))/g,
  '$1 { $2; callback([]); }'
);

// Replace qrConfig
code = code.replace(
  /(fsSubscribeQrConfig[\s\S]*?\(err\) => )(console\.error\('fsSubscribeQrConfig Error:', err\))/g,
  '$1 { $2; callback(DEFAULT_QR_CONFIG); }'
);

// Replace homeSlider
code = code.replace(
  /(fsSubscribeHomeSliderConfig[\s\S]*?\(err\) => )(console\.error\('fsSubscribeHomeSliderConfig Error:', err\))/g,
  '$1 { $2; callback(DEFAULT_HOME_SLIDER_CONFIG); }'
);

// Replace puriStore
code = code.replace(
  /(fsSubscribePuriStoreConfig[\s\S]*?\(err\) => )(console\.error\('fsSubscribePuriStoreConfig Error:', err\))/g,
  '$1 { $2; callback(DEFAULT_PURI_STORE_CONFIG); }'
);

// Replace siteLock
code = code.replace(
  /(fsSubscribeSiteLock[\s\S]*?\(err\) => )([\s\S]*?console\.warn\('fsSubscribeSiteLock error:', err\);)/g,
  '$1 { $2\n      callback(false);'
);

// Replace passwordResets
code = code.replace(
  /(fsSubscribePasswordResetRequests[\s\S]*?\(err\) => )(console\.error\('fsSubscribePasswordResetRequests Error:', err\))/g,
  '$1 { $2; callback([]); }'
);

// Replace pwaInstalls
code = code.replace(
  /(fsSubscribePwaInstalls[\s\S]*?\(err\) => )(console\.error\('fsSubscribePwaInstalls Error:', err\))/g,
  '$1 { $2; callback([]); }'
);

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Subscriptions updated to handle quota errors gracefully.');
