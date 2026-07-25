/**
 * SELFCARE DIAGNOSTICS - BACKEND ENGINE (Google Apps Script)
 * Brand: SELFCARE DIAGNOSTICS | Empowering Wellness
 * Handles Sheet Auto-Provisioning, Booking Records, Patient Tracking & Data Sync
 */

// Global Sheet Names Configuration
const SHEETS = {
  BOOKINGS: 'Bookings',
  PATIENTS: 'Patients',
  TESTS: 'Tests',
  PACKAGES: 'Packages',
  SETTINGS: 'Settings'
};

/**
 * Auto-initializes Google Spreadsheet structure with required schemas and default inventory data
 */
function autoInitializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Bookings Sheet
  setupSheet(ss, SHEETS.BOOKINGS, [
    'Booking ID', 'Booking Date', 'Booking Time', 'Patient Name', 'Age', 'Gender',
    'Mobile', 'Email', 'Address', 'Pincode', 'Collection Type', 'Preferred Date',
    'Preferred Time', 'Payment Method', 'Tests', 'Packages', 'Subtotal', 'Discount',
    'GST', 'Total Amount', 'Booking Status', 'Created At', 'Updated At'
  ]);

  // 2. Setup Patients Sheet
  setupSheet(ss, SHEETS.PATIENTS, [
    'Patient ID', 'Patient Name', 'Age', 'Gender', 'Mobile', 'Email',
    'Address', 'Pincode', 'Total Bookings', 'Last Booking ID', 'Created At'
  ]);

  // 3. Setup Tests Sheet
  setupSheet(ss, SHEETS.TESTS, [
    'Test ID', 'Test Name', 'Category', 'MRP', 'Offer Price',
    'Preparation', 'Sample Type', 'Report Time', 'Status'
  ]);

  // 4. Setup Packages Sheet
  setupSheet(ss, SHEETS.PACKAGES, [
    'Package ID', 'Package Name', 'MRP', 'Offer Price',
    'Tests Included', 'Status'
  ]);

  // 5. Setup Settings Sheet
  setupSheet(ss, SHEETS.SETTINGS, ['Setting Key', 'Setting Value', 'Description']);

  seedInitialData(ss);
}

/**
 * Creates sheet if missing and sets up header formatting
 */
function setupSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#00875A'); // Selfcare Primary Green
    headerRange.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
}

/**
 * Pre-populates default lab tests and packages if empty
 */
function seedInitialData(ss) {
  const testsSheet = ss.getSheetByName(SHEETS.TESTS);
  if (testsSheet.getLastRow() === 1) {
    testsSheet.appendRow(['TST-001', 'Complete Blood Count (CBC)', 'General', 600, 399, 'No special preparation', 'Whole Blood', '6 Hours', 'Active']);
    testsSheet.appendRow(['TST-002', 'HbA1c Diabetes Test', 'Diabetes', 700, 450, 'Fasting not required', 'Whole Blood', 'Same Day', 'Active']);
    testsSheet.appendRow(['TST-003', 'Thyroid Profile Total (T3, T4, TSH)', 'Thyroid', 900, 499, 'Overnight fasting required', 'Serum', '24 Hours', 'Active']);
    testsSheet.appendRow(['TST-004', 'Lipid Profile Comprehensive', 'Heart', 1200, 699, '10-12 hrs fasting mandatory', 'Serum', '12 Hours', 'Active']);
  }

  const pkgSheet = ss.getSheetByName(SHEETS.PACKAGES);
  if (pkgSheet.getLastRow() === 1) {
    pkgSheet.appendRow(['PKG-001', 'Basic Health Checkup', 2500, 999, 'CBC, Fasting Blood Sugar, KFT, Urine Analysis', 'Active']);
    pkgSheet.appendRow(['PKG-002', 'Selfcare Prime Full Body', 4900, 1799, 'CBC, HbA1c, Thyroid Profile, LFT, Lipid Profile', 'Active']);
  }
}

/**
 * Handles incoming POST requests (New Bookings, Patient Registration)
 */
function doPost(e) {
  try {
    autoInitializeDatabase();
    const payload = JSON.parse(e.postData.contents);
    
    const result = processNewBooking(payload);
    
    return responseJSON({
      success: true,
      bookingId: result.bookingId,
      message: "Booking Saved Successfully"
    });
  } catch (error) {
    return responseJSON({
      success: false,
      message: error.toString()
    });
  }
}

