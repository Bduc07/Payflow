import { FormEvent, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

interface LoginFormState {
  email: string;
  password: string;
}

const FEATURES: string[] = [
  "QR payments tracked automatically",
  "Card transactions in real time",
  "Wallet payments via Khalti",
];

interface LoginProps {
  onSwitchToSignup: () => void;
  onLoginSuccess: () => void;
}

export default function Login({
  onSwitchToSignup,
  onLoginSuccess,
}: LoginProps) {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof LoginFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("merchant", JSON.stringify(data.merchant));
      onLoginSuccess();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleLogin = async (credential: string) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Google login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("merchant", JSON.stringify(data.merchant));

      onLoginSuccess();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        .text-input::placeholder { color: #5b6172; }
        .text-input:focus { border-color: #5b7cfa; }
        .forgot-link:hover, .signup-text a:hover { text-decoration: underline; }
        .login-button:hover { opacity: 0.9; }
        @media (max-width: 720px) {
          .login-card { grid-template-columns: 1fr !important; padding: 32px 24px !important; }
        }
      `}</style>

      <div className="login-card" style={styles.card}>
        <section style={styles.formSection}>
          <h1 style={styles.title}>PayHub</h1>
          <h2 style={styles.heading}>Welcome back</h2>
          <p style={styles.subheading}>
            Log in to view your merchant dashboard
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label style={styles.fieldLabel} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="text-input"
              style={styles.textInput}
              placeholder="merchant@shop.com"
              value={form.email}
              onChange={handleChange("email")}
              autoComplete="email"
            />

            <label style={styles.fieldLabel} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="text-input"
              style={styles.textInput}
              placeholder="********"
              value={form.password}
              onChange={handleChange("password")}
              autoComplete="current-password"
            />

            <a
              className="forgot-link"
              style={styles.forgotLink}
              href="#forgot-password"
            >
              Forgot password?
            </a>
            <div style={styles.divider}>
              <span>OR</span>
            </div>

            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleLogin(credentialResponse.credential);
                }
              }}
              onError={() => {
                setError("Google login failed");
              }}
              useOneTap
            />

            {error && <p style={styles.errorText}>{error}</p>}

            <button
              type="submit"
              className="login-button"
              style={styles.loginButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p style={styles.signupText}>
            New merchant?{" "}
            <a
              style={styles.link}
              href="#create-account"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToSignup();
              }}
            >
              Create an account
            </a>
          </p>
        </section>

        <section style={styles.infoSection}>
          <h3 style={styles.infoHeading}>One dashboard for every payment</h3>
          <ul style={styles.featureList}>
            {FEATURES.map((feature) => (
              <li key={feature} style={styles.featureItem}>
                <span style={styles.featureBullet} />
                {feature}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0b0d12",
    color: "#f5f6f8",
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: 880,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 48,
    backgroundColor: "#121620",
    border: "1px solid #232838",
    borderRadius: 16,
    padding: 48,
    boxSizing: "border-box",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: "0 0 24px",
    fontSize: 20,
    fontWeight: 700,
  },
  heading: {
    margin: "0 0 8px",
    fontSize: 26,
    fontWeight: 700,
  },
  subheading: {
    margin: "0 0 28px",
    color: "#9aa1b2",
    fontSize: 14,
  },
  fieldLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd0dc",
  },
  textInput: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 18,
    backgroundColor: "#0b0d12",
    border: "1px solid #2a2f3f",
    borderRadius: 10,
    color: "#f5f6f8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  forgotLink: {
    display: "block",
    textAlign: "right",
    marginBottom: 24,
    fontSize: 13,
    color: "#7c9bff",
    textDecoration: "none",
  },
  errorText: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "#f87171",
  },
  loginButton: {
    width: "100%",
    padding: 14,
    backgroundColor: "#f5f6f8",
    color: "#0b0d12",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  signupText: {
    margin: "20px 0 0",
    textAlign: "center",
    fontSize: 13,
    color: "#9aa1b2",
  },
  link: {
    color: "#7c9bff",
    textDecoration: "none",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  infoHeading: {
    margin: "0 0 20px",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  featureList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "#cbd0dc",
  },
  featureBullet: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#5b7cfa",
    flexShrink: 0,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px 0",
    color: "#5b6172",
    fontSize: 12,
    fontWeight: 600,
  },
};
