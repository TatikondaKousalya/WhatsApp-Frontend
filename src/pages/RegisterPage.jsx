import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't create your account. Check the form and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <aside className="auth-screen__brand">
        <span className="brand-mark">Thread</span>
        <div className="brand-quote">
          <p className="brand-quote__text">Start the conversation. We'll keep the thread.</p>
          <p className="brand-quote__meta">REAL-TIME · END-TO-END ROOMS · PRESENCE</p>
        </div>
      </aside>
      <section className="auth-screen__form">
        <div className="auth-card">
          <p className="auth-card__eyebrow">Get started</p>
          <h1>Create your account</h1>

          {error && <div className="banner-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" required value={form.firstName} onChange={update("firstName")} />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" required value={form.lastName} onChange={update("lastName")} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
              />
            </div>
            <div className="field">
              <label htmlFor="phoneNumber">Phone number</label>
              <input
                id="phoneNumber"
                required
                placeholder="10-digit number"
                value={form.phoneNumber}
                onChange={update("phoneNumber")}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update("password")}
                />
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
