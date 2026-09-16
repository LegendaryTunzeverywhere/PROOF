import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Line({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------ nav / chrome */
export const HomeIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z" />
    <path d="M9.6 20.6V14h4.8v6.6" />
  </Line>
);

export const BookOpenIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 6.7C10.5 5.6 8.5 5 6 5H3.4v13.2H6c2.5 0 4.5.6 6 1.7" />
    <path d="M12 6.7C13.5 5.6 15.5 5 18 5h2.6v13.2H18c-2.5 0-4.5.6-6 1.7" />
    <path d="M12 6.7v13.2" />
  </Line>
);

export const ReviewIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8.6 4.4h6.8A1.6 1.6 0 0 1 17 6v13a1.6 1.6 0 0 1-1.6 1.6H8.6A1.6 1.6 0 0 1 7 19V6a1.6 1.6 0 0 1 1.6-1.6Z" />
    <path d="M9.6 3h4.8v3H9.6z" />
    <path d="m9.8 13.4 1.8 1.8 3.6-3.7" />
  </Line>
);

export const ProveIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="10.4" r="5.6" />
    <path d="m9.7 10.6 1.7 1.7 3.1-3.3" />
    <path d="M8.5 15.4 7.3 21l4.7-2.4 4.7 2.4-1.2-5.6" />
  </Line>
);

export const WorkIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.4" y="7.4" width="17.2" height="12.2" rx="2.6" />
    <path d="M9 7.4V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.4" />
    <path d="M3.4 12.6h17.2" />
  </Line>
);

export const TeachIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m3.4 9.6 8.6-4.1 8.6 4.1-8.6 4z" />
    <path d="M7.2 11.8V16c0 1.4 2.1 2.5 4.8 2.5s4.8-1.1 4.8-2.5v-4.2" />
    <path d="M20.6 9.6v5.6" />
  </Line>
);

export const TrophyIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8.2 4.4h7.6v3.9a3.8 3.8 0 0 1-7.6 0z" />
    <path d="M8.2 5.6H5.8v1.6a2.8 2.8 0 0 0 2.4 2.8" />
    <path d="M15.8 5.6h2.4v1.6a2.8 2.8 0 0 1-2.4 2.8" />
    <path d="M12 12.1v3.6" />
    <path d="M9.6 19.6h4.8l.7-3.9h-6.2z" />
  </Line>
);

export const BellIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M6.4 10.2a5.6 5.6 0 0 1 11.2 0c0 3.2.8 4.8 1.7 5.7H4.7c.9-.9 1.7-2.5 1.7-5.7Z" />
    <path d="M10.4 18.6a1.9 1.9 0 0 0 3.2 0" />
  </Line>
);

export const UserIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="8.4" r="3.6" />
    <path d="M4.9 20.1c.9-3.5 3.6-5.4 7.1-5.4s6.2 1.9 7.1 5.4" />
  </Line>
);

export const GlossaryIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M5 4.6h11A2.6 2.6 0 0 1 18.6 7.2v12.2H7.6A2.6 2.6 0 0 1 5 16.8z" />
    <path d="M5 16.9a2.6 2.6 0 0 1 2.6-2.6h11" />
    <path d="M8.6 8.4h6.2" />
  </Line>
);

export const ChatIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 12.2c0 3.8-3.6 6.9-8 6.9-1 0-2-.2-2.9-.5L5 20.6l1.2-3.2A6.6 6.6 0 0 1 4 12.2c0-3.8 3.6-6.9 8-6.9s8 3.1 8 6.9Z" />
  </Line>
);

export const SettingsIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="2.7" />
    <path d="M19.3 13.9a1.5 1.5 0 0 0 .3 1.7l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.7 1.7 0 1 1-3.4 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H4a1.7 1.7 0 1 1 0-3.4h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4V4a1.7 1.7 0 1 1 3.4 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.7 1.7 0 1 1 0 3.4h-.1a1.5 1.5 0 0 0-1.4.9Z" />
  </Line>
);

export const SearchIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="6.6" />
    <path d="m20 20-4.3-4.3" />
  </Line>
);

export const WalletIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.4" y="6" width="17.2" height="12.4" rx="3" />
    <path d="M3.4 10.2h17.2" />
    <path d="M16.4 14.2h1.6" />
  </Line>
);

export const ClockIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.9v4.4l2.9 1.7" />
  </Line>
);

