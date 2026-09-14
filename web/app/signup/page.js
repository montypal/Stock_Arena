import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/auth';
import { signup } from '../actions';
import { Flash, PageHead } from '../ui';

export default async function SignupPage({ searchParams }) {
  const sp = await searchParams;
  if (await currentUser()) redirect('/league');

  return (
    <main className="auth">
      <PageHead eyebrow="StockArena" title="Create your account" />
      <Flash sp={sp} />
      <form action={signup} className="stack">
        <label className="field">
          <span>Username</span>
          <input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]+"
            title="3–20 letters, numbers, or underscores"
          />
          <small>This is the name other players see.</small>
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" autoComplete="new-password" required minLength={8} />
          <small>At least 8 characters.</small>
        </label>
        <button className="btn primary block" type="submit">
          Create account
        </button>
      </form>
      <p className="muted center">
        Already playing? <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
