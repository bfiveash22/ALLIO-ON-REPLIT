# WORDPRESS AUTH FIX - EXACT CODE

## THE BUG

WordPress `wp-login.php` returns **HTML**, not JSON.

Your code is doing:
```javascript
const json = await wpResponse.json();
```

This crashes with:
```
SyntaxError: Bad escaped character in JSON at position 12
```

Because WordPress sends HTML, not JSON!

---

## THE FIX

WordPress uses HTTP redirects for login:
- **Success:** 302 redirect to wp-admin
- **Failure:** 200 with HTML error page

**REPLACE THIS:**
```javascript
const wpResponse = await fetch(
  `${process.env.WP_SITE_URL}/wp-login.php`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `log=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`,
  }
);

// BROKEN - WordPress doesn't return JSON!
const json = await wpResponse.json();
```

**WITH THIS:**
```javascript
const wpResponse = await fetch(
  `${process.env.WP_SITE_URL}/wp-login.php`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `log=${encodeURIComponent(username)}&pwd=${encodeURIComponent(password)}`,
    redirect: 'manual' // Important: don't follow redirects
  }
);

// Check HTTP status - 302 = success, anything else = failure
if (wpResponse.status !== 302) {
  return res.status(401).json({ 
    success: false, 
    error: 'Invalid username or password.' 
  });
}

// WordPress validated credentials successfully
// Continue with creating session...
```

---

## THAT'S IT

Two line change:
1. Add `redirect: 'manual'`
2. Check `wpResponse.status === 302` instead of parsing JSON

Build. Deploy. Done.

WordPress auth will work.
