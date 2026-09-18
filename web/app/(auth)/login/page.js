import { redirect } from 'next/navigation';
import { currentUser } from '../../../lib/db/auth';
import { login } from '../../../lib/actions';
import { Flash, PageHead } from '../../../components/layout/ui';

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await currentUser()) redirect('/league');

  return (
    <main className="auth">
      <PageHead eyebrow="StockArena" title="Welcome back" />
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
          Log in
        </button>
      </form>
      <p className="fineprint">Contact your league admin for access.</p>
    </main>
  );
}
