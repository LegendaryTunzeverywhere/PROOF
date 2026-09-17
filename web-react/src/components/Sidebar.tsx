import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CloseIcon, LeafIcon } from "./Icons";
import { useNavItems } from "@/hooks/useNavItems";
import { useLanguage } from "@/context/LanguageContext";

type Common = {
  isDark: boolean;
  onToggleTheme: () => void;
};

function SidebarBody({ isDark, onToggleTheme }: Common) {
  const navItems = useNavItems();
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <img src="/proof-mark.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />
        <span className="font-display text-[16.5px] font-extrabold tracking-[0.2em] text-ink">PROOF</span>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3.5 pb-5">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.id === "work"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex w-full items-center gap-3 rounded-[11px] px-3 py-[11px] text-[13.5px] transition-all duration-200",
                      isActive
                        ? "bg-brand-soft font-semibold text-brand"
                        : "font-medium text-ink-soft hover:bg-elevated hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -left-2 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-brand transition-all duration-300",
                          isActive ? "h-5 opacity-100" : "h-1 opacity-0 group-hover:h-3 group-hover:opacity-60",
                        )}
                      />
                      <span className="relative shrink-0">
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] transition-colors duration-200",
                            isActive ? "text-brand" : "text-faint group-hover:text-ink-soft",
                            item.id === "notifications" && item.badge ? "animate-[bell-ring_1.8s_ease-in-out_infinite]" : "",
                          )}
                        />
                        {item.id === "notifications" && item.badge && item.badge > 0 ? (
                          <span
                            aria-label={`${item.badge} unread notification${item.badge === 1 ? "" : "s"}`}
                            className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#F5A524] ring-2 ring-surface animate-pulse"
                          />
                        ) : null}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.id !== "notifications" && item.badge && item.badge > 0 ? (
                        <span className="ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[#F5A524] px-1 text-[11px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(245,165,36,0.9)]">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
            <LeafIcon className="h-[15px] w-[15px] text-faint" />
            {t.common.theme}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? t.common.switchThemeToLight : t.common.switchThemeToDark}
            onClick={onToggleTheme}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-all duration-300",
              isDark 
                ? "bg-brand" 
                : "bg-ink/15 hover:bg-ink/25",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-[2px] left-[2px] h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out",
                isDark ? "translate-x-[16px]" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar(props: Common) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[230px] shrink-0 flex-col border-r border-line bg-surface xl:w-[248px] lg:flex">
      <SidebarBody {...props} />
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
  ...rest
}: Common & { open: boolean; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[var(--scrim)] backdrop-blur-[3px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal={open}
        aria-label="Main navigation"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[272px] max-w-[86vw] flex-col border-r border-line bg-surface shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <CloseIcon className="h-4.5 w-4.5" />
        </button>
        <SidebarBody {...rest} />
      </div>
    </div>
  );
}
