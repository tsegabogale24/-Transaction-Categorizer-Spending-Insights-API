import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  DollarSign,
  FileUp,
  Lightbulb,
  Loader2,
  Lock,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

import {
  createTransactions,
  getAnomalies,
  getMonthlyInsights,
  loginUser,
  registerUser,
} from "./api/client";
import "./styles.css";

const categoryTone = {
  groceries: "tone-green",
  dining: "tone-gold",
  transport: "tone-blue",
  subscriptions: "tone-coral",
  entertainment: "tone-purple",
  other: "tone-gray",
};

const categoryOptions = [
  { value: "", label: "Auto detect" },
  { value: "groceries", label: "Groceries" },
  { value: "dining", label: "Dining" },
  { value: "transport", label: "Transport" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function friendlyMonth(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser({ email, password });
      }
      const token = await loginUser({ email, password });
      onAuthenticated(token.access_token, email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="landing-panel">
        <header className="landing-topbar">
          <div className="brand-row landing-brand"><div className="brand-mark small">S</div><strong>spendwise</strong></div>
          <span>personal finance dashboard</span>
        </header>

        <div className="landing-copy">
          <p className="eyebrow">smarter transaction review</p>
          <h1>See where your money is moving.</h1>
          <p className="muted">Import bank-style rows, auto-categorize merchants, and spot spending patterns without digging through a spreadsheet.</p>
        </div>

        <div className="preview-board" aria-hidden="true">
          <article className="preview-card preview-total">
            <span>Total tracked</span>
            <strong>$406.15</strong>
            <div className="spark-bars"><i /><i /><i /><i /></div>
          </article>
          <article className="preview-card">
            <span>Top category</span>
            <strong>transport</strong>
            <div className="mini-bar"><b /></div>
          </article>
          <article className="preview-card preview-alert">
            <span>Anomaly</span>
            <strong>$260.00</strong>
            <small>larger than normal</small>
          </article>
        </div>
      </section>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">Secure access</p>
          <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={8} required />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={17} /> : <Lock size={17} />}
          {mode === "login" ? "Sign in" : "Register and sign in"}
        </button>
        <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </form>
    </main>
  );
}

