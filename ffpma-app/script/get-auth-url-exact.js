const { google } = require('googleapis');

const CLIENT_ID = '989121620312-d8cs5vmra3pfr1esceue2ctgheoosjep.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const scopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/presentations'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log(authUrl);
