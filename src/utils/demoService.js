const STORAGE_KEY = 'selldesk_demo_signups'

/**
 * Saves a Book a Demo signup locally and dispatches to Google Sheets webhook if configured.
 * @param {{ name: string, email: string, company: string, message: string }} data
 * @returns {Promise<{ success: boolean, record: object, syncedToGoogleSheets: boolean, error?: string }>}
 */
export async function saveDemoSubmission(data) {
  const record = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: (data.name || '').trim(),
    email: (data.email || '').trim(),
    company: (data.company || '').trim(),
    message: (data.message || '').trim(),
    submittedAt: new Date().toISOString(),
  }

  // 1. Always store locally in localStorage so signups are never lost
  try {
    const existing = getStoredSignups()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (err) {
    console.warn('[SellDesk] Could not write to localStorage:', err)
  }

  // 2. Dispatch to Google Sheets Webhook if configured
  const sheetWebhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL

  if (!sheetWebhookUrl) {
    console.info(
      '[SellDesk] Demo signup saved locally. To sync live with Google Sheets, set VITE_GOOGLE_SHEETS_URL in your .env file.'
    )
    return { success: true, record, syncedToGoogleSheets: false }
  }

  try {
    // Note: Google Apps Script Web App redirects on POST.
    // Using mode: 'no-cors' with 'text/plain;charset=utf-8' prevents CORS preflight issues
    // while delivering the exact JSON payload to e.postData.contents in Apps Script.
    await fetch(sheetWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(record),
      mode: 'no-cors',
    })

    return { success: true, record, syncedToGoogleSheets: true }
  } catch (error) {
    console.error('[SellDesk] Failed to send submission to Google Sheets webhook:', error)
    // Even if network fails, the signup is safely recorded locally
    return {
      success: true,
      record,
      syncedToGoogleSheets: false,
      error: error.message || 'Network error while syncing to Google Sheets',
    }
  }
}

/**
 * Returns all locally stored demo signups.
 * @returns {Array<object>}
 */
export function getStoredSignups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn('[SellDesk] Could not read from localStorage:', err)
    return []
  }
}

// Expose on window for easy developer inspection in the browser console
if (typeof window !== 'undefined') {
  window.getSellDeskSignups = getStoredSignups
}
