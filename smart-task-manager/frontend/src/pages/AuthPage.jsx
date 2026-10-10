import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Layers3 } from 'lucide-react';
import { Brand, Loading } from '../components/Common';
import { useAuth } from '../hooks/useApp';
import { errorMessage } from '../services/api';
export function AuthPage({ register = false }) {
  const { user, loading, authenticate } = useAuth(),
    location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '' }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  const destination =
    location.state?.from?.startsWith('/') && !location.state.from.startsWith('//')
      ? location.state.from
      : '/';
  if (loading) return <Loading />;
  if (user) return <Navigate to={destination} replace />;
  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (register && values.name.trim().length < 2)
      return setError('Your name must have at least 2 characters.');
    if (
      register &&
      (values.password.length < 8 || new TextEncoder().encode(values.password).length > 72)
    )
      return setError('Use a password with at least 8 characters and at most 72 bytes.');
    setBusy(true);
    try {
      await authenticate(
        register ? 'register' : 'login',
        register
          ? { ...values, name: values.name.trim(), email: values.email.trim() }
          : { email: values.email.trim(), password: values.password },
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Brand />
        <div className="story-content">
          <span className="eyebrow">LESS CHAOS. MORE CLARITY.</span>
          <h1>
            Make room
            <br />
            for <em>progress.</em>
          </h1>
          <p>
            Your tasks, plans, and next big ideas.
            <br />
            All in one calm, organized place.
          </p>
          <div className="story-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="illustration-card">
              <span className="illustration-icon">
                <Layers3 size={25} />
              </span>
              <div className="illustration-line long" />
              <div className="illustration-line" />
              {[0, 1, 2].map((i) => (
                <div className="illustration-row" key={i}>
                  <span>
                    <Check size={13} />
                  </span>
                  <div className="illustration-line" />
                </div>
              ))}
              <div className="illustration-progress">
                <span />
              </div>
            </div>
            <span className="illustration-check">
              <Check size={30} />
            </span>
          </div>
        </div>
        <span className="story-footer">A little progress, every day.</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-brand">
          <Brand />
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>{register ? 'A fresh start awaits.' : 'Welcome back.'}</h2>
          <p>
            {register
              ? 'Create your account and make space for what matters.'
              : 'Let’s pick up where you left off.'}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <input
                  name="name"
                  value={values.name}
                  onChange={change}
                  autoComplete="name"
                  placeholder="Your name"
                  required
                  maxLength={80}
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={change}
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  name="password"
                  type={show ? 'text' : 'password'}
                  value={values.password}
                  onChange={change}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  placeholder={register ? 'At least 8 characters' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary auth-submit" disabled={busy}>
              {busy ? 'Just a moment…' : register ? 'Create account' : 'Sign in'}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to Taskly?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <div className="auth-note">
            <Check size={15} />
            Your workspace is personal. Your tasks stay yours.
          </div>
        </div>
      </section>
    </div>
  );
}
