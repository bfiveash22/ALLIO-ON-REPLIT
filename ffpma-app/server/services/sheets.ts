import { google } from 'googleapis';

export async function getUncachableSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth is not fully configured - missing GOOGLE_REFRESH_TOKEN in .env');
  }

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function readSheet(spreadsheetId: string, range: string): Promise<any[][]> {
  try {
    const sheets = await getUncachableSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    return response.data.values || [];
  } catch (error: any) {
    console.error('Failed to read Google Sheet:', error);
    throw new Error(`Failed to read Google Sheet: ${error.message}`);
  }
}

export async function appendSheetRow(spreadsheetId: string, range: string, values: any[][]): Promise<boolean> {
  try {
    const sheets = await getUncachableSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error('Failed to append to Google Sheet:', error);
    throw new Error(`Failed to append to Google Sheet: ${error.message}`);
  }
}

export async function updateSheetCell(spreadsheetId: string, range: string, values: any[][]): Promise<boolean> {
  try {
    const sheets = await getUncachableSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    
    return true;
  } catch (error: any) {
    console.error('Failed to update Google Sheet cell:', error);
    throw new Error(`Failed to update Google Sheet cell: ${error.message}`);
  }
}
