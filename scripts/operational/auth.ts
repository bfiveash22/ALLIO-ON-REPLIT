import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

import * as path from 'path';
try { require("dotenv").config(); } catch (_) {}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:8080';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/presentations'
];

async function authenticate() {
  return new Promise((resolve, reject) => {
    let server: http.Server;

    try {
      server = http.createServer(async (req, res) => {
        try {
          if (req.url && req.url.startsWith('/?code=')) {
            const qs = new url.URL(req.url, 'http://localhost:8080').searchParams;
            const code = qs.get('code');
            res.end('Authentication successful! Please return to the terminal and copy your Refresh Token.');
            server.close();
            console.log('\n[ALLIO] Exchanging code for tokens...');
            const { tokens } = await oauth2Client.getToken(code!);
            resolve(tokens);
          } else if (req.url && req.url.startsWith('/?error=')) {
            res.end('Authentication error. Return to terminal.');
            server.close();
            reject(new Error('Auth error from Google.'));
          } else {
            res.end('Waiting for Google OAuth redirect...');
          }
        } catch (e) {
          reject(e);
        }
      }).listen(8080, () => {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
          prompt: 'consent',
          response_type: 'code'
        });
        console.log('\n======================================================');
        console.log('ALLIO SECURE AUTHENTICATION AGENT');
        console.log('======================================================');
        console.log('Please click the link below. It will open in your browser.');
        console.log('Once you approve, the window will automatically close and your token will appear here.');
        console.log('\n' + authUrl + '\n');
        console.log('Listening on http://localhost:8080 for the redirect...');
      });
    } catch(e) {
      reject(e);
    }
  });
}

authenticate().then((tokens: Record<string, string>) => {
  console.log('\n======================================================');
  console.log('SUCCESS! COPY THE REFRESH TOKEN BELOW:');
  console.log('======================================================\n');
  if (tokens.refresh_token) {
    console.log(tokens.refresh_token);
  } else {
    console.log('[WARNING] No Refresh Token returned. You may have already authorized.')
    console.log('If so, you must go to https://myaccount.google.com/permissions and revoke ALLIO access, then run this script again.');
  }
  console.log('\n======================================================');
  process.exit(0);
}).catch((error) => {
  console.error('\n[ERROR]', error);
  process.exit(1);
});
