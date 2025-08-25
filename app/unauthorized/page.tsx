
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link href="/">
        <a>Go back to the homepage</a>
      </Link>
    </div>
  );
}
