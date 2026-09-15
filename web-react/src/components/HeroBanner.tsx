import { HERO_WAVES } from "@/data";
import { useAuth } from "../context/AuthContext";
import { BoltIcon, FlameIcon, HexCoinIcon, ShieldSlateIcon } from "./Icons";
import { useCountUp, useInView } from "./Reveal";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

type StatData = {
  id: string;
  value: number;
  decimals?: number;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconClass: string;
};

function Stat({ stat, index }: { stat: StatData; index: number }) {
  const { ref, formatted } = useCountUp(stat.value, stat.decimals ?? 0, 1300 + index * 120);
  const Icon = stat.icon;

  return (
    <div ref={ref} className="flex items-center gap-3">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-white/[0.07] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
        <Icon className={stat.iconClass} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[17.5px] font-bold leading-none tracking-tight text-white tabular-nums">
          {formatted}
        </span>
        <span className="mt-1 block truncate text-[12px] font-medium text-white/60">{stat.label}</span>
      </span>
    </div>
  );
}

export function HeroBanner() {
  const { user } = useAuth();
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.05 });
  const hour = new Date().getHours();
  const lifetimeXp = Number(user?.totalXpEarned ?? user?.xpEarned ?? user?.xp ?? 0);

  // Build stats from real user data
  const heroStats: StatData[] = user ? [
    { 
      id: "streak", 
      value: user.streak.current || 0, 
      label: "Day streak", 
      icon: FlameIcon, 
      iconClass: "h-5 w-5" 
    },
    { 
      id: "xp", 
      value: lifetimeXp || 0, 
      label: "XP total", 
      icon: BoltIcon, 
      iconClass: "h-[19px] w-[19px]" 
    },
    {
      id: "skills",
      value: user.verifiedSkillCount || 0,
      label: "Verified skills",
      icon: ShieldSlateIcon,
      iconClass: "h-5 w-5 text-white/85",
    },
    { 
      id: "nim", 
      value: user.earnedNim || 0, 
      decimals: 1, 
      label: "NIM earned", 
      icon: HexCoinIcon, 
      iconClass: "h-[21px] w-[21px]" 
    },
  ] : [];

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-2xl shadow-hero transition-[opacity,transform] duration-700 ${
        inView ? "opacity-100 translate-y-0" : "translate-y-4 opacity-0"
      }`}
      style={{
        background:
          "radial-gradient(120% 140% at 88% 118%, rgba(124,58,237,0.62) 0%, rgba(76,29,149,0.22) 42%, transparent 70%), radial-gradient(90% 120% at 8% 0%, rgba(56,189,248,0.14) 0%, transparent 60%), linear-gradient(115deg, #161026 0%, #1c1435 46%, #291b52 100%)",
      }}
    >
      <svg
        className="anim-drift pointer-events-none absolute inset-x-[-6%] bottom-[-30px] h-[190px] w-[112%] opacity-[0.5]"
        viewBox="0 0 1080 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {HERO_WAVES.map((d, i) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={i === 1 ? "url(#waveGrad2)" : "url(#waveGrad)"}
            strokeWidth={i === 1 ? 1.4 : 1}
          />
        ))}
        <defs>
          <linearGradient id="waveGrad" x1="0" x2="1080" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A78BFA" stopOpacity="0.05" />
            <stop offset="0.55" stopColor="#F0ABFC" stopOpacity="0.4" />
            <stop offset="1" stopColor="#38BDF8" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0" x2="1080" y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" stopOpacity="0.06" />
            <stop offset="0.6" stopColor="#FDE68A" stopOpacity="0.34" />
            <stop offset="1" stopColor="#A78BFA" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      <div aria-hidden="true" className="pointer-events-none absolute -right-6 top-2 hidden sm:block">
        <svg
          className="anim-float"
          style={{ "--rot": "-16deg" } as React.CSSProperties}
          width="196"
          height="176"
          viewBox="0 0 196 176"
        >
          <defs>
            <linearGradient id="hexFace" x1="40" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.16" />
              <stop offset="1" stopColor="#A78BFA" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <g transform="translate(6 10)">
            <path
              d="M62 6l52 30v60l-52 30-52-30V36z"
              fill="url(#hexFace)"
              stroke="#FFFFFF"
              strokeOpacity="0.22"
              strokeWidth="1.4"
            />
            <path
              d="M62 34l29 17v34l-29 17-29-17V51z"
              fill="#FFFFFF"
              fillOpacity="0.05"
              stroke="#FFFFFF"
              strokeOpacity="0.14"
            />
          </g>
          <g transform="translate(96 70)">
            <path
              d="M46 0l40 23v46l-40 23-40-23V23z"
              fill="url(#hexFace)"
              stroke="#FFFFFF"
              strokeOpacity="0.2"
              strokeWidth="1.2"
            />
            <path
              d="M46 21l22 13v26l-22 13-22-13V34z"
              fill="#FFFFFF"
              fillOpacity="0.045"
              stroke="#FFFFFF"
              strokeOpacity="0.12"
            />
          </g>
        </svg>
      </div>

      <div className="grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />

      <div className="relative px-5 py-5 sm:px-7 sm:py-[24px]">
        <h1 className="flex items-center gap-2 font-display text-[19px] font-bold tracking-[-0.01em] text-white sm:text-[21px]">
          {greeting(hour)}, {user?.username || 'learner'}!
          <span aria-hidden="true" className="inline-block animate-[wave_2.6s_ease-in-out_1] text-[19px]">
            👋
          </span>
        </h1>
        <p className="mt-1.5 text-[13.5px] text-white/65">
          Keep going. Your next proof is closer than you think.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:mt-[22px] md:grid-cols-4 md:gap-x-6">
          {heroStats.map((stat, index) => (
            <Stat key={stat.id} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
