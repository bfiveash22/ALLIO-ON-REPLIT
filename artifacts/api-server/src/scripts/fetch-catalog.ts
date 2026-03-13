import { getGoogleDriveClient } from '../services/google-drive-full';
import { google } from 'googleapis';

async function getDocContent() {
  const driveClient = await getGoogleDriveClient();
  
  // Get oauth credentials from drive client - the auth is stored in the context
  const auth = (driveClient as any).context._options.auth;
  
  const docs = google.docs({ version: 'v1', auth });
  
  const doc = await docs.documents.get({
    documentId: '1igzWU6iubS5EuotKEo2QI2pz22qoeAM7vYj3AaUTMNY'
  });
  
  let text = '';
  if (doc.data.body && doc.data.body.content) {
    for (const element of doc.data.body.content) {
      if (element.paragraph && element.paragraph.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            text += el.textRun.content;
          }
        }
      }
      if (element.table) {
        for (const row of element.table.tableRows || []) {
          for (const cell of row.tableCells || []) {
            for (const content of cell.content || []) {
              if (content.paragraph && content.paragraph.elements) {
                for (const el of content.paragraph.elements) {
                  if (el.textRun) text += el.textRun.content + ' | ';
                }
              }
            }
          }
          text += '\n';
        }
      }
    }
  }
  console.log(text);
}

getDocContent().catch(e => console.error('Error:', e.message));
