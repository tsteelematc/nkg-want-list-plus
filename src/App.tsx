import { HashRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import { SourcesPage } from "./pages/SourcesPage";
import { ItemsPage } from "./pages/ItemsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./App.css";

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <div className="app-shell">
          <header className="app-header">
            <Link to="/" className="brand">
              NKG Want List Plus
            </Link>
            <nav>
              <NavLink to="/" end>
                Items
              </NavLink>
              <NavLink to="/groups">Groups</NavLink>
              <NavLink to="/sources">Sources</NavLink>
              <NavLink to="/settings">Settings</NavLink>
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<ItemsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppDataProvider>
  );
}

export default App;
