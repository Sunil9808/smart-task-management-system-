import { Link } from 'react-router-dom';
export function NotFound() {
  return (
    <div className="not-found">
      <span className="eyebrow">A SMALL DETOUR</span>
      <h1>404</h1>
      <h2>This page wandered off.</h2>
      <p>Let’s get you back to something familiar.</p>
      <Link to="/" className="button primary">
        Back to overview
      </Link>
    </div>
  );
}
