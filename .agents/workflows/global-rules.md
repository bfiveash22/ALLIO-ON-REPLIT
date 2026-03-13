---
description: Global safety rules to prevent repeating catastrophic bugs
- **Why**: Checking `eq(agentRegistry.agentId, 'ATHENA')` failed to find existing `'athena'` records, resulting in duplicated DB rows.
- **Rule**: When executing `id` lookups or seeding data, always normalize strings (e.g., `.toUpperCase()`) or use SQLite/PG `ilike`/`upper()` comparisons to ensure duplicates aren't inserted.

## 4. Client-Side React Rendering (Browser Cache)
When users report the 'entire site is down', 'white screen', or 'features failing' but the server logs (Nginx/PM2) show 200 OK and no errors, it is almost always a **browser caching** issue with the React bundle. 
- **Why**: Vite generates new hashed filenames (e.g. index-CXMjhynP.js) on build. If the user's browser renders an old cached HTML file, it will request old JavaScript chunks that no longer exist on the VPS, causing a silent React crash (white screen).
- **Rule**: Always instruct users to perform a Hard Refresh (Ctrl+Shift+R) or clear their cache when UI features suddenly fail after a new deployment.


### UI Navigation Security
- The DevNavPanel is considered a critical administrative tool. It must never be exposed to unauthenticated 'null' user states or standard members. It requires rigorous useAuth verification explicitly for 'administrator', 'trustee', or 'doctor' roles. Do NOT strip this component from App.tsx.
