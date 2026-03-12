import { google } from 'googleapis';

const CLIENT_ID = '989121620312-d8cs5vmra3pfr1esceue2ctgheoosjep.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const CODE = '4/0AfrIepAfn_lwirMJm7rD6Q4MC305g8mf1WNPiGaPHuDDJilC1B-0CIP5VIJEnIgLyNyTiw';

async function tryExchange(redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri);
  try {
    const { tokens } = await oauth2Client.getToken(CODE);
    console.log('\n===========================================');
    console.log('SUCCESS with redirectUri:', redirectUri);
    if (tokens.refresh_token) {
      console.log('YOUR REFRESH TOKEN IS:');
      console.log(tokens.refresh_token);
    } else {
      console.log('ACCESS TOKEN:', tokens.access_token);
      console.log('WARNING: No refresh token returned. You may have already authorized this app.');
    }
    console.log('===========================================\n');
    return true;
  } catch (e: any) {
    console.log(`Failed with ${redirectUri}:`, e.message);
    return false;
  }
}

async function main() {
  const uris = [
    'http://localhost:8080',
    'http://localhost:8080/',
    'http://localhost:3000/oauth2callback',
    'urn:ietf:wg:oauth:2.0:oob'
  ];
  for (const uri of uris) {
    if (await tryExchange(uri)) break;
  }
}
main();
