import { getGoogleDriveClient } from '../services/google-drive-full';
import { google } from 'googleapis';

async function getPresentationContent() {
  const driveClient = await getGoogleDriveClient();
  const auth = (driveClient as any).context._options.auth;
  
  const slides = google.slides({ version: 'v1', auth });
  
  const pres = await slides.presentations.get({
    presentationId: '1wg5evyCkie9g9tjzKY7-LlZ_TJdb7_QHLpQ5F9cYLpM'
  });
  
  console.log('Title:', pres.data.title);
  console.log('Slides:', pres.data.slides ? pres.data.slides.length : 0);
  
  let content = '';
  if (pres.data.slides) {
    for (let i = 0; i < pres.data.slides.length; i++) {
      const slide = pres.data.slides[i];
      content += `\n--- SLIDE ${i + 1} ---\n`;
      if (slide.pageElements) {
        for (const el of slide.pageElements) {
          if (el.shape && el.shape.text && el.shape.text.textElements) {
            for (const te of el.shape.text.textElements) {
              if (te.textRun && te.textRun.content) {
                content += te.textRun.content;
              }
            }
          }
        }
      }
    }
  }
  console.log('\nContent:\n', content);
}

getPresentationContent().catch(e => console.error('Error:', e.message));