export const StarIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m12 4.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 9.9l5.4-.8z" />
  </Line>
);

export const StarSolidIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="m12 3.9 2.5 5.1 5.6.8-4.1 4 1 5.6L12 16.7l-5 2.7 1-5.6-4.1-4 5.6-.8z" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4.6 12h14.8" />
    <path d="m13.4 5.9 6.1 6.1-6.1 6.1" />
  </Line>
);

export const CheckIcon = (p: IconProps) => (
  <Line strokeWidth={2.2} {...p}>
    <path d="m5.5 12.6 4 4 9-9.2" />
  </Line>
);

export const MenuIcon = (p: IconProps) => (
  <Line strokeWidth={1.9} {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </Line>
);

export const CloseIcon = (p: IconProps) => (
  <Line strokeWidth={1.9} {...p}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </Line>
);

export const XIcon = (p: IconProps) => (
  <Line strokeWidth={1.9} {...p}>
    <path d="M5 4.5 19 19.5" />
    <path d="M19 4.5 5 19.5" />
  </Line>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Line strokeWidth={1.9} {...p}>
    <path d="m9.5 5.8 6.2 6.2-6.2 6.2" />
  </Line>
);

export const LeafIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 4.4c0 8.7-4.7 12.4-10.4 12.4-1.6 0-3-.4-4.1-1C6.5 8.9 11.2 4.6 20 4.4Z" />
    <path d="M4.4 20c1-2.6 2.8-4.8 5.6-6.6" />
  </Line>
);

export const TrendingIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 16.6 9.6 11l3.5 3.4L20 7.4" />
    <path d="M15.4 7.4H20v4.6" />
  </Line>
);

export const PlayIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M8.6 5.6v12.8L19 12z" />
  </Line>
);

export const SparkIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 4.2l1.5 4.6 4.6 1.5-4.6 1.5L12 16.4l-1.5-4.6L5.9 10.3l4.6-1.5z" />
    <path d="M18.4 4.2l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" />
  </Line>
);

export const ShieldIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3.6 5.8 6.1v5.5c0 3.9 2.6 7 6.2 8.4 3.6-1.4 6.2-4.5 6.2-8.4V6.1z" />
    <path d="m9.5 11.8 1.9 1.9 3.4-3.6" />
  </Line>
);

export const UsersIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="9.6" cy="8.6" r="3.2" />
    <path d="M3.6 20c.7-3.1 2.7-4.9 6-4.9s5.3 1.8 6 4.9" />
    <path d="M15.8 5.8a3.1 3.1 0 0 1 0 6" />
    <path d="M17.6 15.6c1.6.6 2.6 2.1 3 4.4" />
  </Line>
);

export const FlameIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="flameGrad" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FCD34D" />
        <stop offset="0.55" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <path
      fill="url(#flameGrad)"
      d="M12.6 2.3c.2 2.9 1.8 4.3 3 5.7 1.5 1.7 3.9 3.4 3.9 6.4 0 3.9-3.3 7.3-7.5 7.3s-7.5-3.4-7.5-7.3c0-2.6 1.4-4.2 2.9-6 .7 1.1 1.6 1.7 2.5 1.9-.7-2.6-.2-5.3 2.7-8Z"
    />
    <path
      fill="#FFFBEB"
      fillOpacity="0.85"
      d="M12.3 12.4c.1 1.7 1.6 2.2 1.6 3.9 0 1.4-1 2.5-2.4 2.5s-2.4-1.1-2.4-2.5c0-1.3.8-2 1.6-3 .3.6.7.9 1.1 1-.2-1.3 0-1.6.5-1.9Z"
    />
  </svg>
);

export const BoltIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="boltGrad" x1="8" y1="3" x2="16" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <path fill="url(#boltGrad)" d="M13.6 2.2 6 13.4h4.9L9.7 21.8l7.9-11.6h-5z" />
  </svg>
);

export const HexCoinIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="coinGrad" x1="6" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE68A" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#B45309" />
      </linearGradient>
    </defs>
    <path
      fill="none"
      stroke="url(#coinGrad)"
      strokeWidth="1.7"
      strokeLinejoin="round"
      d="M12 3.4 19 7.4v8l-7 4-7-4v-8z"
    />
    <circle cx="12" cy="12" r="2.6" fill="url(#coinGrad)" />
  </svg>
);

