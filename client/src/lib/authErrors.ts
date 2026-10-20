/** Firebase error codes are not user-facing copy — translate the ones people actually hit. */
export function readableAuthError(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password do not match an account.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Sign in instead.';
    case 'auth/weak-password':
      return 'Use at least 6 characters, including a number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google window closed before sign-in finished.';
    default:
      return err instanceof Error ? err.message : 'Sign-in failed. Try again.';
  }
}
