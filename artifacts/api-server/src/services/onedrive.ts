import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=onedrive',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('OneDrive not connected');
  }
  return accessToken;
}

async function getClient() {
  const accessToken = await getAccessToken();
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function listOneDriveFiles(folderPath?: string): Promise<any[]> {
  const client = await getClient();
  const path = folderPath ? `/me/drive/root:/${folderPath}:/children` : '/me/drive/root/children';
  const result = await client.api(path).get();
  return result.value || [];
}

export async function uploadToOneDrive(fileName: string, content: Buffer, folderPath?: string): Promise<any> {
  const client = await getClient();
  const path = folderPath
    ? `/me/drive/root:/${folderPath}/${fileName}:/content`
    : `/me/drive/root:/${fileName}:/content`;
  return client.api(path).put(content);
}

export async function createOneDriveFolder(folderName: string, parentPath?: string): Promise<any> {
  const client = await getClient();
  const path = parentPath ? `/me/drive/root:/${parentPath}:/children` : '/me/drive/root/children';
  return client.api(path).post({
    name: folderName,
    folder: {},
    '@microsoft.graph.conflictBehavior': 'rename'
  });
}

export async function downloadFromOneDrive(filePath: string): Promise<Buffer> {
  const client = await getClient();
  const stream = await client.api(`/me/drive/root:/${filePath}:/content`).getStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function searchOneDrive(query: string): Promise<any[]> {
  const client = await getClient();
  const result = await client.api(`/me/drive/root/search(q='${encodeURIComponent(query)}')`).get();
  return result.value || [];
}

export async function getOneDriveFileUrl(filePath: string): Promise<string> {
  const client = await getClient();
  const item = await client.api(`/me/drive/root:/${filePath}`).get();
  return item.webUrl || '';
}