export const ShieldSlateIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3.4 5.6 6.2v5.6c0 3.9 2.7 7 6.4 8.5 3.7-1.5 6.4-4.6 6.4-8.5V6.2z"
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9.3 11.9 2 2 3.4-3.6"
    />
  </svg>
);

export const CleanStarIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m12 3.9 2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8z"
    />
  </svg>
);

/* ------------------------------------------------------------ brand logos */
export const ProofLogo = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="proofLogograd" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24" />
        <stop offset="0.5" stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <g transform="rotate(-12 14 14)">
      <path
        fill="url(#proofLogograd)"
        stroke="url(#proofLogograd)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        d="M14 3.4 23 8.6v10.4L14 24.2 5 19V8.6z"
      />
      <path
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.92"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M14 9.1 17.9 11.4v4.6L14 18.3 10.1 16v-4.6z"
      />
    </g>
  </svg>
);

export const LogoHtml = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <path fill="#E44D26" d="M4.2 2.6h19.6l-1.8 20.2L14 25.4 5.9 22.8z" />
    <path fill="#F16529" d="M14 4.6v19.1l7.4-2.1L22.9 4.6z" />
    <path
      fill="#fff"
      d="M14 9.5h-4.4l.3 3.2H14v-3.2Zm0 6.6h-4.1l.3 3.3 3.8 1.1v-4.4Zm0-9.9h6.8l-.3 3.3H14V6.2Zm0 6.6h5.9l-.6 6.5-5.3 1.6v-4.3l2.4-.7.3-3.1H14v0Z"
      opacity=".95"
    />
  </svg>
);

export const LogoChess = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <circle cx="14" cy="14" r="12" fill="#0F9F8A" />
    <text x="14" y="21" textAnchor="middle" fill="#fff" fontSize="18" fontFamily="Georgia, serif">♞</text>
  </svg>
);

export const LogoCss = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <path fill="#1572B6" d="M4.2 2.6h19.6l-1.8 20.2L14 25.4 5.9 22.8z" />
    <path fill="#33A9DC" d="M14 4.6v19.1l7.4-2.1L22.9 4.6z" />
    <path
      fill="#fff"
      d="M9.3 9.5h9.4l-.4 4.2h-5.6l.2 2.2h5.3l-.4 4.3-5.8 1.6-5.8-1.6-.4-4.3h2.9l.2 2.2 3.1.8 3.1-.8.3-3.2H9.6z"
      opacity=".95"
    />
  </svg>
);

export const LogoJs = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <rect width="26" height="26" x="1" y="1" rx="1.5" fill="#F7DF1E" />
    <text
      x="24"
      y="23.5"
      textAnchor="end"
      fill="#1E1E1E"
      fontFamily="Inter, Arial, sans-serif"
      fontSize="12.5"
      fontWeight="700"
      letterSpacing="-0.4"
    >
      JS
    </text>
  </svg>
);

export const LogoReact = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <g transform="translate(14 14)" fill="none" stroke="#149ECA" strokeWidth="1.35">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
    <circle cx="14" cy="14" r="2.5" fill="#149ECA" />
  </svg>
);

export const LogoHex = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      d="M14 3.6 22.6 8.6v10L14 23.6 5.4 18.6v-10z"
    />
    <path fill="currentColor" fillOpacity=".22" d="M14 9.4 18.4 12v5.2L14 19.8 9.6 17.2V12z" />
  </svg>
);

export const LogoPython = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="pyBlue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#387EB8" />
        <stop offset="100%" stopColor="#366994" />
      </linearGradient>
      <linearGradient id="pyYellow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE873" />
        <stop offset="100%" stopColor="#FFD43B" />
      </linearGradient>
    </defs>
    <path fill="url(#pyBlue)" d="M14 2.5c3.3 0 6 2.7 6 6v3h-6v1h9v-4c0-3.3-2.7-6-6-6h-6c-3.3 0-6 2.7-6 6v4h3v-4c0-3.3 2.7-6 6-6z"/>
    <path fill="url(#pyYellow)" d="M14 25.5c-3.3 0-6-2.7-6-6v-3h6v-1H5v4c0 3.3 2.7 6 6 6h6c3.3 0 6-2.7 6-6v-4h-3v4c0 3.3-2.7 6-6 6z"/>
    <circle fill="#fff" cx="10.5" cy="8" r="1.2"/>
    <circle fill="#fff" cx="17.5" cy="20" r="1.2"/>
  </svg>
);

