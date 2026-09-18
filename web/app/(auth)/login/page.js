import { redirect } from 'next/navigation';
import { currentUser } from '../../../lib/db/auth';
import { login } from '../../../lib/actions';
import { Flash, PageHead } from '../../../components/layout/ui';
import Icon from '../../../components/layout/icons';

// Accounts are handed out by the league admin; there is no sign-up page.
export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await currentUser()) redirect('/league');

  return (
    <main className="acct-auth">
      <PageHead eyebrow="Welcome back" title="Log" accent="in" />
      <section className="card acct-auth-card" aria-label="Log in">
        <Flash sp={sp} />
        <form action={login} className="stack">
          <label className="field">
            <span>Username</span>
            <input name="username" autoComplete="username" autoCapitalize="none" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="btn primary block" type="submit">
            <Icon name="zap" size={18} strokeWidth={2.2} />
            Log in
          </button>
        </form>
      </section>
      <p className="fineprint">Contact your league admin for access.</p>
    </main>
  );
}
