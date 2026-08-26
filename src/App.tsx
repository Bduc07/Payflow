import { useState } from "react";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";

type Page = "login" | "signup" | "dashboard";

function App() {
  const [page, setPage] = useState<Page>(() =>
    localStorage.getItem("token") ? "dashboard" : "login"
  );

  if (page === "signup") {
    return <Signup onSwitchToLogin={() => setPage("login")} />;
  }

  if (page === "dashboard") {
    return <Dashboard onUnauthorized={() => setPage("login")} />;
  }

  return (
    <Login
      onSwitchToSignup={() => setPage("signup")}
      onLoginSuccess={() => setPage("dashboard")}
    />
  );
}

export default App;
