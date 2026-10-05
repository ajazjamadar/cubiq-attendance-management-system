import { google } from 'googleapis';
import {
  User,
  SiteLocation,
  Employee,
  AttendanceRecord,
  SupervisorAttendanceRecord,
} from '@/types';

// Tab names
export const TABS = {
  USERS: 'Users',
  LOCATIONS: 'Locations',
  EMPLOYEES: 'Employees',
  ATTENDANCE: 'Attendance',
  SUPERVISOR_ATTENDANCE: 'Supervisor Attendance',
};

// Standard column headers for each tab
export const TAB_HEADERS = {
  [TABS.USERS]: ['User ID', 'Name', 'Role', 'Username', 'Password Hash', 'Status'],
  [TABS.LOCATIONS]: [
    'Location ID',
    'Location Name',
    'Address',
    'Latitude',
    'Longitude',
    'Radius',
    'Supervisor ID',
  ],
  [TABS.EMPLOYEES]: ['Employee ID', 'Name', 'Phone', 'Designation', 'Location ID', 'Status'],
  [TABS.ATTENDANCE]: [
    'Attendance ID',
    'Employee ID',
    'Name',
    'Date',
    'Check In',
    'Check Out',
    'Latitude',
    'Longitude',
    'Status',
  ],
  [TABS.SUPERVISOR_ATTENDANCE]: [
    'Attendance ID',
    'Supervisor ID',
    'Name',
    'Date',
    'Check In',
    'Check Out',
    'Latitude',
    'Longitude',
  ],
};

/**
 * Returns authenticated Google Sheets client or null if credentials are not configured.
 */
export function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    return null;
  }

  // Handle escaped newlines in environment variable
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, sheetId };
  } catch (err) {
    console.error('Failed to initialize Google Sheets client:', err);
    return null;
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return getGoogleSheetsClient() !== null;
}

/**
 * Initializes the spreadsheet: creates required tabs if they do not exist
 * and sets up header columns.
 */
export async function initializeSpreadsheetTabs(): Promise<boolean> {
  const client = getGoogleSheetsClient();
  if (!client) return false;

  const { sheets, sheetId } = client;

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingSheets = (meta.data.sheets || []).map((s) => s.properties?.title || '');

    const sheetsToCreate = Object.values(TABS).filter((tab) => !existingSheets.includes(tab));

    if (sheetsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: sheetsToCreate.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      });
    }

    // Check headers for all tabs
    for (const [tab, headers] of Object.entries(TAB_HEADERS)) {
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${tab}!A1:Z1`,
      });

      const currentHeaders = resp.data.values?.[0] || [];
      if (currentHeaders.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tab}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] },
        });
      }
    }

    return true;
  } catch (err) {
    console.error('Error initializing Google Sheets tabs:', err);
    return false;
  }
}

/**
 * Read all rows from a tab (excluding header row)
 */
export async function readTabRows(tabName: string): Promise<string[][]> {
  const client = getGoogleSheetsClient();
  if (!client) throw new Error('Google Sheets client not configured');

  const { sheets, sheetId } = client;
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A2:Z`,
  });

  return (resp.data.values as string[][]) || [];
}

/**
 * Append a row to a tab
 */
export async function appendTabRow(tabName: string, rowValues: any[]): Promise<void> {
  const client = getGoogleSheetsClient();
  if (!client) throw new Error('Google Sheets client not configured');

  const { sheets, sheetId } = client;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues],
    },
  });
}

/**
 * Update an existing row in a tab (rowNumber is 1-indexed, matching Google Sheets row index)
 */
export async function updateTabRow(
  tabName: string,
  rowNumber: number,
  rowValues: any[]
): Promise<void> {
  const client = getGoogleSheetsClient();
  if (!client) throw new Error('Google Sheets client not configured');

  const { sheets, sheetId } = client;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tabName}!A${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [rowValues],
    },
  });
}
