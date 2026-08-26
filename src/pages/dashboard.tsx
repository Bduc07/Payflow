import { useEffect, useState } from "react";

type TransactionStatus = "Success" | "Pending" | "Refunded";
type PaymentMethod = "QR" | "Card" | "Wallet";
type NavItem = "Dashboard" | "Transactions" | "Activity" | "Settings";

interface StatCard {
  label: string;
  value: string;
  tone?: "success" | "warning";
}

interface MethodBreakdown {
  method: PaymentMethod;
  amount: string;
}

interface Transaction {
  ref: string;
  method: PaymentMethod;
  amount: string;
  status: TransactionStatus;
}

interface ActivityEntry {
  time: string;
  text: string;
}

interface Merchant {
  id: string;
  businessName: string;
  slug: string;
  email: string;
}

interface DashboardProps {
  onUnauthorized: () => void;
}

const NAV_ITEMS: NavItem[] = [
  "Dashboard",
  "Transactions",
  "Activity",
  "Settings",
];

const STATS: StatCard[] = [
  { label: "Revenue today", value: "Rs 48,250" },
  { label: "Transactions", value: "142" },
  { label: "Success rate", value: "96%", tone: "success" },
  { label: "Pending", value: "5", tone: "warning" },
];

const METHOD_BREAKDOWN: MethodBreakdown[] = [
  { method: "QR", amount: "Rs 26,100" },
  { method: "Card", amount: "Rs 14,800" },
  { method: "Wallet", amount: "Rs 7,350" },
];

const TRANSACTIONS: Transaction[] = [
  { ref: "TX1032", method: "QR", amount: "Rs 500", status: "Success" },
  { ref: "TX1031", method: "Card", amount: "Rs 1,200", status: "Success" },
  { ref: "TX1030", method: "Wallet", amount: "Rs 350", status: "Pending" },
  { ref: "TX1029", method: "QR", amount: "Rs 890", status: "Refunded" },
];

const ACTIVITY: ActivityEntry[] = [
  { time: "10:32", text: "Transaction TX1032 created" },
  { time: "10:30", text: "TX1031 marked successful" },
  { time: "10:21", text: "Merchant logged in" },
  { time: "09:58", text: "TX1029 refunded" },
];

const STATUS_STYLES: Record<TransactionStatus, React.CSSProperties> = {
  Success: { backgroundColor: "#123420", color: "#4ade80" },
  Pending: { backgroundColor: "#3a2a06", color: "#f5b642" },
  Refunded: { backgroundColor: "#3a1414", color: "#f87171" },
};

export default function Dashboard({ onUnauthorized }: DashboardProps) {
  const [activeNav, setActiveNav] = useState<NavItem>("Dashboard");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      onUnauthorized();
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("merchant");
          onUnauthorized();
          return;
        }
        const data = await res.json();
        setMerchant(data.merchant);
      })
      .catch(() => {
        onUnauthorized();
      });
  }, [onUnauthorized]);

  const handleCopyLink = async () => {
    if (!merchant) return;
    const link = `${window.location.origin}/pay/${merchant.slug}`;
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>PayHub</div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              style={{
                ...styles.navItem,
                ...(item === activeNav ? styles.navItemActive : {}),
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.greeting}>
              {merchant
                ? `Good morning, ${merchant.businessName}`
                : "Good morning"}
            </h1>
            <p style={styles.date}>{today}</p>
          </div>
          <button style={styles.simulateButton} onClick={handleCopyLink}>
            {linkCopied ? "Link copied!" : "Copy checkout link"}
          </button>
        </header>

        <section style={styles.statGrid}>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                ...styles.statCard,
                ...(stat.tone === "success" ? styles.statCardSuccess : {}),
                ...(stat.tone === "warning" ? styles.statCardWarning : {}),
              }}
            >
              <p style={styles.statLabel}>{stat.label}</p>
              <p
                style={{
                  ...styles.statValue,
                  ...(stat.tone === "success" ? { color: "#4ade80" } : {}),
                  ...(stat.tone === "warning" ? { color: "#f5b642" } : {}),
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h2 style={styles.sectionHeading}>By payment method</h2>
          <div style={styles.methodRow}>
            {METHOD_BREAKDOWN.map((item) => (
              <div key={item.method} style={styles.methodItem}>
                <p style={styles.methodLabel}>{item.method}</p>
                <p style={styles.methodAmount}>{item.amount}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.bottomGrid}>
          <div>
            <h2 style={styles.sectionHeading}>Recent transactions</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Merchant ref</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map((tx) => (
                  <tr key={tx.ref}>
                    <td style={styles.td}>{tx.ref}</td>
                    <td style={styles.td}>{tx.method}</td>
                    <td style={styles.td}>{tx.amount}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...STATUS_STYLES[tx.status],
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={styles.sectionHeading}>Activity</h2>
            <ul style={styles.activityList}>
              {ACTIVITY.map((entry) => (
                <li
                  key={`${entry.time}-${entry.text}`}
                  style={styles.activityItem}
                >
                  <span style={styles.activityTime}>{entry.time}</span>
                  <span style={styles.activityText}>{entry.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0b0d12",
    color: "#f5f6f8",
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  },
  sidebar: {
    width: 220,
    borderRight: "1px solid #1e2330",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
    flexShrink: 0,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    padding: "0 8px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  navItem: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    color: "#9aa1b2",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  navItemActive: {
    backgroundColor: "#1c2130",
    color: "#f5f6f8",
    fontWeight: 700,
  },
  main: {
    flex: 1,
    padding: 32,
    display: "flex",
    flexDirection: "column",
    gap: 28,
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  date: {
    margin: "6px 0 0",
    color: "#9aa1b2",
    fontSize: 14,
  },
  simulateButton: {
    padding: "10px 18px",
    backgroundColor: "transparent",
    border: "1px solid #2a2f3f",
    borderRadius: 10,
    color: "#f5f6f8",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    backgroundColor: "#121620",
    border: "1px solid #232838",
    borderRadius: 12,
    padding: 20,
  },
  statCardSuccess: {
    backgroundColor: "#0f2418",
    border: "1px solid #1b4a2c",
  },
  statCardWarning: {
    backgroundColor: "#2a1f06",
    border: "1px solid #4a3a0c",
  },
  statLabel: {
    margin: "0 0 10px",
    fontSize: 13,
    color: "#9aa1b2",
  },
  statValue: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
  },
  sectionHeading: {
    margin: "0 0 14px",
    fontSize: 15,
    fontWeight: 700,
  },
  methodRow: {
    display: "flex",
    gap: 40,
  },
  methodItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  methodLabel: {
    margin: 0,
    fontSize: 13,
    color: "#9aa1b2",
  },
  methodAmount: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 32,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 12,
    color: "#9aa1b2",
    fontWeight: 600,
    borderBottom: "1px solid #1e2330",
  },
  td: {
    padding: "12px",
    fontSize: 14,
    borderBottom: "1px solid #1e2330",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  activityList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  activityItem: {
    display: "flex",
    gap: 12,
    fontSize: 13,
  },
  activityTime: {
    color: "#9aa1b2",
    flexShrink: 0,
    width: 40,
  },
  activityText: {
    color: "#f5f6f8",
    fontWeight: 600,
  },
};