export const LogoNode = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <path fill="#339933" d="M14 2.5l11 6.5v13l-11 6.5-11-6.5V9z"/>
    <path fill="#fff" d="M14 8v12l-6-3.5V10l6-3.5m0-1.5L6 11v10l8 4.5 8-4.5V11L14 6.5z"/>
  </svg>
);

export const LogoTypescript = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <rect width="26" height="26" x="1" y="1" rx="1.5" fill="#3178C6"/>
    <path fill="#fff" d="M14 8h-3v11h2V10h1V8zm4 0v2h-2v9h2v-4h1c1.7 0 3-1.3 3-3s-1.3-3-3-3h-1zm1 5v-3h1c.6 0 1 .4 1 1v1c0 .6-.4 1-1 1h-1z"/>
  </svg>
);

export const LogoFigma = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <circle fill="#1ABCFE" cx="19" cy="14" r="4"/>
    <circle fill="#0ACF83" cx="9" cy="23" r="4"/>
    <circle fill="#FF7262" cx="9" cy="5" r="4"/>
    <circle fill="#F24E1E" cx="9" cy="14" r="4"/>
    <circle fill="#A259FF" cx="19" cy="5" r="4"/>
  </svg>
);

export const LogoMarketing = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <rect width="26" height="26" x="1" y="1" rx="1.5" fill="#FF6B6B"/>
    <path fill="#fff" d="M8 10l6-4v16l-6-4H5V10h3zm10 4c0-1.7-.8-3.2-2-4.2v8.4c1.2-1 2-2.5 2-4.2zm-2-7v2c2.2 1.2 4 3.6 4 6s-1.8 4.8-4 6v2c3.3-1.4 6-4.6 6-8s-2.7-6.6-6-8z"/>
  </svg>
);

export const LogoData = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <rect width="26" height="26" x="1" y="1" rx="1.5" fill="#00D4FF"/>
    <path fill="#fff" d="M7 9h3v10H7V9zm5-3h3v13h-3V6zm5 5h3v8h-3v-8z"/>
  </svg>
);

export const LogoAI = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A78BFA"/>
        <stop offset="100%" stopColor="#EC4899"/>
      </linearGradient>
    </defs>
    <rect width="26" height="26" x="1" y="1" rx="1.5" fill="url(#aiGrad)"/>
    <path fill="#fff" d="M10 8l-2 12h2l.4-2h3.2l.4 2h2l-2-12h-4zm-.4 8l1.4-7 1.4 7h-2.8zm7.4-8v12h2v-5h2l1 5h2l-1-5c1-.5 2-1.5 2-3s-1-3-3-3h-5zm2 2h3v3h-3v-3z"/>
  </svg>
);

export const LogoBlockchain = (p: IconProps) => (
  <svg viewBox="0 0 28 28" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="blockGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F7931A"/>
        <stop offset="100%" stopColor="#FFA500"/>
      </linearGradient>
    </defs>
    <circle fill="url(#blockGrad)" cx="14" cy="14" r="12"/>
    <path fill="#fff" d="M17 11c.2-1.5-.9-2.3-2.4-2.8l.5-2-1.2-.3-.5 1.9c-.3-.1-.6-.2-1-.2l.5-2-1.2-.3-.5 2c-.3 0-.5-.1-.8-.2l-1.6-.4-.3 1.3s.9.2.9.2c.5.1.6.4.6.7l-.6 2.4c0 .1 0 .2.1.3l-.1-.1-.9 3.5c-.1.2-.2.4-.6.3 0 0-.9-.2-.9-.2l-.6 1.4 1.5.4c.3.1.6.1.8.2l-.5 2.1 1.2.3.5-2c.3.1.6.2 1 .2l-.5 2 1.2.3.5-2.1c2-.4 3.5-1.2 3.7-3.2.2-1.6-.6-2.5-1.8-2.8.8-.2 1.4-.8 1.5-2zm-2.7 3.8c0 1.4-2.4 1.3-3.1 1.2l.6-2.3c.7.2 3.1.6 2.5 1.1zm.6-3.9c0 1.3-2.1 1.1-2.7 1l.5-2.1c.6.2 2.8.5 2.2 1.1z"/>
  </svg>
);
