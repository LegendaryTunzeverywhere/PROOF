import type { Skill } from "@/types/api";
import { CARD, PANEL_PAD } from "@/lib/utils";
import { PanelHeader } from "./PanelHeader";
import { 
  LogoHtml, 
  LogoChess,
  LogoCss, 
  LogoJs, 
  LogoReact, 
  LogoPython,
  LogoNode,
  LogoTypescript,
  LogoFigma,
  LogoMarketing,
  LogoData,
  LogoAI,
  LogoBlockchain
} from "./Icons";

// Map skill slugs to their logo components
const SKILL_LOGOS: Record<string, React.ComponentType<any>> = {
  'web-development': LogoHtml,
  'chess': LogoChess,
  'html': LogoHtml,
  'css': LogoCss,
  'javascript': LogoJs,
  'js': LogoJs,
  'react': LogoReact,
  'python': LogoPython,
  'node': LogoNode,
  'nodejs': LogoNode,
  'typescript': LogoTypescript,
  'ts': LogoTypescript,
  'ui-design': LogoFigma,
  'design': LogoFigma,
  'figma': LogoFigma,
  'marketing': LogoMarketing,
  'data-analysis': LogoData,
  'data': LogoData,
  'ai': LogoAI,
  'machine-learning': LogoAI,
  'nimiq-blockchain': LogoBlockchain,
  'blockchain': LogoBlockchain,
  'crypto': LogoBlockchain,
};

export function SkillsBuilding({ skills }: { skills: Skill[] }) {
  if (!skills || skills.length === 0) {
    return (
      <section aria-labelledby="skills-building" className={`${CARD} ${PANEL_PAD}`}>
        <PanelHeader id="skills-building" title="Skills you're building" action="View all" actionTo="/learn" />
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <p className="text-sm text-muted">Start learning to see your skills here</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="skills-building" className={`${CARD} ${PANEL_PAD}`}>
      <PanelHeader id="skills-building" title="Skills you're building" action="View all" actionTo="/learn" />

      <ul className="flex gap-3 overflow-x-auto pb-2">
        {skills.slice(0, 4).map((skill) => {
          const Logo = SKILL_LOGOS[skill.skillSlug] || LogoHtml;
          const progress = skill.score || 0;
          const level = skill.tier || (skill.verified ? 'Verified' : 'Learning');
          
          return (
            <li
              key={skill.skillSlug}
              className="flex min-w-[140px] flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 transition-all hover:border-brand hover:shadow-sm"
            >
              <Logo className="h-12 w-12" />
              <div className="text-center">
                <p className="text-sm font-bold text-ink">{skill.name || skill.skillSlug}</p>
                <p className="mt-0.5 text-2xl font-bold text-brand">{Math.round(progress)}%</p>
                <p className="mt-0.5 text-xs text-muted">{level}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
