// The real admin API is hosted on a free-trial IIS site that gates its entire host behind
// HTTP Basic Auth (see `PLATFORM_ACCESS_KEY` in `core/platform-key.ts` — the client already
// sends this same key to same-origin/trusted hosts). Two things are required to make that
// work through this dev proxy, not just one:
//
//   1. Forward the trial-host Basic Auth header to the target (`headers` below) — otherwise
//      every request is rejected by IIS itself before it ever reaches the app's own login
//      logic, regardless of what the client sent.
//   2. Strip `WWW-Authenticate` from the proxied response (`configure` below) — IIS stamps
//      this header onto *every* 401 response from this host, including the app's own
//      legitimate ones (wrong password, expired session, etc.), not just its own infra-level
//      lockout. A browser `fetch()`/XHR that receives a 401 with `WWW-Authenticate: Basic`
//      is treated as a native HTTP auth challenge and hangs indefinitely waiting for
//      credentials nothing in this app ever supplies — that's the literal "stuck on
//      'Signing in…' forever" bug: reproducible on a plain wrong-password attempt, not just
//      an invalid/expired token. Dropping the header lets the app's own JSON 401 body (and
//      its own session-expiry handling) reach the UI normally instead.
const TRIAL_HOST_AUTH = 'Basic MTEzMjQ4ODM6NjAtZGF5ZnJlZXRyaWFs';

function stripWwwAuthenticate(proxy) {
  proxy.on('proxyRes', (proxyRes) => {
    delete proxyRes.headers['www-authenticate'];
  });
}

module.exports = {
  '/api': {
    target: 'https://xstoreegy002-001-site1.etempurl.com',
    secure: false,
    changeOrigin: true,
    headers: { Authorization: TRIAL_HOST_AUTH },
    configure: stripWwwAuthenticate,
  },
  '/uploads': {
    target: 'https://xstoreegy002-001-site1.etempurl.com',
    secure: false,
    changeOrigin: true,
    headers: { Authorization: TRIAL_HOST_AUTH },
    configure: stripWwwAuthenticate,
  },
};
