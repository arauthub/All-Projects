/**
 * WorkspaceCurator Pro - Google Apps Script Universal Webhook Connector
 *
 * HOW TO INSTALL IN GOOGLE WORKSPACE:
 * 1. In Google Docs, Sheets, or Forms, click: Extensions > Apps Script
 * 2. Delete any existing code and paste this entire file.
 * 3. Update CURATOR_WEBHOOK_URL to your public WorkspaceCurator endpoint (or ngrok/tunnel URL).
 * 4. In Apps Script, click: Triggers (alarm clock icon on left) > Add Trigger
 *    - For Google Sheets: Select 'onEdit' or 'onChange' -> Event type: 'On edit' or 'On change'
 *    - For Google Forms: Select 'onFormSubmit' -> Event type: 'On form submit'
 *    - For Google Docs: Use the custom menu 'Workspace Curator > Push Current Doc to Curator'
 */

// Configure your WorkspaceCurator Endpoint
const CURATOR_WEBHOOK_URL = "https://your-domain-or-ngrok.app/api/v1/webhook/google";
const CURATOR_TOKEN = "wk-secret-curator-token";

/**
 * 1. Google Sheets Trigger: Automatically fires when edits are made
 */
function onEdit(e) {
  if (!e) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = sheet.getActiveSheet();
  const range = e.range;
  const user = Session.getActiveUser().getEmail() || "Workspace Collaborator";

  const payload = {
    product: "sheets",
    title: sheet.getName() + " (" + activeSheet.getName() + ")",
    sender: user,
    url: sheet.getUrl(),
    content: "Cell edit in " + activeSheet.getName() + " at " + range.getA1Notation() +
             "\nOld Value: " + (e.oldValue || "[empty]") +
             "\nNew Value: " + (e.value || "[cleared]") +
             "\nActive Row Snapshot: " + activeSheet.getRange(range.getRow(), 1, 1, 10).getValues()[0].join(" | "),
    metadata: {
      spreadsheetId: sheet.getId(),
      sheetName: activeSheet.getName(),
      cell: range.getA1Notation()
    }
  };

  sendToCurator(payload);
}

/**
 * 2. Google Forms Trigger: Automatically fires when a response is submitted
 */
function onFormSubmit(e) {
  if (!e) return;
  const form = FormApp.getActiveForm ? FormApp.getActiveForm() : null;
  const formTitle = form ? form.getName() : "Google Form Submission";
  const itemResponses = e.response.getItemResponses();

  const responses = {};
  for (let i = 0; i < itemResponses.length; i++) {
    const itemResponse = itemResponses[i];
    responses[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  }

  const payload = {
    product: "forms",
    title: formTitle,
    sender: e.response.getRespondentEmail() || "Survey Respondent",
    responses: responses,
    url: form ? form.getEditUrl() : "",
    metadata: {
      responseId: e.response.getId(),
      timestamp: e.response.getTimestamp().toISOString()
    }
  };

  sendToCurator(payload);
}

/**
 * 3. Google Docs Menu: 1-Click push of current document
 */
function onOpen() {
  const ui = DocumentApp.getUi ? DocumentApp.getUi() : (SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null);
  if (ui) {
    ui.createMenu("🚀 Workspace Curator")
      .addItem("Push Document to Curator", "pushActiveDocument")
      .addToUi();
  }
}

function pushActiveDocument() {
  const doc = DocumentApp.getActiveDocument();
  const text = doc.getBody().getText();
  const user = Session.getActiveUser().getEmail() || "Doc Author";

  const payload = {
    product: "docs",
    title: doc.getName(),
    sender: user,
    url: doc.getUrl(),
    content: text,
    metadata: {
      documentId: doc.getId(),
      characterCount: text.length
    }
  };

  const response = sendToCurator(payload);
  DocumentApp.getUi().alert("✅ Document Curated!", "Your document was analyzed and curated successfully:\n" + response, DocumentApp.getUi().ButtonSet.OK);
}

/**
 * Internal helper to dispatch HTTP POST to WorkspaceCurator
 */
function sendToCurator(payload) {
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-Goog-Channel-Token": CURATOR_TOKEN,
      "User-Agent": "Google-Apps-Script-Curator-Client/1.0"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(CURATOR_WEBHOOK_URL, options);
    Logger.log("Curator Response: " + response.getContentText());
    return response.getContentText();
  } catch (err) {
    Logger.log("Error dispatching to WorkspaceCurator: " + err.toString());
    return err.toString();
  }
}
