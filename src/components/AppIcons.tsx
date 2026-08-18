import React from 'react';

/**
 * Native App Header Circular Logo matching the reference design
 */
export const TempleAppLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 76 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-lg border-2 border-amber-300 shrink-0 flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Sun Glow */}
        <circle cx="50" cy="50" r="48" fill="url(#sunGlow)" />

        {/* Sun Rays / Aura */}
        <circle cx="50" cy="50" r="42" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

        {/* Temple Shikhara Silhouettes */}
        {/* Left Mini Spire */}
        <path
          d="M24 64 L28 42 L34 42 L38 64 Z"
          fill="#8B0000"
        />
        <path d="M31 38 L31 42 M29 40 L33 40" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

        {/* Right Mini Spire */}
        <path
          d="M62 64 L66 42 L72 42 L76 64 Z"
          fill="#8B0000"
        />
        <path d="M69 38 L69 42 M67 40 L71 40" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central Grand Jagannath / Odisha Sanctum Spire */}
        <path
          d="M36 64 C36 48 40 32 46 22 L50 14 L54 22 C60 32 64 48 64 64 Z"
          fill="#800000"
        />
        {/* Spire Layer Grooves */}
        <path d="M41 40 Q50 36 59 40" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
        <path d="M38 48 Q50 44 62 48" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
        <path d="M37 56 Q50 52 63 56" stroke="#F59E0B" strokeWidth="1.5" fill="none" />

        {/* Golden Kalash & Flag on Top */}
        <circle cx="50" cy="13" r="2.5" fill="#FBBF24" />
        <path d="M50 11 L50 6" stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M50 6 L59 9 L50 12 Z" fill="#DC2626" />

        {/* Temple Sanctum Door */}
        <path d="M46 64 C46 59 54 59 54 64 Z" fill="#FEF08A" />

        {/* Banner Pill at Bottom */}
        <rect x="8" y="66" width="84" height="26" rx="6" fill="#800000" stroke="#FBBF24" strokeWidth="1.5" />
        <text
          x="50"
          y="77"
          fill="#FFFFFF"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.4"
        >
          BHAKTI
        </text>
        <text
          x="50"
          y="85"
          fill="#FDE68A"
          fontSize="6.2"
          fontWeight="800"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.3"
        >
          ANANDA ODIA TV
        </text>

        <defs>
          <radialGradient id="sunGlow" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="35%" stopColor="#FDE047" />
            <stop offset="70%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

/**
 * 1. Find Temples Illustration (Golden Sandstone Odisha Shikhara)
 */
export const FindTemplesIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base Platform */}
    <rect x="18" y="78" width="64" height="10" rx="3" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
    <rect x="24" y="72" width="52" height="6" rx="2" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
    
    {/* Main Temple Structure */}
    <path
      d="M30 72 C30 52 38 32 46 20 L50 14 L54 20 C62 32 70 52 70 72 Z"
      fill="url(#templeGrad)"
      stroke="#92400E"
      strokeWidth="1.5"
    />
    {/* Fluted Spire Ribs */}
    <path d="M37 45 Q50 41 63 45" stroke="#92400E" strokeWidth="1.5" fill="none" />
    <path d="M34 55 Q50 50 66 55" stroke="#92400E" strokeWidth="1.5" fill="none" />
    <path d="M32 64 Q50 59 68 64" stroke="#92400E" strokeWidth="1.5" fill="none" />
    
    {/* Sanctum Arched Entrance */}
    <path d="M43 78 C43 66 57 66 57 78 Z" fill="#78350F" stroke="#92400E" strokeWidth="1" />
    <circle cx="50" cy="62" r="2" fill="#FDE047" />

    {/* Amalaka and Kalash */}
    <ellipse cx="50" cy="14" rx="7" ry="3.5" fill="#D97706" stroke="#92400E" strokeWidth="1" />
    <ellipse cx="50" cy="10.5" rx="4" ry="2.5" fill="#F59E0B" />
    <circle cx="50" cy="7" r="2" fill="#FBBF24" />
    
    {/* Sacred Red Pataka / Flag */}
    <path d="M50 7 L50 2" stroke="#78350F" strokeWidth="1.5" />
    <path d="M50 2 L62 5 L50 8 Z" fill="#DC2626" />

    <defs>
      <linearGradient id="templeGrad" x1="50" y1="14" x2="50" y2="72" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="40%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * 2. Book Puja Illustration (Brass Kalash & Puja Thali)
 */
