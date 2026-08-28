import { useEffect, useState } from "react";
import RevenueChart from "../components/RevenueChart";

interface Merchant {
  id: string;
  businessName: string;
  slug: string;
  email: string;
}

interface Transaction {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface DashboardProps {
  onUnauthorized: () => void;
}

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  success: { backgroundColor: "#123420", color: "#4ade80" },
  pending: { backgroundColor: "#3a2a06", color: "#f5b642" },
  failed: { backgroundColor: "#3a1414", color: "#f87171" },
};

function formatRs(amount: number): string {
  return `Rs ${amount.toLocaleString("en-US")}`;
}

export default function Dashboard({ onUnauthorized }: DashboardProps) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      onUnauthorized();
      return;
    }

    // Sequenced rather than fired concurrently: two simultaneous requests
    // each needing their own database connection add real latency over a
    // pooled remote Postgres connection (Neon), especially over a slow link.
    // `cancelled` also guards against React StrictMode's dev-only double
    // effect invocation, so the first (soon-discarded) run doesn't still
    // fire its own /transactions call after being superseded.
    let cancelled = false;

    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        if (!meRes.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("merchant");
          onUnauthorized();
          return;
        }

        const meData = await meRes.json();
        if (cancelled) return;
        setMerchant(meData.merchant);

        const txRes = await fetch("/api/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;

        if (txRes.ok) {
          const txData = await txRes.json();
          if (cancelled) return;
          setTransactions(txData.transactions);
        }
      } catch {
        if (!cancelled) onUnauthorized();
      }
    })();

    return () => {
      cancelled = true;
    };
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

  const isToday = (createdAt: string) =>
    new Date(createdAt).toDateString() === new Date().toDateString();

  const successful = transactions.filter((tx) => tx.status === "success");
  const pending = transactions.filter((tx) => tx.status === "pending");
  const revenueToday = successful
    .filter((tx) => isToday(tx.createdAt))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const successRate =
    transactions.length === 0
      ? null
      : Math.round((successful.length / transactions.length) * 100);

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <div style={styles.brand}>PayHub</div>

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
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Revenue today</p>
            <p style={styles.statValue}>{formatRs(revenueToday)}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Transactions</p>
            <p style={styles.statValue}>{transactions.length}</p>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardSuccess }}>
            <p style={styles.statLabel}>Success rate</p>
            <p style={{ ...styles.statValue, color: "#4ade80" }}>
              {successRate === null ? "—" : `${successRate}%`}
            </p>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardWarning }}>
            <p style={styles.statLabel}>Pending</p>
            <p style={{ ...styles.statValue, color: "#f5b642" }}>
              {pending.length}
            </p>
          </div>
        </section>

        <RevenueChart transactions={transactions} />

        <section>
          <h2 style={styles.sectionHeading}>Recent transactions</h2>
          {transactions.length === 0 ? (
            <p style={styles.emptyText}>
              No transactions yet. Share your checkout link to get started.
            </p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Ref</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={styles.td}>{tx.id.slice(0, 8)}</td>
                    <td style={{ ...styles.td, textTransform: "capitalize" }}>
                      {tx.paymentMethod}
                    </td>
                    <td style={styles.td}>{formatRs(tx.amount)}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(STATUS_STYLES[tx.status] ?? {}),
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0b0d12",
    color: "#f5f6f8",
    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
  },
  main: {
    width: "100%",
    maxWidth: 960,
    margin: "0 auto",
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
  emptyText: {
    margin: 0,
    fontSize: 14,
    color: "#9aa1b2",
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
    textTransform: "capitalize",
  },
};
