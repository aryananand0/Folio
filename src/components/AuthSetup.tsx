import Link from "next/link";

export default function AuthSetup() {
  return (
    <main id="main-content" className="container auth-page" tabIndex={-1}>
      <section className="setup-card" aria-labelledby="setup-title">
        <p className="eyebrow">Configuration checkpoint</p>
        <h1 id="setup-title">Connect Folio to Clerk.</h1>
        <p>
          Authentication code is installed, but this local environment has no Clerk keys yet.
          Create the Folio application in Clerk, then add its development keys to an ignored
          <code>.env.local</code> file.
        </p>
        <ol>
          <li>Open the Clerk Dashboard and create an application named <strong>Folio</strong>.</li>
          <li>Open <strong>API keys</strong> and copy the development publishable and secret keys.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill only the two empty Clerk key values.</li>
          <li>Restart <code>npm run dev</code>, then return to this page.</li>
        </ol>
        <p className="setup-secret-note">Keep <code>CLERK_SECRET_KEY</code> private. Do not paste either key into chat or commit <code>.env.local</code>.</p>
        <div className="setup-actions">
          <a className="button" href="https://dashboard.clerk.com/" target="_blank" rel="noopener noreferrer">
            Open Clerk Dashboard <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link className="text-link" href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