export const BookPujaIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Puja Thali Base */}
    <ellipse cx="50" cy="80" rx="38" ry="12" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
    <ellipse cx="50" cy="78" rx="34" ry="9" fill="#FDE68A" stroke="#B45309" strokeWidth="1" />

    {/* Flowers and Offerings on Plate */}
    <circle cx="30" cy="78" r="4.5" fill="#EF4444" />
    <circle cx="30" cy="78" r="2" fill="#FDE047" />
    <circle cx="70" cy="78" r="4.5" fill="#EF4444" />
    <circle cx="70" cy="78" r="2" fill="#FDE047" />
    <circle cx="62" cy="81" r="3.5" fill="#F97316" />

    {/* Brass Kalash Body */}
    <path
      d="M38 68 C34 62 33 50 38 42 C41 38 59 38 62 42 C67 50 66 62 62 68 C58 72 42 72 38 68 Z"
      fill="url(#brassGrad)"
      stroke="#92400E"
      strokeWidth="1.5"
    />
    <path d="M42 42 C42 37 58 37 58 42 Z" fill="#FBBF24" stroke="#92400E" strokeWidth="1" />

    {/* Mango Leaves around coconut */}
    <path d="M40 38 Q30 26 24 30 Q33 38 42 38" fill="#15803D" stroke="#166534" strokeWidth="1" />
    <path d="M60 38 Q70 26 76 30 Q67 38 58 38" fill="#15803D" stroke="#166534" strokeWidth="1" />
    <path d="M46 36 Q38 18 45 16 Q49 26 50 36" fill="#16A34A" stroke="#166534" strokeWidth="1" />
    <path d="M54 36 Q62 18 55 16 Q51 26 50 36" fill="#16A34A" stroke="#166534" strokeWidth="1" />

    {/* Coconut on top of Kalash */}
    <circle cx="50" cy="30" r="10" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
    {/* Swastik / Tilak on Kalash */}
    <circle cx="50" cy="54" r="3" fill="#DC2626" />
    <path d="M50 48 L50 60 M44 54 L56 54" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />

    {/* Diya Flame in front */}
    <ellipse cx="50" cy="83" rx="7" ry="3.5" fill="#B45309" />
    <path d="M50 82 Q46 72 50 66 Q54 72 50 82 Z" fill="url(#flameGrad)" />

    <defs>
      <linearGradient id="brassGrad" x1="35" y1="40" x2="65" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="30%" stopColor="#FBBF24" />
        <stop offset="70%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>
      <radialGradient id="flameGrad" cx="0.5" cy="0.6" r="0.5">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#FDE047" />
        <stop offset="80%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </radialGradient>
    </defs>
  </svg>
);

/**
 * 3. Puja Samagri Illustration (Devotional Samagri Basket)
 */
