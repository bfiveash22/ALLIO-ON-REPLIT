import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import fs from 'fs';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:8080';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

interface OAuthTokens {
  refresh_token?: string;
  access_token?: string;
  token_type?: string;
  expiry_date?: number;
}

async function authenticate(): Promise<OAuthTokens> {
  return new Promise((resolve, reject) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
    });

    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url!.indexOf('code=') > -1) {
            const qs = new url.URL(req.url!, 'http://localhost:8080').searchParams;
            const code = qs.get('code');
            res.end('Authentication successful! Please return to the console.');
            server.close();

            if (code) {
              const { tokens } = await oauth2Client.getToken(code);
              oauth2Client.credentials = tokens;
              resolve(tokens as OAuthTokens);
            } else {
              reject(new Error('No code found in URL'));
            }
          } else {
             res.end('Listening for OAuth code...');
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(8080, () => {
        console.log('\n======================================================');
        console.log('Action Required: Please open the following URL in your browser:');
        console.log(authorizeUrl);
        console.log('======================================================\n');
      });
  });
}

async function main() {
  console.log('Starting Google OAuth flow...');
  console.log('A browser window will open shortly. Please sign in and grant the requested permissions.');
  
  try {
    const tokens = await authenticate();
    console.log('\n======================================================');
    console.log('AUTHENTICATION SUCCESSFUL');
    console.log('======================================================\n');
    
    if (tokens.refresh_token) {
      console.log('Here is your GOOGLE_REFRESH_TOKEN (KEEP THIS SECRET):');
      console.log('\n', tokens.refresh_token, '\n');
      console.log('Please add this to your VPS .env file along with the CLIENT_ID and CLIENT_SECRET.');
      
      fs.writeFileSync('refresh_token.txt', tokens.refresh_token);
      console.log('The token has also been saved to refresh_token.txt in this folder.');
    } else {
      console.log('WARNING: No refresh token was returned.');
      console.log('This usually happens if you have already authorized the app previously.');
      console.log('You may need to go to your Google Account Settings -> Security -> Manage Third-party access, remove this app, and try again.');
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
}

main();
