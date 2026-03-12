import { google } from 'googleapis';
import { getUncachableGoogleDriveClient } from './drive';

export async function getUncachableSlidesClient() {
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
  return google.slides({ version: 'v1', auth: oauth2Client });
}

export async function getPresentation(presentationId: string): Promise<any> {
  const slides = await getUncachableSlidesClient();
  const res = await slides.presentations.get({
    presentationId,
  });
  return res.data;
}

export async function copyPresentation(presentationId: string, newTitle: string): Promise<{ id: string, webViewLink: string }> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    // Copy the file
    const copiedFileMetadata = {
      name: newTitle,
    };
    
    const res = await drive.files.copy({
      fileId: presentationId,
      requestBody: copiedFileMetadata,
      fields: 'id, webViewLink',
    });
    
    if (!res.data.id || !res.data.webViewLink) {
        throw new Error('Failed to copy presentation properly.');
    }
    
    return {
      id: res.data.id,
      webViewLink: res.data.webViewLink
    };
  } catch (error: any) {
    console.error('Failed to copy presentation:', error);
    throw new Error(`Failed to copy Google Slides presentation: ${error.message}`);
  }
}

export async function updatePresentation(presentationId: string, requests: any[]): Promise<boolean> {
  try {
    const slides = await getUncachableSlidesClient();
    
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests
      }
    });
    
    return true;
  } catch (error: any) {
    console.error('Failed to update presentation:', error);
    throw new Error(`Failed to update Google Slides presentation: ${error.message}`);
  }
}

export async function extractTextFromPresentation(presentationId: string): Promise<string> {
  try {
    const data = await getPresentation(presentationId);
    let extractedText = '';
    
    if (!data.slides) return '';

    for (let i = 0; i < data.slides.length; i++) {
        const slide = data.slides[i];
        extractedText += `\n--- SLIDE ${i + 1} ---\n`;
        
        if (!slide.pageElements) continue;
        
        for (const element of slide.pageElements) {
            if (element.shape && element.shape.text && element.shape.text.textElements) {
                for (const textElement of element.shape.text.textElements) {
                    if (textElement.textRun && textElement.textRun.content) {
                        extractedText += textElement.textRun.content;
                    }
                }
            }
        }
    }
    
    return extractedText.trim();
  } catch (error: any) {
    console.error('Failed to extract text from presentation:', error);
    throw new Error(`Failed to extract text from Google Slides presentation: ${error.message}`);
  }
}
