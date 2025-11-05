import { google } from 'googleapis';
import { Readable } from 'stream';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFile(params: {
  fileName: string;
  mimeType: string;
  fileContent: Buffer | Readable | string;
  folderId?: string;
}) {
  const drive = await getUncachableGoogleDriveClient();

  const fileMetadata: any = {
    name: params.fileName,
  };

  if (params.folderId) {
    fileMetadata.parents = [params.folderId];
  }

  const media = {
    mimeType: params.mimeType,
    body: params.fileContent instanceof Buffer 
      ? Readable.from(params.fileContent) 
      : params.fileContent,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink, mimeType, size',
  });

  return response.data;
}

/**
 * List files in Google Drive
 */
export async function listFiles(params?: {
  folderId?: string;
  query?: string;
  maxResults?: number;
}) {
  const drive = await getUncachableGoogleDriveClient();

  let query = params?.query;
  if (params?.folderId && !query) {
    query = `'${params.folderId}' in parents`;
  }

  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name, mimeType, size, createdTime, webViewLink, iconLink)',
    pageSize: params?.maxResults || 50,
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Get file metadata
 */
export async function getFileMetadata(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, iconLink, owners',
  });

  return response.data;
}

/**
 * Download file content
 */
export async function downloadFile(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  return response.data;
}

/**
 * Create a folder in Google Drive
 */
export async function createFolder(params: {
  folderName: string;
  parentId?: string;
}) {
  const drive = await getUncachableGoogleDriveClient();

  const fileMetadata: any = {
    name: params.folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (params.parentId) {
    fileMetadata.parents = [params.parentId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Share a file (set permissions)
 */
export async function shareFile(params: {
  fileId: string;
  email?: string;
  role?: 'reader' | 'writer' | 'commenter';
  type?: 'user' | 'anyone';
}) {
  const drive = await getUncachableGoogleDriveClient();

  const permission: any = {
    type: params.type || 'user',
    role: params.role || 'reader',
  };

  if (params.email && params.type === 'user') {
    permission.emailAddress = params.email;
  }

  const response = await drive.permissions.create({
    fileId: params.fileId,
    requestBody: permission,
    fields: 'id',
  });

  return response.data;
}

/**
 * Delete a file
 */
export async function deleteFile(fileId: string) {
  const drive = await getUncachableGoogleDriveClient();

  await drive.files.delete({ fileId });
}

/**
 * Search files by name
 */
export async function searchFiles(searchTerm: string, maxResults: number = 20) {
  const drive = await getUncachableGoogleDriveClient();

  const response = await drive.files.list({
    q: `name contains '${searchTerm}' and trashed=false`,
    fields: 'files(id, name, mimeType, size, createdTime, webViewLink, iconLink)',
    pageSize: maxResults,
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
}

/**
 * Export task data to Google Drive as JSON
 */
export async function exportTaskToJson(taskData: any, folderId?: string) {
  const fileName = `Task_${taskData.id}_${new Date().toISOString().split('T')[0]}.json`;
  const fileContent = JSON.stringify(taskData, null, 2);

  return await uploadFile({
    fileName,
    mimeType: 'application/json',
    fileContent,
    folderId,
  });
}
