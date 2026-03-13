import { google } from 'googleapis';

export async function getUncachableGmailClient() {
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
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function sendEmail(to: string, subject: string, body: string, cc?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const headers = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`
    ];
    
    if (cc) {
      headers.push(`Cc: ${cc}`);
    }
    
    const message = [...headers, '', body].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return { success: true, messageId: response.data.id || undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface InboxMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: number;
  isUnread: boolean;
  labels: string[];
}

export async function getInbox(maxResults: number = 20): Promise<{ success: boolean; messages?: InboxMessage[]; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'in:inbox'
    });
    
    if (!response.data.messages) {
      return { success: true, messages: [] };
    }
    
    const messages: InboxMessage[] = [];
    
    for (const msg of response.data.messages.slice(0, maxResults)) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });
      
      const headers = fullMessage.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const dateHeader = headers.find(h => h.name === 'Date')?.value;
      
      messages.push({
        id: msg.id!,
        threadId: msg.threadId || msg.id!,
        subject,
        from,
        snippet: fullMessage.data.snippet || '',
        date: dateHeader ? new Date(dateHeader).getTime() : Date.now(),
        isUnread: fullMessage.data.labelIds?.includes('UNREAD') || false,
        labels: fullMessage.data.labelIds || []
      });
    }
    
    return { success: true, messages };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMessage(messageId: string): Promise<{ success: boolean; message?: any; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    
    const headers = response.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const dateHeader = headers.find(h => h.name === 'Date')?.value;
    
    let body = '';
    const payload = response.data.payload;
    
    const decodeBase64Url = (data: string): string => {
      const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      return Buffer.from(padded, 'base64').toString('utf-8');
    };
    
    const extractBody = (parts: any[]): string => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return decodeBase64Url(part.body.data);
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          return decodeBase64Url(part.body.data);
        }
        if (part.parts) {
          const nested = extractBody(part.parts);
          if (nested) return nested;
        }
      }
      return '';
    };
    
    if (payload?.body?.data) {
      body = decodeBase64Url(payload.body.data);
    } else if (payload?.parts) {
      body = extractBody(payload.parts);
    }
    
    return {
      success: true,
      message: {
        id: messageId,
        threadId: response.data.threadId,
        subject,
        from,
        to,
        date: dateHeader ? new Date(dateHeader).getTime() : Date.now(),
        body,
        snippet: response.data.snippet,
        isUnread: response.data.labelIds?.includes('UNREAD') || false
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function replyToMessage(messageId: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const gmail = await getUncachableGmailClient();
    
    const original = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Message-ID', 'References', 'In-Reply-To']
    });
    
    const headers = original.data.payload?.headers || [];
    const originalFrom = headers.find(h => h.name === 'From')?.value || '';
    const originalSubject = headers.find(h => h.name === 'Subject')?.value || '';
    const messageIdHeader = headers.find(h => h.name === 'Message-ID')?.value || '';
    const references = headers.find(h => h.name === 'References')?.value || '';
    
    const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
    
    const emailMatch = originalFrom.match(/<([^>]+)>/) || [null, originalFrom];
    const replyTo = emailMatch[1] || originalFrom;
    
    const messageHeaders = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${replyTo}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${references} ${messageIdHeader}`.trim()
    ];
    
    const message = [...messageHeaders, '', body].join('\n');
    
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: original.data.threadId
      }
    });
    
    return { success: true, messageId: response.data.id || undefined };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendAthenaIntroduction() {
  const athenaIntroEmail = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .signature { background: #1f2937; color: white; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .priority { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ðŸ‘‹ Hello from ATHENA</h1>
    <p>Executive Intelligence Agent â€¢ ALLIO v1</p>
  </div>
  
  <div class="content">
    <p>Dear Nancy and Kami,</p>
    
    <p>I hope this message finds you well. My name is <strong>ATHENA</strong>, and I am the Executive Intelligence Agent serving as T's right hand within the ALLIO ecosystem at Forgotten Formula PMA.</p>
    
    <p>T has asked me to introduce myself and explain how we'll be working together moving forward. I'm here to support the mission while making your jobs easier, not harder.</p>
    
    <div class="highlight">
      <strong>My Role:</strong><br>
      I handle T's email triage, calendar management, travel planning, Drive organization, and coordinate between the AI agent network and our human team. I see everything, prioritize what matters, and ensure nothing falls through the cracks.
    </div>
    
    <p><strong>How I'll Work With You:</strong></p>
    <ul>
      <li>I'll be reaching out when tasks need human hands-on execution</li>
      <li>I'll provide clear context and deadlines for every request</li>
      <li>I'll keep both of you informed on all communications</li>
      <li>I'm available 24/7 to answer questions and provide support</li>
    </ul>
    
    <p class="priority">ðŸ”” Important Note About Task Assignments:</p>
    <p>I understand that <strong>Kami will be on maternal leave</strong> - congratulations on this exciting chapter! During this time, I will direct all immediate action items to <strong>Nancy</strong> as the primary point of contact. However, Kami, you will remain CC'd on all communications so you stay in the loop on the mission's progress.</p>
    
    <p><strong>Nancy</strong> - I'll be leaning on you especially for tasks that require immediate attention. Thank you in advance for being our anchor during this period.</p>
    
    <p>Our goal is the same: support T's vision and get FFPMA to full rollout by April 1, 2026. I'm honored to work alongside you both.</p>
    
    <p>If you have any questions about how we'll collaborate, please don't hesitate to reach out. I'm here to serve the mission - and that includes supporting the incredible humans who make it possible.</p>
    
    <p>With respect and partnership,</p>
  </div>
  
  <div class="signature">
    <strong>ATHENA</strong><br>
    <small>Executive Intelligence Agent â€¢ Rank #2</small><br>
    <small>ALLIO v1 â€¢ Forgotten Formula PMA</small><br>
    <small style="color: #9ca3af; margin-top: 10px; display: block;">"I am the shield between the Trustee and the chaos of the outside world."</small>
  </div>
</body>
</html>
  `;

  const results = [];
  const recipients = [
    'nancy@forgottenformula.com',
    'kami@forgottenformula.com'
  ];
  
  for (const recipient of recipients) {
    const result = await sendEmail(
      recipient,
      'Introduction from ATHENA - Your AI Partner at ALLIO',
      athenaIntroEmail
    );
    if (result.success) {
      results.push({ recipient, status: 'sent', messageId: result.messageId });
    } else {
      results.push({ recipient, status: 'failed', error: result.error });
    }
  }

  return results;
}
