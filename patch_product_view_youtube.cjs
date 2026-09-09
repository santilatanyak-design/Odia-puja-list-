const fs = require('fs');
let file = fs.readFileSync('src/components/AffiliateProductView.tsx', 'utf-8');

// 1. Import YoutubeEmbed
file = file.replace(
  /import \{ ShareButton \} from '\.\/ShareButton';/,
  "import { ShareButton } from './ShareButton';\nimport { YoutubeEmbed } from './YoutubeEmbed';"
);

// 2. Add YoutubeEmbed before CTA
file = file.replace(
  /\{\/\* Premium CTA \*\/\}/,
  `{product.youtubeUrl && (
              <YoutubeEmbed url={product.youtubeUrl} />
            )}

            {/* Premium CTA */}`
);

fs.writeFileSync('src/components/AffiliateProductView.tsx', file);
