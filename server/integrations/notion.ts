import { z } from "zod";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.access_token && connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Notion not connected');
  }
  return accessToken;
}

async function notionRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function createTaskInNotion(taskData: {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assignee?: string;
  databaseId: string;
}) {
  const { title, description, priority, dueDate, assignee, databaseId } = taskData;

  // Get database schema to check available properties
  let database;
  try {
    database = await getNotionDatabase(databaseId);
  } catch (error) {
    throw new Error(`Failed to access Notion database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  const dbProperties = database.properties;
  const properties: any = {};

  // Find the title property (required by Notion)
  const titleProp = Object.entries(dbProperties).find(([_, prop]: any) => prop.type === 'title');
  if (!titleProp) {
    throw new Error('Database must have a title property');
  }
  properties[titleProp[0]] = {
    "title": [
      {
        "text": {
          "content": title
        }
      }
    ]
  };

  // Optionally add description if database has a rich_text property
  if (description) {
    const descProp = Object.entries(dbProperties).find(([name, prop]: any) => 
      prop.type === 'rich_text' && (name.toLowerCase().includes('description') || name.toLowerCase().includes('notes'))
    );
    if (descProp) {
      properties[descProp[0]] = {
        "rich_text": [
          {
            "text": {
              "content": description.substring(0, 2000) // Notion limit
            }
          }
        ]
      };
    }
  }

  // Optionally add priority if database has a select property
  if (priority) {
    const priorityProp = Object.entries(dbProperties).find(([name, prop]: any) => 
      prop.type === 'select' && name.toLowerCase().includes('priority')
    );
    if (priorityProp) {
      const [propName, propDef]: any = priorityProp;
      const options = propDef.select?.options || [];
      
      // Helper function to normalize option names (remove emoji, punctuation, extra spaces)
      const normalizeOptionName = (name: string): string => {
        return name
          .replace(/[\uD800-\uDFFF]./g, '') // Remove emoji (surrogate pairs)
          .replace(/[\u2600-\u27BF]/g, '') // Remove misc symbols
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .trim()
          .toLowerCase()
          .replace(/\s+/g, ' '); // Normalize spaces
      };
      
      const normalizedPriority = normalizeOptionName(priority);
      
      // Try to find a matching option (normalized comparison)
      let matchingOption = options.find((opt: any) => 
        normalizeOptionName(opt.name) === normalizedPriority
      );
      
      if (!matchingOption) {
        // Try substring matching for common priority keywords
        const priorityKeywords = {
          'high': ['high', 'urgent', 'critical', 'p0', 'p1'],
          'medium': ['medium', 'normal', 'moderate', 'p2'],
          'low': ['low', 'minor', 'p3', 'p4']
        };
        
        const targetKeywords = priorityKeywords[normalizedPriority as keyof typeof priorityKeywords] || [normalizedPriority];
        
        matchingOption = options.find((opt: any) => {
          const normalized = normalizeOptionName(opt.name);
          return targetKeywords.some(keyword => normalized.includes(keyword));
        });
      }
      
      if (matchingOption) {
        properties[propName] = {
          "select": {
            "name": matchingOption.name // Use original name with emoji/decoration
          }
        };
      }
      // If no match found, skip the priority field rather than failing
    }
  }

  // Optionally add due date if database has a date property
  if (dueDate) {
    const dateProp = Object.entries(dbProperties).find(([name, prop]: any) => 
      prop.type === 'date' && (name.toLowerCase().includes('due') || name.toLowerCase().includes('date'))
    );
    if (dateProp) {
      properties[dateProp[0]] = {
        "date": {
          "start": dueDate
        }
      };
    }
  }

  // Optionally add assignee if database has appropriate property
  if (assignee) {
    const assigneeProp = Object.entries(dbProperties).find(([name, prop]: any) => 
      (prop.type === 'rich_text' || prop.type === 'people') && name.toLowerCase().includes('assign')
    );
    if (assigneeProp) {
      const [propName, propDef]: any = assigneeProp;
      if (propDef.type === 'rich_text') {
        properties[propName] = {
          "rich_text": [
            {
              "text": {
                "content": assignee
              }
            }
          ]
        };
      }
      // Note: 'people' type requires user IDs, which we don't have
    }
  }

  const payload = {
    parent: {
      database_id: databaseId
    },
    properties
  };

  return await notionRequest('/pages', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function queryNotionDatabase(databaseId: string, filter?: any) {
  const payload: any = {};
  
  if (filter) {
    payload.filter = filter;
  }

  return await notionRequest(`/databases/${databaseId}/query`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getNotionPage(pageId: string) {
  return await notionRequest(`/pages/${pageId}`);
}

export async function updateNotionPage(pageId: string, properties: any) {
  return await notionRequest(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties })
  });
}

export async function searchNotion(query: string) {
  return await notionRequest('/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      filter: {
        value: "database",
        property: "object"
      }
    })
  });
}

export async function listNotionDatabases() {
  return await notionRequest('/search', {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        value: "database",
        property: "object"
      },
      page_size: 100
    })
  });
}

export async function getNotionDatabase(databaseId: string) {
  return await notionRequest(`/databases/${databaseId}`);
}

export async function isNotionConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}
