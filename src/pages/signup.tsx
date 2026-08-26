import { FormEvent, useState } from "react";

interface SignupFormState {
  businessName: string;
  email: string;
  password: string;
}

const STEPS: string[] = [
  "Create your merchant account",
  "Share your checkout link with customers",
  "Watch payments land in one dashboard",
];

interface SignupProps {
  onSwitchToLogin: () => void;
}

export default function Signup({ onSwitchToLogin }: SignupProps) {
  const [form, setForm] = useState<SignupFormState>({
    businessName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange =
    (field: keyof SignupFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Signup failed");
        return;
      }

      onSwitchToLogin();
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
        .signup-text a:hover { text-decoration: underline; }
        .create-button:hover { opacity: 0.9; }
        @media (max-width: 720px) {
          .signup-card { grid-template-columns: 1fr !important; padding: 32px 24px !important; }
        }
      `}</style>

      <div className="signup-card" style={styles.card}>
        <section style={styles.infoSection}>
          <h3 style={styles.infoHeading}>Get set up in minutes</h3>
          <ol style={styles.stepList}>
            {STEPS.map((step, index) => (
              <li key={step} style={styles.stepItem}>
                <span style={styles.stepNumber}>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section style={styles.formSection}>
          <h1 style={styles.title}>PayHub</h1>
          <h2 style={styles.heading}>Create your account</h2>
          <p style={styles.subheading}>
            Start tracking payments across every channel
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label style={styles.fieldLabel} htmlFor="businessName">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              className="text-input"
              style={styles.textInput}
              placeholder="Himalayan Mart"
              value={form.businessName}
              onChange={handleChange("businessName")}
              autoComplete="organization"
            />

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
              autoComplete="new-password"
            />

            {error && <p style={styles.errorText}>{error}</p>}

            <button
              type="submit"
              className="create-button"
              style={styles.createButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p style={styles.signupText}>
            Already have an account?{" "}
            <a
              style={styles.link}
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToLogin();
              }}
            >
              Log in
            </a>
          </p>
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
    maxWidth: 960,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 48,
    backgroundColor: "#0b0d12",
    padding: 48,
    boxSizing: "border-box",
  },
  infoSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  infoHeading: {
    margin: "0 0 24px",
    fontSize: 18,
    fontWeight: 700,
  },
  stepList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 15,
    fontWeight: 600,
    color: "#f5f6f8",
  },
  stepNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "#1c2130",
    color: "#cbd0dc",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
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
    backgroundColor: "#121620",
    border: "1px solid #2a2f3f",
    borderRadius: 10,
    color: "#f5f6f8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  createButton: {
    width: "100%",
    padding: 14,
    marginTop: 6,
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
  errorText: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "#f87171",
  },
};