export const PujaSamagriIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wicker Basket Body */}
    <path
      d="M20 54 L26 84 C27 88 73 88 74 84 L80 54 Z"
      fill="#C2410C"
      stroke="#7C2D12"
      strokeWidth="2"
    />
    {/* Basket Rim */}
    <ellipse cx="50" cy="54" rx="32" ry="7" fill="#EA580C" stroke="#7C2D12" strokeWidth="1.5" />
    
    {/* Woven Cross Lattice Lines on Basket */}
    <path d="M26 62 L74 76 M28 72 L72 84 M74 62 L26 76 M72 72 L28 84" stroke="#7C2D12" strokeWidth="1.2" opacity="0.6" />

    {/* Sacred Items inside the Basket */}
    {/* Mango Leaves & Paan */}
    <path d="M34 52 C26 38 34 26 44 32 C46 42 42 50 34 52 Z" fill="#15803D" stroke="#166534" strokeWidth="1" />
    <path d="M66 52 C74 38 66 26 56 32 C54 42 58 50 66 52 Z" fill="#16A34A" stroke="#166534" strokeWidth="1" />
    
    {/* Havan Wooden Sticks (Samidha) */}
    <rect x="46" y="20" width="7" height="34" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1" transform="rotate(-15 46 20)" />
    <rect x="52" y="24" width="6" height="32" rx="2" fill="#9A3412" stroke="#451A03" strokeWidth="1" transform="rotate(12 52 24)" />

    {/* Coconut & Fruits */}
    <circle cx="50" cy="46" r="9" fill="#78350F" stroke="#451A03" strokeWidth="1" />
    <circle cx="36" cy="50" r="7" fill="#EAB308" stroke="#A16207" strokeWidth="1" />
    <circle cx="64" cy="50" r="6.5" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />

    {/* Agarbatti & Flowers */}
    <line x1="40" y1="46" x2="28" y2="18" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="28" cy="18" r="1.5" fill="#DC2626" />
    <line x1="44" y1="46" x2="36" y2="15" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="36" cy="15" r="1.5" fill="#DC2626" />

    {/* Red Hibiscus Flower */}
    <circle cx="50" cy="54" r="5" fill="#DC2626" />
    <circle cx="50" cy="54" r="2" fill="#FEF08A" />
  </svg>
);

/**
 * 4. Live Darshan Illustration (Red Live Broadcast Badge)
 */
export const LiveDarshanIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Red Live Pill Badge Container */}
    <rect x="10" y="26" width="58" height="48" rx="14" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
    
    {/* LIVE text */}
    <text
      x="39"
      y="57"
      fill="#FFFFFF"
      fontSize="17"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
      textAnchor="middle"
      letterSpacing="0.8"
    >
      LIVE
    </text>

    {/* Video Camera Lens / Projector Cone */}
    <path
      d="M72 40 L90 28 L90 72 L72 60 Z"
      fill="#DC2626"
      stroke="#991B1B"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    
    {/* Pulsing Signal Wave */}
    <path d="M42 20 Q50 14 58 20" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M36 14 Q50 6 64 14" stroke="#F87171" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="50" cy="24" r="2.5" fill="#DC2626" />
  </svg>
);

/**
 * 5. Puja Status & List Illustration (Clipboard with Checklist & Green Badge)
 */
export const PujaStatusIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wooden Clipboard Backboard */}
    <rect x="22" y="16" width="56" height="72" rx="8" fill="#B45309" stroke="#78350F" strokeWidth="2" />
    
    {/* Paper Sheet */}
    <rect x="28" y="24" width="44" height="60" rx="4" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" />

    {/* Metal Top Clip */}
    <rect x="40" y="12" width="20" height="9" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    <circle cx="50" cy="16.5" r="2" fill="#78350F" />

    {/* Checklist Lines */}
    <path d="M34 36 L37 39 L44 32" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="48" y1="36" x2="64" y2="36" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />

    <path d="M34 48 L37 51 L44 44" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="48" y1="48" x2="64" y2="48" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />

    <path d="M34 60 L37 63 L44 56" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="48" y1="60" x2="64" y2="60" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />

    {/* Verified Green Success Badge on Bottom Right */}
    <circle cx="70" cy="74" r="12" fill="#16A34A" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M64 74 L68 78 L76 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 6. Devotional Content (Radiant Sacred Om ॐ)
 */
export const DevotionalOmIllustration: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Aura Glow */}
    <circle cx="50" cy="50" r="42" fill="url(#omGlow)" opacity="0.15" />
    <circle cx="50" cy="50" r="36" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

    {/* Sacred OM (ॐ) Calligraphy in Radiant Vermillion */}
    <text
      x="50"
      y="66"
      fill="#EA580C"
      fontSize="48"
      fontWeight="900"
      fontFamily="'Noto Sans Odia', 'Noto Serif Devanagari', 'Mukta', serif, sans-serif"
      textAnchor="middle"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(234, 88, 12, 0.3))' }}
    >
      ॐ
    </text>

    <defs>
      <radialGradient id="omGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