function Dashboard({ token, email, onLogout }) {
  const [activeView, setActiveView] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [monthly, setMonthly] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [created, setCreated] = useState([]);
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    merchant_description: "",
    date: new Date().toISOString().slice(0, 10),
    category: "",
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const byCategory = new Map();
    for (const item of monthly) {
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + Number(item.total_spend));
    }
    return [...byCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthly]);

  const totalSpend = totals.reduce((sum, item) => sum + item.amount, 0);
  const largestCategory = Math.max(...totals.map((item) => item.amount), 1);

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "insights", label: "Insights", icon: Lightbulb },
  ];

  const viewTitle = {
    overview: "Overview",
    transactions: "Transactions",
    insights: "Insights",
  }[activeView];

  function selectView(view) {
    setActiveView(view);
    setMobileMenuOpen(false);
  }

  async function refreshInsights() {
    const [monthlyData, anomalyData] = await Promise.all([
      getMonthlyInsights(token),
      getAnomalies(token),
    ]);
    setMonthly(monthlyData);
    setAnomalies(anomalyData);
  }

  useEffect(() => {
    refreshInsights().catch((err) => setError(err.message));
  }, [token]);

  function updateTransactionForm(field, value) {
    setTransactionForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImport(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const transactions = [{
        amount: Number(transactionForm.amount),
        merchant_description: transactionForm.merchant_description.trim(),
        date: transactionForm.date,
        ...(transactionForm.category ? { category: transactionForm.category } : {}),
      }];
      if (!transactions[0].amount || transactions[0].amount <= 0) {
        throw new Error("Enter an amount greater than 0.");
      }
      if (!transactions[0].merchant_description || !transactions[0].date) {
        throw new Error("Merchant and date are required.");
      }
      const saved = await createTransactions(token, transactions);
      setCreated((current) => [...saved, ...current]);
      await refreshInsights();
      setNotice(`${saved.length} transactions categorized and saved.`);
      setTransactionForm({
        amount: "",
        merchant_description: "",
        date: new Date().toISOString().slice(0, 10),
        category: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark small">S</div><strong>spendwise</strong></div>
        <nav aria-label="Primary">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              className={activeView === id ? "active" : ""}
              key={id}
              onClick={() => selectView(id)}
              type="button"
            >
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={onLogout}><LogOut size={17} /> Log out</button>
      </aside>

      <section className="dashboard-main">
        <header className="mobile-header">
          <div className="brand-row"><div className="brand-mark small">S</div><strong>spendwise</strong></div>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="icon-button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </header>

        {mobileMenuOpen && (
          <button
            aria-label="Close menu overlay"
            className="menu-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
        )}

        <aside className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`} aria-hidden={!mobileMenuOpen}>
          <div className="brand-row"><div className="brand-mark small">S</div><strong>spendwise</strong></div>
          <nav aria-label="Mobile primary">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                className={activeView === id ? "active" : ""}
                key={id}
                onClick={() => selectView(id)}
                type="button"
              >
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>
          <button className="logout-button" onClick={onLogout}><LogOut size={17} /> Log out</button>
        </aside>

        <header className="topbar">
          <div>
            <p className="eyebrow">{email}</p>
            <h1>{viewTitle}</h1>
          </div>
          <button className="secondary-button" onClick={() => refreshInsights()}><RefreshCw size={17} /> Refresh</button>
        </header>

        {notice && <div className="notice"><Sparkles size={17} /> {notice}</div>}
        {error && <div className="alert"><AlertTriangle size={17} /> {error}</div>}

        <section className="view-panel" key={activeView}>
          {activeView === "overview" && (
            <>
              <section className="metric-grid">
                <article className="metric-card dark-card">
                  <p>Total spend</p>
                  <strong>{formatMoney(totalSpend)}</strong>
                  <span>Across saved monthly categories.</span>
                </article>
                <article className="metric-card green-card">
                  <p>Categories</p>
                  <strong>{totals.length}</strong>
                  <span>Auto-tagged from merchant names.</span>
                </article>
                <article className="metric-card peach-card">
                  <p>Anomalies</p>
                  <strong>{anomalies.length}</strong>
                  <span>Large compared with category history.</span>
                </article>
              </section>

              <section className="content-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div><h2>Add Transaction</h2><p>Submit one categorized transaction.</p></div>
                    <CreditCard size={20} />
                  </div>
                  <form className="transaction-form" onSubmit={handleImport}>
                    <label>
                      Amount
                      <input
                        min="0.01"
                        onChange={(event) => updateTransactionForm("amount", event.target.value)}
                        placeholder="0.00"
                        required
                        step="0.01"
                        type="number"
                        value={transactionForm.amount}
                      />
                    </label>
                    <label>
                      Merchant
                      <input
                        onChange={(event) => updateTransactionForm("merchant_description", event.target.value)}
                        placeholder="Merchant name"
                        required
                        type="text"
                        value={transactionForm.merchant_description}
                      />
                    </label>
                    <label>
                      Date
                      <input
                        onChange={(event) => updateTransactionForm("date", event.target.value)}
                        required
                        type="date"
                        value={transactionForm.date}
                      />
                    </label>
                    <label>
                      Category
                      <select
                        onChange={(event) => updateTransactionForm("category", event.target.value)}
                        value={transactionForm.category}
                      >
                        {categoryOptions.map((option) => (
                          <option key={option.value || "auto"} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="primary-button" type="submit" disabled={loading}>
                      {loading ? <Loader2 className="spin" size={17} /> : <FileUp size={17} />}
                      Save transaction
                    </button>
                  </form>
                </article>

                <article className="panel">
                  <div className="panel-heading"><div><h2>Categories</h2><p>{monthly[0] ? friendlyMonth(monthly[0].month) : "No transactions yet"}</p></div></div>
                  <div className="category-list">
                    {totals.map((item, index) => {
                      const percent = Math.round((item.amount / largestCategory) * 100);
                      return (
                        <div className="category-row" key={item.category} style={{ "--delay": `${index * 70}ms` }}>
                          <div className="category-meta"><span className={`dot ${categoryTone[item.category] ?? "tone-gray"}`} /> {item.category}</div>
                          <strong>{formatMoney(item.amount)}</strong>
                          <div className="bar"><span style={{ width: `${percent}%` }} /></div>
                        </div>
                      );
                    })}
                    {totals.length === 0 && <p className="empty-text">Import transactions to populate insights.</p>}
                  </div>
                </article>
              </section>
            </>
          )}

          {activeView === "transactions" && (
            <section className="single-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div><h2>Latest Transactions</h2><p>Saved from your most recent import.</p></div>
                  <CreditCard size={20} />
                </div>
                <div className="transaction-list">
                  {created.map((item, index) => (
                    <div className="transaction-row elevated-row" key={item.id} style={{ "--delay": `${index * 50}ms` }}>
                      <span className={`avatar ${categoryTone[item.category] ?? "tone-gray"}`}>{item.merchant_description.slice(0, 1)}</span>
                      <div><strong>{item.merchant_description}</strong><p>{item.category} · {item.transaction_date}</p></div>
                      <span>{formatMoney(item.amount)}</span>
                    </div>
                  ))}
                  {created.length === 0 && <p className="empty-text">Import transactions from Overview to see them here.</p>}
                </div>
              </article>
            </section>
          )}

          {activeView === "insights" && (
            <section className="content-grid insights-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div><h2>Category Ranking</h2><p>Highest spend first.</p></div>
                  <DollarSign size={20} />
                </div>
                <div className="category-list">
                  {totals.map((item, index) => (
                    <div className="category-row" key={item.category} style={{ "--delay": `${index * 70}ms` }}>
                      <div className="category-meta"><span className={`dot ${categoryTone[item.category] ?? "tone-gray"}`} /> {item.category}</div>
                      <strong>{formatMoney(item.amount)}</strong>
                      <div className="bar"><span style={{ width: `${Math.round((item.amount / largestCategory) * 100)}%` }} /></div>
                    </div>
                  ))}
                  {totals.length === 0 && <p className="empty-text">No category insights yet.</p>}
                </div>
              </article>

              <article className="panel purple-panel">
                <div className="panel-heading"><div><h2>Anomalies</h2><p>Large compared with history.</p></div><AlertTriangle size={20} /></div>
                <div className="transaction-list">
                  {anomalies.map((item, index) => (
                    <div className="anomaly-row" key={item.transaction_id} style={{ "--delay": `${index * 60}ms` }}>
                      <strong>{item.merchant_description}</strong>
                      <span>{formatMoney(item.amount)} over {formatMoney(item.threshold)}</span>
                    </div>
                  ))}
                  {anomalies.length === 0 && <p className="empty-text light">No unusual activity found yet.</p>}
                </div>
              </article>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") ?? "");
  const [email, setEmail] = useState(() => localStorage.getItem("user_email") ?? "");

  function handleAuthenticated(nextToken, nextEmail) {
    localStorage.setItem("access_token", nextToken);
    localStorage.setItem("user_email", nextEmail);
    setToken(nextToken);
    setEmail(nextEmail);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_email");
    setToken("");
    setEmail("");
  }

  return token ? (
    <Dashboard token={token} email={email} onLogout={handleLogout} />
  ) : (
    <AuthPanel onAuthenticated={handleAuthenticated} />
  );
}
