import { HashRouter, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import { SourcesPage } from "./pages/SourcesPage";
import { ItemsPage } from "./pages/ItemsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { BottomTabBar } from "./components/BottomTabBar";
import "./App.css";

function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <div className="app-shell">
          <main>
            <Routes>
              <Route path="/" element={<GroupsPage />} />
              <Route path="/groups/:groupId" element={<GroupDetailPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          <BottomTabBar />
        </div>
      </HashRouter>
    </AppDataProvider>
  );
}

export default App;
