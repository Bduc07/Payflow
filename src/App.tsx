import { useState } from "react";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

type Page = "login" | "dashboard";

function App() {
  const [page, setPage] = useState<Page>(() =>
    localStorage.getItem("token") ? "dashboard" : "login"
  );

  if (page === "dashboard") {
    return <Dashboard onUnauthorized={() => setPage("login")} />;
  }

  return <Login onLoginSuccess={() => setPage("dashboard")} />;
}

export default App;
