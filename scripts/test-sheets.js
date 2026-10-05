// Helper script to test Google Sheets API connectivity
require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testConnection() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  console.log('\n--- Checking Google Sheets Configuration ---');
  console.log('GOOGLE_SHEET_ID:', sheetId ? '✓ Found' : '✗ Missing');
  console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', email ? `✓ Found (${email})` : '✗ Missing');
  console.log('GOOGLE_PRIVATE_KEY:', privateKey ? '✓ Found' : '✗ Missing');

  if (!email || !privateKey || !sheetId) {
    console.error('\n[Error] Please fill in GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env.local');
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    console.log('\n1. Authenticating with Google Cloud Service Account...');
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('2. Fetching spreadsheet metadata...');
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    console.log(`✓ Successfully connected to spreadsheet: "${meta.data.properties.title}"`);

    const existingSheets = (meta.data.sheets || []).map((s) => s.properties.title);
    console.log('Existing tabs in sheet:', existingSheets);

    const requiredTabs = ['Users', 'Locations', 'Employees', 'Attendance', 'Supervisor Attendance'];
    const missingTabs = requiredTabs.filter((tab) => !existingSheets.includes(tab));

    if (missingTabs.length > 0) {
      console.log(`\n3. Creating missing tabs: ${missingTabs.join(', ')}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: missingTabs.map((title) => ({
            addSheet: { properties: { title } },
          })),
        },
      });
      console.log('✓ Missing tabs created successfully!');
    } else {
      console.log('\n✓ All 5 required tabs already exist.');
    }

    console.log('\n🎉 SUCCESS! Your Google Sheets database is properly configured and ready to use.\n');
  } catch (err) {
    console.error('\n[Error] Failed to connect to Google Sheets:');
    if (err.message && err.message.includes('permission')) {
      console.error('Permission denied! Did you share the Google Sheet with Editor permission to:');
      console.error(email);
    } else {
      console.error(err.message || err);
    }
    process.exit(1);
  }
}

testConnection();
