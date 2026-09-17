import type { ComponentType, SVGProps } from "react";
import {
  BellIcon,
  BookOpenIcon,
  BoltIcon,
  ChatIcon,
  LogoChess,
  CleanStarIcon,
  FlameIcon,
  GlossaryIcon,
  HexCoinIcon,
  HomeIcon,
  LeafIcon,
  LogoHtml,
  LogoCss,
  LogoJs,
  LogoReact,
  PlayIcon,
  ProveIcon,
  ReviewIcon,
  SettingsIcon,
  ShieldSlateIcon,
  SparkIcon,
  TeachIcon,
  TrendingIcon,
  TrophyIcon,
  UserIcon,
  WorkIcon,
} from "@/components/Icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/* ------------------------------------------------------------------- nav */
export type NavItem = { id: string; label: string; icon: Icon; badge?: number; path: string };

export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: HomeIcon, path: "/home" },
  { id: "learn", label: "Learn", icon: BookOpenIcon, path: "/learn" },
  { id: "chess", label: "Chess practice", icon: LogoChess, path: "/learn/chess" },
  { id: "review", label: "Review", icon: ReviewIcon, path: "/reviews" },
  { id: "prove", label: "Prove", icon: ProveIcon, path: "/prove" },
  { id: "work", label: "Work", icon: WorkIcon, path: "/work" },
  { id: "teach", label: "Teach", icon: TeachIcon, path: "/work/teach" },
  { id: "leaderboard", label: "Leaderboard", icon: TrophyIcon, path: "/leaderboard" },
  { id: "notifications", label: "Notifications", icon: BellIcon, path: "/notifications" },
  { id: "profile", label: "Profile", icon: UserIcon, path: "/profile" },
  { id: "glossary", label: "Glossary", icon: GlossaryIcon, path: "/glossary" },
  { id: "socratic", label: "Socratic", icon: ChatIcon, path: "/socratic" },
  { id: "settings", label: "Settings", icon: SettingsIcon, path: "/settings" },
];

/* ------------------------------------------------------------------ hero */
export type HeroStat = {
  id: string;
  value: number;
  decimals?: number;
  label: string;
  icon: Icon;
  iconClass: string;
};

export const HERO_STATS: HeroStat[] = [
  { id: "streak", value: 12, label: "Day streak", icon: FlameIcon, iconClass: "h-5 w-5" },
  { id: "xp", value: 2430, label: "XP", icon: BoltIcon, iconClass: "h-[19px] w-[19px]" },
  {
    id: "skills",
    value: 8,
    label: "Verified skills",
    icon: ShieldSlateIcon,
    iconClass: "h-5 w-5 text-white/85",
  },
  { id: "nim", value: 24.6, decimals: 1, label: "NIM earned", icon: HexCoinIcon, iconClass: "h-[21px] w-[21px]" },
];

export const HERO_WAVES = [
  "M-40 96C160 -10 300 150 520 60S880 10 1100 -40",
  "M-40 128C180 22 320 176 560 84S900 34 1120 -20",
  "M-40 160C200 54 340 202 600 108S940 58 1160 4",
];

/* ------------------------------------------------------------- learning */
export const CONTINUE_COURSE = {
  title: "Web Development Path",
  lesson: "Lesson 4 · HTML Forms & Inputs",
  progress: 67,
  image: "/course-webdev.jpg",
  meta: [
    { id: "time", label: "18 min left", icon: PlayIcon },
    { id: "lessons", label: "8 lessons", icon: BookOpenIcon },
    { id: "rating", label: "4.7", icon: CleanStarIcon },
  ] satisfies { id: string; label: string; icon: Icon }[],
};

export const TODAYS_PROOF = {
  track: "Frontend Challenge",
  title: "Build a responsive pricing card",
  reward: "+1.5 NIM",
  duration: "~20 min",
  tag: "Popular",
  cta: "Start proof",
};

export const TODAY_CHALLENGE = {
  title: "Master CSS Grid Layout",
  description: "Complete 5 grid-based layout challenges to prove your CSS Grid mastery",
  xp: 500,
  badge: "Grid Master",
  timeLimit: "24 hours",
};

/* --------------------------------------------------------------- skills */
export type Skill = {
  id: string;
  name: string;
  value: number;
  level: string;
  tone: "green" | "muted" | "faint";
  logo: Icon;
};

export const SKILLS: Skill[] = [
  { id: "html", name: "HTML", value: 82, level: "Proficient", tone: "green", logo: LogoHtml },
  { id: "css", name: "CSS", value: 68, level: "Intermediate", tone: "muted", logo: LogoCss },
  { id: "js", name: "JavaScript", value: 45, level: "Learning", tone: "faint", logo: LogoJs },
  { id: "react", name: "React", value: 25, level: "Learning", tone: "faint", logo: LogoReact },
];

/* --------------------------------------------------------- achievements */
export type Achievement = {
  id: string;
  title: string;
  detail: string;
  value: string;
  valueTone: "gold" | "brand";
  time: string;
  icon: Icon;
  iconWrap: string;
  iconClass?: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "proof",
    title: "Proof passed",
    detail: "Responsive Layout Challenge",
    value: "+1.5 NIM",
    valueTone: "gold",
    time: "2h ago",
    icon: SparkIcon,
    iconWrap: "bg-gold-soft text-gold",
    iconClass: "fill-amber-400/90",
  },
  {
    id: "verified",
    title: "Skill verified",
    detail: "HTML",
    value: "+500 XP",
    valueTone: "brand",
    time: "1d ago",
    icon: ShieldSlateIcon,
    iconWrap: "bg-brand-soft text-brand",
  },
  {
    id: "streak",
    title: "Streak milestone",
    detail: "7 day learning streak",
    value: "+250 XP",
    valueTone: "brand",
    time: "2d ago",
    icon: LeafIcon,
    iconWrap: "bg-green-soft text-green",
  },
];

/* ---------------------------------------------------------- recommended */
export const RECOMMENDED = [
  {
    id: "js-basics",
    title: "JavaScript Basics",
    blurb: "Build dynamic websites",
    meta: "~3h · 12 lessons",
    rating: "4.8",
    level: "Beginner",
  },
  {
    id: "react",
    title: "React Fundamentals",
    blurb: "Component-based UI",
    meta: "~4h · 15 lessons",
    rating: "4.7",
    level: "Intermediate",
  },
  {
    id: "uiux",
    title: "UI/UX Design",
    blurb: "Design beautiful interfaces",
    meta: "~2h · 9 lessons",
    rating: "4.6",
    level: "Beginner",
  },
];

/* ------------------------------------------------------------- trending */
export const TRENDING = [
  {
    id: "pricing",
    title: "Accessible Pricing Table",
    blurb: "Frontend · 1.2k learners",
    reward: "+1.5 NIM",
    image: "/trending-ui.jpg",
  },
  {
    id: "git",
    title: "Git Workflow Deep Dive",
    blurb: "Devtools · 980 learners",
    reward: "+1 NIM",
    image: "/trending-git.jpg",
  },
  {
    id: "api",
    title: "REST API from Scratch",
    blurb: "Backend · 760 learners",
    reward: "+2 NIM",
    image: "/course-webdev.jpg",
  },
];

/* ------------------------------------------------------------ sponsored */
export const SPONSORED = {
  label: "Partner",
  title: "Ship your portfolio in a weekend",
  blurb: "Nitro Labs gives Proof learners a free Pro workspace for 3 months.",
  cta: "Claim offer",
  note: "No card required",
  icon: TrendingIcon,
};
