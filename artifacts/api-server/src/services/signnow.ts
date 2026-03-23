import axios from 'axios';
import { circuitBreakers } from '../lib/circuit-breaker';
import { logger } from '../lib/logger';

interface SignNowConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface Document {
  id: string;
  user_id: string;
  document_name: string;
  page_count: string;
  created: string;
  updated: string;
  original_filename: string;
}

interface InviteResponse {
  id: string;
  status: string;
}

class SignNowService {
  private baseUrl = 'https://api.signnow.com';
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private config: SignNowConfig;

  constructor() {
    this.config = {
      clientId: process.env.SIGNNOW_CLIENT_ID || '',
      clientSecret: process.env.SIGNNOW_CLIENT_SECRET || process.env.SIGNNOW_SECRET_KEY || '',
      username: process.env.SIGNNOW_USERNAME || process.env.SIGNNOW_EMAIL || '',
      password: process.env.SIGNNOW_PASSWORD || '',
    };
  }

  private isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.username &&
      this.config.password
    );
  }


    private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('SignNow API credentials not configured');
    }

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    try {
      const response = await circuitBreakers.signnow.call(() =>
        axios.post<TokenResponse>(
          `${this.baseUrl}/oauth2/token`,
          new URLSearchParams({
            grant_type: 'password',
            username: this.config.username,
            password: this.config.password,
            scope: '*',
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${credentials}`,
            },
          }
        )
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken;
    } catch (error: any) {
      logger.error('SignNow auth error', { source: 'signnow', error: error.message, detail: error.response?.data });
      throw new Error('Failed to authenticate with SignNow');
    }
  }

  async getStatus(): Promise<{ connected: boolean; configured: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { connected: false, configured: false, error: 'API credentials not configured' };
    }

    try {
      await this.getAccessToken();
      return { connected: true, configured: true };
    } catch (error: any) {
      return { connected: false, configured: true, error: error.message };
    }
  }

  async uploadDocument(filePath: string, fileName: string): Promise<Document> {
    const token = await this.getAccessToken();
    const FormData = (await import('form-data')).default;
    const fs = await import('fs');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    const response = await axios.post(`${this.baseUrl}/document`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async uploadDocumentFromBuffer(buffer: Buffer, fileName: string): Promise<Document> {
    const token = await this.getAccessToken();
    const FormData = (await import('form-data')).default;
    
    const form = new FormData();
    form.append('file', buffer, { filename: fileName });

    const response = await axios.post(`${this.baseUrl}/document`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async getDocument(documentId: string): Promise<Document> {
    const token = await this.getAccessToken();

    const response = await axios.get(`${this.baseUrl}/document/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async listDocuments(): Promise<Document[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(`${this.baseUrl}/user/documentsv2`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async getDocumentStats(): Promise<{ total: number; signed: number; pending: number; templates: number }> {
    try {
      const documents = await this.listDocuments();
      const templates = documents.filter((d: any) => d.template === true || d.is_template).length;
      const signed = documents.filter((d: any) => d.document_status === 'completed' || d.status === 'completed').length;
      const pending = documents.filter((d: any) => d.document_status === 'pending' || d.status === 'pending' || d.document_status === 'waiting-for-me' || d.document_status === 'waiting-for-others').length;
      
      return {
        total: documents.length,
        signed,
        pending,
        templates,
      };
    } catch (error) {
      logger.error("Failed to get document stats", { source: "signnow", error: error instanceof Error ? error.message : String(error) });
      return { total: 0, signed: 0, pending: 0, templates: 0 };
    }
  }

  async sendInvite(
    documentId: string,
    signerEmail: string,
    signerName: string,
    subject: string,
    message: string
  ): Promise<InviteResponse> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/document/${documentId}/invite`,
      {
        to: [
          {
            email: signerEmail,
            role: 'Signer',
            order: 1,
            reassign: '0',
            decline_by_signature: '0',
          },
        ],
        from: this.config.username,
        subject,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async createEmbeddedInvite(
    documentId: string,
    signerEmail: string,
    roleId: string
  ): Promise<{ id: string; data?: any[] }> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/v2/documents/${documentId}/embedded-invites`,
      {
        invites: [
          {
            email: signerEmail,
            role_id: roleId,
            order: 1,
            auth_method: 'none',
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.debug('SignNow embedded invite response', { source: 'signnow', data: typeof response.data === 'object' ? '[object]' : response.data });
    return response.data;
  }

  async generateSigningLink(
    documentId: string,
    fieldInviteUniqueId: string,
    expirationMinutes: number = 30
  ): Promise<{ link: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/documents/${documentId}/embedded-invites/${fieldInviteUniqueId}/link`,
        {
          link_expiration: expirationMinutes,
          auth_method: 'none'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('SignNow link generation error', { source: 'signnow', error: error.response?.data });
      
      // Try alternative: use email-based invite instead of embedded
      logger.warn('Falling back to email invite', { source: 'signnow', documentId });
      throw error;
    }
  }
  
  async createSigningInviteLinkWithRole(
    documentId: string,
    signerEmail: string,
    signerName: string,
    roleName: string,
    roleId: string
  ): Promise<string> {
    const token = await this.getAccessToken();

    // Use the simple invite approach that sends email
    try {
      await axios.post(
        `${this.baseUrl}/document/${documentId}/invite`,
        {
          to: [
            {
              email: signerEmail,
              role: roleName,
              role_id: roleId,
              order: 1,
              reminder: 0,
              expiration_days: 30,
              subject: 'Please sign this document',
              message: `Hi ${signerName}, please review and sign this document.`
            }
          ],
          from: process.env.SIGNNOW_USERNAME || process.env.SIGNNOW_EMAIL || 'noreply@forgottenformula.com'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Return a redirect URL to SignNow for signing
      return `https://app.signnow.com/webapp/document/${documentId}`;
    } catch (error: any) {
      logger.error('SignNow invite error', { source: 'signnow', error: error.response?.data });
      throw error;
    }
  }
  
  async createSigningInviteLink(
    documentId: string,
    signerEmail: string,
    signerName: string
  ): Promise<string> {
    // Get the document roles first to find the correct role
    const roles = await this.getDocumentRoles(documentId);
    const signerRole = roles[0]; // Use first role as fallback
    
    if (signerRole) {
      return this.createSigningInviteLinkWithRole(
        documentId,
        signerEmail,
        signerName,
        signerRole.name,
        signerRole.unique_id
      );
    }
    
    // If no roles, just return direct document URL
    return `https://app.signnow.com/webapp/document/${documentId}`;
  }

  async downloadDocument(documentId: string): Promise<Buffer> {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `${this.baseUrl}/document/${documentId}/download?type=collapsed`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
      }
    );

    return Buffer.from(response.data);
  }

  async cancelInvite(documentId: string): Promise<void> {
    const token = await this.getAccessToken();

    await axios.put(
      `${this.baseUrl}/document/${documentId}/fieldinvitecancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async deleteDocument(documentId: string): Promise<void> {
    const token = await this.getAccessToken();

    await axios.delete(`${this.baseUrl}/document/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createFromTemplate(templateId: string, documentName: string): Promise<{ id: string }> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/template/${templateId}/copy`,
      { document_name: documentName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async getDocumentRoles(documentId: string): Promise<any[]> {
    const token = await this.getAccessToken();

    const response = await axios.get(`${this.baseUrl}/document/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.roles || [];
  }

  async createAgreement(
    templateId: string,
    signerName: string,
    signerEmail: string,
    documentName: string
  ): Promise<{ documentId: string; signingUrl: string }> {
    const docResult = await this.createFromTemplate(templateId, documentName);
    const documentId = docResult.id;

    const roles = await this.getDocumentRoles(documentId);
    logger.debug('Document roles retrieved', { source: 'signnow', count: roles?.length });
    const signerRole = roles.find((r: any) => r.name?.toLowerCase().includes('signer')) || roles[0];
    
    if (!signerRole) {
      logger.warn('No signer role found, falling back to email invite', { source: 'signnow' });
      const signingUrl = await this.createSigningInviteLink(documentId, signerEmail, signerName);
      return { documentId, signingUrl };
    }

    try {
      const inviteResult = await this.createEmbeddedInvite(documentId, signerEmail, signerRole.unique_id);
      
      // Handle different response structures from SignNow API
      // Response can be: { data: [{ id: '...', ... }] } or { id: '...' }
      let inviteId: string | undefined;
      if (Array.isArray((inviteResult as any).data)) {
        inviteId = (inviteResult as any).data[0]?.id;
      } else if (inviteResult.id) {
        inviteId = inviteResult.id;
      }
      
      logger.debug('Extracted invite ID', { source: 'signnow' });
      
      if (inviteId) {
        try {
          // SignNow limits link expiration to 45 minutes max
          const linkResult = await this.generateSigningLink(documentId, inviteId, 45);
          return { documentId, signingUrl: linkResult.link };
        } catch (linkError: any) {
          logger.error('Failed to generate embedded link', { source: 'signnow', error: linkError.response?.data });
          // Since embedded invite was created, we can't create another invite
          // Return direct document URL - signer will need to access via SignNow
          logger.warn('Returning direct SignNow document URL as fallback', { source: 'signnow' });
          return { documentId, signingUrl: `https://app.signnow.com/webapp/document/${documentId}` };
        }
      }
    } catch (embeddedError: any) {
      logger.error('Failed to create embedded invite', { source: 'signnow', error: embeddedError.response?.data });
      // Fallback to email invite only if no invite exists yet
      try {
        const signingUrl = await this.createSigningInviteLink(documentId, signerEmail, signerName);
        return { documentId, signingUrl };
      } catch (fallbackError: any) {
        logger.error('Fallback invite also failed', { source: 'signnow', error: fallbackError.response?.data });
        // Return direct document URL as last resort
        return { documentId, signingUrl: `https://app.signnow.com/webapp/document/${documentId}` };
      }
    }

    // Ultimate fallback - return direct document URL
    return { documentId, signingUrl: `https://app.signnow.com/webapp/document/${documentId}` };
  }

  async createDoctorAgreement(
    templateId: string,
    data: { doctorName: string; doctorEmail: string; clinicName?: string; licenseNumber?: string }
  ): Promise<{ documentId: string; signingUrl: string }> {
    const documentName = `Doctor Agreement - ${data.doctorName} - ${new Date().toISOString().split('T')[0]}`;
    return this.createAgreement(templateId, data.doctorName, data.doctorEmail, documentName);
  }

  async createMemberAgreement(
    templateId: string,
    data: { memberName: string; memberEmail: string }
  ): Promise<{ documentId: string; signingUrl: string }> {
    const documentName = `Member Agreement - ${data.memberName} - ${new Date().toISOString().split('T')[0]}`;
    return this.createAgreement(templateId, data.memberName, data.memberEmail, documentName);
  }

  async convertToTemplate(documentId: string, templateName: string): Promise<{ id: string }> {
    const token = await this.getAccessToken();

    const response = await axios.post(
      `${this.baseUrl}/document/${documentId}/template`,
      { document_name: templateName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async addFieldsToDocument(
    documentId: string,
    fields: Array<{
      type: 'signature' | 'date' | 'text';
      role: string;
      pageNumber?: number;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      required?: boolean;
      label?: string;
    }>
  ): Promise<any> {
    const token = await this.getAccessToken();

    const signatureFields = fields.filter(f => f.type === 'signature').map(f => ({
      x: f.x || 50,
      y: f.y || 700,
      width: f.width || 200,
      height: f.height || 30,
      page_number: f.pageNumber || 0,
      role: f.role,
      required: f.required !== false,
      label: f.label || 'Signature',
    }));

    const textFields = fields.filter(f => f.type !== 'signature').map(f => ({
      x: f.x || 300,
      y: f.y || 700,
      width: f.width || 150,
      height: f.height || 20,
      page_number: f.pageNumber || 0,
      role: f.role,
      required: f.required !== false,
      label: f.label || 'Date',
      type: f.type === 'date' ? 'date' : 'text',
    }));

    const payload: any = {};
    if (signatureFields.length > 0) payload.signatures = signatureFields;
    if (textFields.length > 0) payload.texts = textFields;

    const response = await axios.put(
      `${this.baseUrl}/document/${documentId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  async uploadAndCreateTemplate(
    buffer: Buffer,
    fileName: string,
    templateName: string,
    signerRoleName: string = 'Trustee'
  ): Promise<{ templateId: string; documentId: string }> {
    const uploadedDoc = await this.uploadDocumentFromBuffer(buffer, fileName);
    const documentId = uploadedDoc.id;

    const roles = await this.getDocumentRoles(documentId);
    const existingRole = roles.find((r: any) =>
      r.name?.toLowerCase() === signerRoleName.toLowerCase()
    );
    const roleName = existingRole?.name || signerRoleName;

    await this.addFieldsToDocument(documentId, [
      {
        type: 'signature',
        role: roleName,
        pageNumber: 0,
        x: 50,
        y: 680,
        width: 200,
        height: 30,
        label: 'Trustee Signature',
      },
      {
        type: 'date',
        role: roleName,
        pageNumber: 0,
        x: 300,
        y: 680,
        width: 150,
        height: 20,
        label: 'Date Signed',
      },
    ]);

    try {
      const templateResult = await this.convertToTemplate(documentId, templateName);
      return { templateId: templateResult.id, documentId };
    } catch (templateError: any) {
      logger.info('Template conversion info, using document directly', { source: 'signnow', info: templateError.response?.data || templateError.message });
      return { templateId: documentId, documentId };
    }
  }

  async createEmbeddedSigningSession(
    documentId: string,
    signerEmail: string,
    signerName: string
  ): Promise<{ signingUrl: string; embeddedUrl: string; documentId: string }> {
    const roles = await this.getDocumentRoles(documentId);
    const signerRole = roles.find((r: any) =>
      r.name?.toLowerCase().includes('trustee') || r.name?.toLowerCase().includes('signer')
    ) || roles[0];

    if (!signerRole) {
      const directUrl = `https://app.signnow.com/webapp/document/${documentId}`;
      return { signingUrl: directUrl, embeddedUrl: directUrl, documentId };
    }

    try {
      const inviteResult = await this.createEmbeddedInvite(documentId, signerEmail, signerRole.unique_id);

      let inviteId: string | undefined;
      if (Array.isArray((inviteResult as any).data)) {
        inviteId = (inviteResult as any).data[0]?.id;
      } else if (inviteResult.id) {
        inviteId = inviteResult.id;
      }

      if (inviteId) {
        try {
          const linkResult = await this.generateSigningLink(documentId, inviteId, 45);
          return {
            signingUrl: linkResult.link,
            embeddedUrl: linkResult.link,
            documentId,
          };
        } catch (linkError: any) {
          logger.error('Embedded link generation failed, using direct URL', { source: 'signnow', error: linkError.response?.data });
        }
      }
    } catch (embeddedError: any) {
      logger.error('Embedded invite failed', { source: 'signnow', error: embeddedError.response?.data });
    }

    try {
      const signingUrl = await this.createSigningInviteLink(documentId, signerEmail, signerName);
      return { signingUrl, embeddedUrl: signingUrl, documentId };
    } catch (fallbackError: any) {
      const directUrl = `https://app.signnow.com/webapp/document/${documentId}`;
      return { signingUrl: directUrl, embeddedUrl: directUrl, documentId };
    }
  }
}

export const signNowService = new SignNowService();
