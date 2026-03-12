import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import fs from 'fs';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '989121620312-d8cs5vmra3pfr1esceue2ctgheoosjep.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';
const REDIRECT_URI = 'http://localhost:8080';

// Define the scopes required by the application
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

async function authenticate() {
  return new Promise((resolve, reject) => {
    // Generate the url that will be used for authorization
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to receive a refresh token
      prompt: 'consent', // Force to prompt for consent to ensure a refresh token is returned
      scope: SCOPES,
    });

    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url!.indexOf('code=') > -1) {
            const qs = new url.URL(req.url!, 'http://localhost:8080').searchParams;
            const code = qs.get('code');
            
            res.end('Authentication successful! Please return to the console.');
            (server as any).destroy();

            if (code) {
              const { tokens } = await oauth2Client.getToken(code);
              oauth2Client.credentials = tokens;
              resolve(tokens);
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
      
    // @ts-ignore
    import('server-destroy').then((serverDestroy) => {
      serverDestroy.default(server);
    }).catch(() => {
      // Stub destroy method if module not available
      (server as any).destroy = () => { server.close(); };
    });
  });
}

async function main() {
  console.log('Starting Google OAuth flow...');
  console.log('A browser window will open shortly. Please sign in and grant the requested permissions.');
  
  try {
    const tokens = await authenticate() as any;
    console.log('\n======================================================');
    console.log('AUTHENTICATION SUCCESSFUL');
    console.log('======================================================\n');
    
    if (tokens.refresh_token) {
      console.log('Here is your GOOGLE_REFRESH_TOKEN (KEEP THIS SECRET):');
      console.log('\n', tokens.refresh_token, '\n');
      console.log('Please add this to your VPS .env file along with the CLIENT_ID and CLIENT_SECRET.');
      
      // Also write to a file for easy copying
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
