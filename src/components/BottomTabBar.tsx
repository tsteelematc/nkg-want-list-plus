import { NavLink, useLocation } from "react-router-dom";

const TABS = [
  { to: "/", label: "Lists", icon: "📋", matchPrefix: "/groups" },
  { to: "/items", label: "Items", icon: "🎲" },
  { to: "/sources", label: "Sources", icon: "🔗" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

/** Fixed bottom navigation for the mobile-first app shell. */
export function BottomTabBar() {
  const location = useLocation();

  return (
    <nav className="bottom-tab-bar">
      {TABS.map((tab) => {
        const isGroupDetail =
          tab.matchPrefix && location.pathname.startsWith(tab.matchPrefix);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              isActive || isGroupDetail ? "tab active" : "tab"
            }
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