/**
 * Handles incoming GET requests (Sync Tests, Packages, Bookings Status)
 */
function doGet(e) {
  autoInitializeDatabase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action || 'getInventory';

  if (action === 'getInventory') {
    const tests = getSheetDataAsObjects(ss.getSheetByName(SHEETS.TESTS));
    const packages = getSheetDataAsObjects(ss.getSheetByName(SHEETS.PACKAGES));
    return responseJSON({ success: true, tests: tests, packages: packages });
  }

  return responseJSON({ success: true, message: 'Selfcare Diagnostics Apps Script Service Running' });
}

/**
 * Records booking entry in 'Bookings' sheet and creates/updates patient record in 'Patients' sheet
 */
function processNewBooking(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bookingsSheet = ss.getSheetByName(SHEETS.BOOKINGS);
  const now = new Date();
  const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  const bookingId = data.bookingId || ('SEL-' + Math.floor(100000 + Math.random() * 900000));
  
  const testsList = data.tests || "";
  const packagesList = data.packages || "";

  // 1. Insert into Bookings Sheet
  bookingsSheet.appendRow([
    bookingId,
    data.bookingDate || '',
    data.bookingTime || '',
    data.patientName || '',
    data.age || '',
    data.gender || '',
    data.mobile || '',
    data.email || '',
    data.address || '',
    data.pincode || '',
    data.collectionType || 'Home Collection',
    data.preferredDate || '',
    data.preferredTime || '',
    data.paymentMethod || 'Cash on Collection',
    testsList,
    packagesList,
    data.subtotal || 0,
    data.discount || 0,
    data.gst || 0,
    data.totalAmount || 0,
    data.bookingStatus || 'Pending',
    timestamp,
    timestamp
  ]);

  // 2. Sync Patient Entry in Patients Sheet
  syncPatientRecord(ss, data, bookingId, timestamp);

  return { bookingId: bookingId };
}

/**
 * Creates a new patient or updates existing booking counts based on Mobile Number
 */
function syncPatientRecord(ss, data, bookingId, timestamp) {
  const patientsSheet = ss.getSheetByName(SHEETS.PATIENTS);
  const mobile = String(data.mobile || '').trim();
  if (!mobile) return;

  const pData = patientsSheet.getDataRange().getValues();
  let patientRowIndex = -1;
  let currentTotalBookings = 0;

  for (let i = 1; i < pData.length; i++) {
    if (String(pData[i][4]).trim() === mobile) {
      patientRowIndex = i + 1;
      currentTotalBookings = Number(pData[i][8]) || 0;
      break;
    }
  }

  if (patientRowIndex > -1) {
    // Update existing patient record
    patientsSheet.getRange(patientRowIndex, 2).setValue(data.patientName || pData[patientRowIndex - 1][1]);
    patientsSheet.getRange(patientRowIndex, 3).setValue(data.age || pData[patientRowIndex - 1][2]);
    patientsSheet.getRange(patientRowIndex, 4).setValue(data.gender || pData[patientRowIndex - 1][3]);
    patientsSheet.getRange(patientRowIndex, 7).setValue(data.address || pData[patientRowIndex - 1][6]);
    patientsSheet.getRange(patientRowIndex, 8).setValue(data.pincode || pData[patientRowIndex - 1][7]);
    patientsSheet.getRange(patientRowIndex, 9).setValue(currentTotalBookings + 1);
    patientsSheet.getRange(patientRowIndex, 10).setValue(bookingId);
  } else {
    // Create new patient record
    const patientId = 'PAT-' + Math.floor(10000 + Math.random() * 90000);
    patientsSheet.appendRow([
      patientId,
      data.patientName || '',
      data.age || '',
      data.gender || '',
      mobile,
      data.email || '',
      data.address || '',
      data.pincode || '',
      1,
      bookingId,
      timestamp
    ]);
  }
}

/**
 * Helper: Converts Sheet data to JSON Object array
 */
function getSheetDataAsObjects(sheet) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const results = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    results.push(obj);
  }
  return results;
}

/**
 * Helper: Formats JSON response output for CORS web requests
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
