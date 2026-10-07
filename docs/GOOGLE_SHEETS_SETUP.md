# Connecting "Book a Demo" Signups to Google Sheets

SellDesk automatically records all "Book a Demo" form submissions. You can connect it to a live Google Sheet in under 2 minutes so all requests appear automatically in your spreadsheet.

---

### Step 1: Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it e.g. **SellDesk Demo Signups**.
3. (Optional) In the first row, name your columns:
   - **A1**: `Timestamp`
   - **B1**: `Full Name`
   - **C1**: `Work Email`
   - **D1**: `Company`
   - **E1**: `Message`

---

### Step 2: Add Google Apps Script

1. In your Google Sheet, click **Extensions** in the top menu → **Apps Script**.
2. Replace whatever is in the script editor (`Code.gs`) with this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-create header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Full Name", "Work Email", "Company", "Message"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name || "",
      data.email || "",
      data.company || "",
      data.message || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Click the **Save** icon (💾) or press `Cmd + S` / `Ctrl + S`.

---

### Step 3: Deploy as Web App

1. In the top right of Apps Script, click **Deploy** → **New deployment**.
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**.
3. Configure the fields:
   - **Description**: `SellDesk Demo Webhook`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **Anyone** *(Important: Choose "Anyone" so submissions from your website can reach the sheet)*
4. Click **Deploy**.
5. Grant permissions if prompted by Google (click *Advanced* → *Go to Untitled project (unsafe)* → *Allow*).
6. Copy the **Web app URL** (starts with `https://script.google.com/macros/s/.../exec`).

---

### Step 4: Add URL to SellDesk

1. Create a `.env` file in the project root (or copy `.env.example` to `.env`):
   ```bash
   VITE_GOOGLE_SHEETS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
2. For Vercel: Add `VITE_GOOGLE_SHEETS_URL` to your **Vercel Project Settings → Environment Variables**.

---

### Local Offline Backup

SellDesk also automatically stores every submission in browser `localStorage`.
You can view all locally saved signups anytime in your browser DevTools Console by running:

```javascript
getSellDeskSignups()
```

