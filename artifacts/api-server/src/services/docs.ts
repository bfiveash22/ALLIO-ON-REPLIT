import { google } from 'googleapis';

export async function getUncachableDocsClient() {
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
  return google.docs({ version: 'v1', auth: oauth2Client });
}

export async function readDocument(documentId: string): Promise<string> {
  try {
    const docs = await getUncachableDocsClient();
    const response = await docs.documents.get({
      documentId,
    });
    
    let text = '';
    const content = response.data.body?.content;
    if (content) {
      content.forEach(element => {
        if (element.paragraph && element.paragraph.elements) {
          element.paragraph.elements.forEach(el => {
            if (el.textRun && el.textRun.content) {
              text += el.textRun.content;
            }
          });
        }
      });
    }
    return text.trim();
  } catch (error: any) {
    console.error('Failed to read Google Doc:', error);
    throw new Error(`Failed to read Google Doc: ${error.message}`);
  }
}

export async function appendDocumentText(documentId: string, text: string): Promise<boolean> {
  try {
    const docs = await getUncachableDocsClient();
    
    // First, we need to get the document to find its end index
    const response = await docs.documents.get({
        documentId,
    });
    const content = response.data.body?.content;
    let endIndex = 1; // Default to 1 if empty
    
    if (content && content.length > 0) {
        const lastElement = content[content.length - 1];
        endIndex = lastElement.endIndex ? lastElement.endIndex - 1 : 1;
    }

    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndex,
              },
              text: `\n${text}\n`,
            },
          },
        ],
      },
    });
    
    return true;
  } catch (error: any) {
    console.error('Failed to append to Google Doc:', error);
    throw new Error(`Failed to append to Google Doc: ${error.message}`);
  }
}
