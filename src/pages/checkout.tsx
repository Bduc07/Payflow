import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Merchant {
  businessName: string;
  slug: string;
}

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/merchants/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setMerchant(data.merchant);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get(
      "payment"
    );
    if (payment) {
      setPaymentBanner(payment);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handlePay = async () => {
    setError(null);
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 10) {
      setError("Enter an amount of at least Rs 10");
      return;
    }

    setIsPaying(true);

    try {
      const res = await fetch("/api/payments/khalti/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantSlug: slug, amount: numericAmount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Could not start payment");
        return;
      }

      window.location.href = data.payment_url;
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (notFound) {
    return (
      <div style={styles.page}>
        <p style={styles.notFound}>No merchant found for this link.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.brand}>PayHub</p>
        <h1 style={styles.heading}>
          {merchant ? `Pay ${merchant.businessName}` : "Loading..."}
        </h1>

        {paymentBanner && (
          <div
            style={{
              ...styles.banner,
              ...(paymentBanner === "success"
                ? styles.bannerSuccess
                : styles.bannerFailed),
            }}
          >
            {paymentBanner === "success"
              ? "Payment completed successfully."
              : paymentBanner === "pending"
              ? "Payment is still pending."
              : "Payment failed or was cancelled."}
          </div>
        )}

        <label style={styles.fieldLabel} htmlFor="amount">
          Amount (Rs, min 10)
        </label>
        <input
          id="amount"
          type="number"
          min={10}
          style={styles.input}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="500"
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.payButton}
          onClick={handlePay}
          disabled={isPaying || !merchant}
        >
          {isPaying ? "Starting payment..." : "Pay with Khalti"}
        </button>
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
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#121620",
    border: "1px solid #232838",
    borderRadius: 16,
    padding: 32,
    boxSizing: "border-box",
  },
  brand: {
    margin: "0 0 24px",
    fontSize: 16,
    fontWeight: 700,
  },
  heading: {
    margin: "0 0 20px",
    fontSize: 22,
    fontWeight: 700,
  },
  fieldLabel: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "#cbd0dc",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: 12,
    backgroundColor: "#0b0d12",
    border: "1px solid #2a2f3f",
    borderRadius: 10,
    color: "#f5f6f8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  error: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#f87171",
  },
  payButton: {
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
  banner: {
    padding: "12px 16px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 16,
  },
  bannerSuccess: {
    backgroundColor: "#0f2418",
    border: "1px solid #1b4a2c",
    color: "#4ade80",
  },
  bannerFailed: {
    backgroundColor: "#2a1f06",
    border: "1px solid #4a3a0c",
    color: "#f5b642",
  },
  notFound: {
    fontSize: 16,
    color: "#9aa1b2",
  },
};