/**
 * Scenic Odishan Temple Panorama Backdrop for Hero Section
 */
export const OdishaTempleBackdrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative w-full h-44 sm:h-56 overflow-hidden select-none pointer-events-none ${className}`}>
    <svg
      viewBox="0 0 600 240"
      preserveAspectRatio="xMidYMax slice"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sky Warm Sunset Gradient */}
      <rect width="600" height="240" fill="url(#skyGradient)" />

      {/* Sun Rising behind Temples */}
      <circle cx="260" cy="140" r="48" fill="url(#sunBall)" />
      
      {/* Soft Cloud / Glow Bands */}
      <ellipse cx="300" cy="180" rx="320" ry="60" fill="#FFFBEB" opacity="0.3" />

      {/* Background Distant Temple Spires */}
      <g fill="#D97706" opacity="0.55">
        {/* Distant Spire 1 */}
        <path d="M80 240 C80 180 92 140 105 110 L110 95 L115 110 C128 140 140 180 140 240 Z" />
        {/* Distant Spire 2 (Center-Left) */}
        <path d="M245 240 C245 190 252 160 260 135 L265 125 L270 135 C278 160 285 190 285 240 Z" />
        {/* Distant Spire 3 */}
        <path d="M480 240 C480 190 490 150 500 120 L505 105 L510 120 C520 150 530 190 530 240 Z" />
      </g>

      {/* Midground Odisha Temples (Jagannath & Lingaraj Heritage Silhouettes) */}
      {/* Left Temple Compound */}
      <g fill="#B45309" opacity="0.85">
        <path d="M120 240 C120 160 135 110 155 70 L165 48 L175 70 C195 110 210 160 210 240 Z" />
        {/* Kalash on Left Temple */}
        <circle cx="165" cy="44" r="5" fill="#FBBF24" />
        <path d="M165 39 L165 30 L180 34 L165 38 Z" fill="#DC2626" />
        {/* Jagamohana / Porch */}
        <path d="M60 240 L85 170 L135 170 L150 240 Z" />
        <path d="M180 240 L195 180 L235 180 L250 240 Z" />
      </g>

      {/* Grand Central Puri Jagannath Temple & Spire */}
      <g fill="#92400E">
        {/* Main Vimana Spire */}
        <path d="M330 240 C330 140 355 80 380 32 L395 10 L410 32 C435 80 460 140 460 240 Z" />
        {/* Fluting & Grooves */}
        <ellipse cx="395" cy="30" rx="16" ry="6" fill="#F59E0B" opacity="0.7" />
        <ellipse cx="395" cy="20" rx="10" ry="4" fill="#FBBF24" />
        {/* Neelachakra (Divine Blue Wheel) and Pataka */}
        <circle cx="395" cy="10" r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        <path d="M395 6 L395 -2" stroke="#78350F" strokeWidth="2" />
        <path d="M395 -2 L425 4 L395 9 Z" fill="#DC2626" />

        {/* Surrounding Mandapas / Roofs */}
        <path d="M270 240 L300 150 L350 150 L370 240 Z" />
        <path d="M420 240 L440 160 L490 160 L515 240 Z" />
      </g>

      {/* Foreground Golden Horizon Blur Fade */}
      <rect y="190" width="600" height="50" fill="url(#bottomFade)" />

      <defs>
        <linearGradient id="skyGradient" x1="300" y1="0" x2="300" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="45%" stopColor="#FDE68A" />
          <stop offset="75%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FFFBF0" />
        </linearGradient>
        <radialGradient id="sunBall" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FEF08A" />
          <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bottomFade" x1="300" y1="190" x2="300" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBF0" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFFBF0" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
