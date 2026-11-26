import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { errorMessage } from '../services/http';
import { authService } from '../services/authService';
import { FormError, Notice, PageTitle } from '../components/ui';
import type { AccountRole } from '../types';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';
const modes: AuthMode[] = ['sign-in', 'sign-up', 'forgot-password', 'reset-password'];

export function AuthPage() {
  const { mode: routeMode = 'sign-in' } = useParams();
  const normalizedRouteMode = routeMode === 'signup' ? 'sign-up' : routeMode === 'signin' ? 'sign-in' : routeMode;
  const mode = modes.includes(normalizedRouteMode as AuthMode) ? (normalizedRouteMode as AuthMode) : 'sign-in';
  const navigate = useNavigate();
  const { countries, countriesError, countriesLoading, refreshCountries, refreshSession } = useAppContext();

  const [role, setRole] = useState<AccountRole>('buyer');
  const [countryCode, setCountryCode] = useState('UG');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const countryOptions = countries;
  const isRecovery = mode === 'forgot-password' || mode === 'reset-password';
  const title =
    mode === 'sign-up'
      ? 'Join Terrabok.'
      : mode === 'forgot-password'
        ? 'Reset your password.'
        : mode === 'reset-password'
          ? 'Choose a new password.'
          : 'Welcome back.';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setFieldError('');
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        await authService.signUp({ name: name.trim(), email: email.trim(), password, role, countryCode });
        await refreshSession();
        const destination = role === 'admin' ? '/admin' : role === 'seller' ? '/seller/setup' : '/account';
        navigate(destination, { replace: true });
      } else if (mode === 'sign-in') {
        const result = await authService.signIn({ email: email.trim(), password, role });
        await refreshSession();
        const destination = result.user.role === 'admin' ? '/admin' : result.user.role === 'seller' ? '/seller/dashboard' : '/account';
        navigate(destination, { replace: true });
      } else if (mode === 'forgot-password') {
        const result = await authService.requestPasswordReset(email.trim());
        setMessage(result.message || 'If this address is registered, recovery instructions have been sent to your email.');
      } else {
        if (password !== confirmPassword) throw new Error('The passwords do not match.');
        const result = await authService.confirmPasswordReset(password);
        setMessage(result.message || 'Your password has been updated. You can now sign in.');
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'The passwords do not match.') setFieldError(caught.message);
      else setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page tb-ebay-page tb-page-auth-page">
      <div className="auth-aside">
        <p className="eyebrow">Terrabok ACCOUNTS</p>
        <h1>Good style.<br /><em>Made simple.</em></h1>
        <p>Sign in once to browse independent creators, manage orders, or run your shop.</p>
        <div className="auth-aside-image">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85"
            alt="Shoppers exploring independent fashion pieces"
          />
        </div>
      </div>

      <div className="auth-form-wrap">
        <Link className="back-link" to="/">
          <ArrowLeft size={14} /> Back to discover
        </Link>

        {!isRecovery && (
          <div className="segmented" style={{ marginBottom: '18px' }}>
            <Link
              to="/auth/sign-in"
              style={{
                padding: '9px 16px',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
                background: mode === 'sign-in' ? 'var(--green-dark)' : '#efeee8',
                color: mode === 'sign-in' ? '#fff' : '#62675e',
              }}
            >
              Sign in
            </Link>
            <Link
              to="/auth/sign-up"
              style={{
                padding: '9px 16px',
                fontSize: '11px',
                fontWeight: 600,
                textDecoration: 'none',
                background: mode === 'sign-up' ? 'var(--green-dark)' : '#efeee8',
                color: mode === 'sign-up' ? '#fff' : '#62675e',
              }}
            >
              Create account
            </Link>
          </div>
        )}

        <PageTitle eyebrow={isRecovery ? 'ACCOUNT RECOVERY' : 'YOUR Terrabok'} title={<>{title}</>}>
          {mode === 'sign-up'
            ? 'Enter your details below to start shopping or selling.'
            : mode === 'sign-in'
              ? 'Enter your email and password to continue.'
              : mode === 'forgot-password'
                ? 'We will send a password reset link to your email.'
                : 'Enter and confirm your new password below.'}
        </PageTitle>

        {error && <Notice tone="error" title="Could not complete request">{error}</Notice>}
        {message && <Notice tone="success" title="Account update">{message}</Notice>}
        {mode === 'sign-up' && countriesLoading && !countryOptions.length && (
          <Notice tone="info" title="Loading countries">Fetching available countries...</Notice>
        )}
        {mode === 'sign-up' && !countriesLoading && !countryOptions.length && (
          <Notice tone="warning" title="Country list unavailable">
            {countriesError || 'No countries returned by the account service.'}{' '}
            <button className="text-button" type="button" onClick={() => void refreshCountries()}>
              Retry
            </button>
          </Notice>
        )}

        <form className="form-stack" onSubmit={submit}>
          {(mode === 'sign-up' || mode === 'sign-in') && (
            <label className="field">
              <span>Signing in as</span>
              <div className="segmented">
                {(['buyer', 'seller'] as const).map((item) => (
                  <label key={item}>
                    <input
                      type="radio"
                      name="role"
                      value={item}
                      checked={role === item}
                      onChange={() => setRole(item)}
                    />
                    <span>{item === 'buyer' ? 'Shopper / Buyer' : 'Seller / Shop'}</span>
                  </label>
                ))}
              </div>
            </label>
          )}

          {mode === 'sign-up' && (
            <label className="field">
              <span>Full name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={80}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}

          {(mode === 'sign-up' || mode === 'sign-in' || mode === 'forgot-password') && (
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          )}

          {mode === 'sign-up' && (
            <label className="field">
              <span>Country</span>
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                required
                disabled={!countryOptions.length}
              >
                <option value="" disabled>
                  {countryOptions.length ? 'Select country' : 'Loading countries...'}
                </option>
                {countryOptions.map((country) => (
                  <option value={country.code} key={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(mode === 'sign-up' || mode === 'sign-in' || mode === 'reset-password') && (
            <label className="field">
              <span>{mode === 'reset-password' ? 'New password' : 'Password'}</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                  placeholder="Minimum 8 characters"
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 0,
                    padding: '4px',
                    cursor: 'pointer',
                    color: '#62675e',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
          )}

          {mode === 'reset-password' && (
            <label className="field">
              <span>Confirm new password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
          )}

          <FormError message={fieldError} />

          <button className="button button-dark" type="submit" disabled={busy}>
            {busy
              ? 'Please wait...'
              : mode === 'sign-up'
                ? 'Create account'
                : mode === 'forgot-password'
                  ? 'Send reset link'
                  : mode === 'reset-password'
                    ? 'Save new password'
                    : 'Sign in'}
            <Mail size={15} />
          </button>
        </form>

        <div className="auth-switches">
          {mode !== 'forgot-password' && mode !== 'reset-password' && (
            <Link to="/auth/forgot-password">Forgot password?</Link>
          )}
          {mode === 'forgot-password' && (
            <Link to="/auth/sign-in">Back to sign in</Link>
          )}
          {mode === 'reset-password' && (
            <Link to="/auth/sign-in">Go to sign in</Link>
          )}
        </div>
      </div>
    </section>
  );
}

