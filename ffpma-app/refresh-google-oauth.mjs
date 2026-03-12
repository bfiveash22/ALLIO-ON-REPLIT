import { createServer } from 'http';
import { parse } from 'url';
import 'dotenv/config';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '989121620312-d8cs5vmra3pfr1esceue2ctgheoosjep.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const REDIRECT_URI = 'http://localhost:8080';

// ALL SCOPES NEEDED FOR ALLIO
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/calendar'
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

console.log('\n[AUTH_URL]' + authUrl + '[/AUTH_URL]');

const server = createServer(async (req, res) => {
    const { query } = parse(req.url, true);
    if (query.code) {
        try {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: query.code,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                    grant_type: 'authorization_code'
                })
            });
            const tokens = await tokenRes.json();

            if (tokens.error) {
                console.error('\nERROR:', tokens.error_description || tokens.error);
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>Error! Check terminal.</h1>');
                setTimeout(() => process.exit(1), 2000);
                return;
            }

            console.log('\n[REFRESH_TOKEN]' + tokens.refresh_token + '[/REFRESH_TOKEN]');

            res.writeHead(200, { 'Content-Type': 'text/html', 'Connection': 'close' });
            res.end('<h1>Success! You can close this window now. Auto-updating VPS...</h1>');
            setTimeout(() => process.exit(0), 1000);
        } catch (err) {
            console.error('\nError:', err);
            res.writeHead(500).end('Error: ' + err.message);
            setTimeout(() => process.exit(1), 2000);
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Waiting for Google authorization...</h1>');
    }
});

server.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
});
