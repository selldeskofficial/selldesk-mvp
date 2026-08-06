const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const FREE_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-20b:free',
  'qwen/qwen3-coder:free',
]

// ── Extended keyword lists for flexible column matching ──────────────
// Keywords are ORDERED BY PRIORITY — most specific/common first.
// findCol iterates keywords in this order, so 'item' matches before 'category'.

// Keywords that indicate a column containing item/product names
const ITEM_KEYWORDS = [
  // Primary — most specific product-name indicators
  'item', 'product', 'dish', 'menu', 'sku',
  // Secondary — common alternatives
  'name', 'title', 'description', 'article', 'goods', 'merchandise',
  // Tertiary — broader labels that could be item names
  'category', 'categories', 'content', 'contents', 'service', 'services',
  'label', 'type', 'offering', 'food', 'beverage', 'drink', 'coffee',
  'entry', 'listing', 'particular', 'commodity', 'stock', 'inventory',
  'material', 'thing', 'object', 'package', 'bundle', 'plan',
  'subscription', 'course', 'variant',
  // POS / restaurant — lowest priority (usually grouping columns, not item names)
  'restaurant', 'outlet', 'store', 'branch', 'location', 'group',
]

// Keywords that indicate a column containing price/monetary values
const PRICE_KEYWORDS = [
  // Primary — unmistakable price indicators
  'price', 'amount', 'total', 'mrp', 'revenue',
  // Secondary — common alternatives
  'rate', 'value', 'sale', 'money', 'fee', 'charge', 'billing',
  'income', 'earning', 'proceeds', 'payment', 'receipt',
  // Tertiary — less common
  'tariff', 'fare', 'toll', 'premium', 'gross', 'net', 'turnover',
  'figure', 'sum', 'worth', 'retail', 'wholesale', 'selling', 'sp',
  'unit_price', 'unitprice', 'tag',
  'rupee', 'rupees', 'inr', 'dollar', 'usd', '₹', '$',
]

// Keywords that indicate a column containing quantity/units sold
const SOLD_KEYWORDS = [
  'sold', 'qty', 'quantity', 'units', 'count', 'volume', 'number',
  'pieces', 'pcs', 'nos', 'orders', 'transactions', 'demand',
  'consumption', 'usage', 'frequency', 'occurrence', 'times',
  'weekly', 'monthly', 'daily', 'annual', 'sales_count',
]

// Keywords that indicate a column containing cost/expense values
const COST_KEYWORDS = [
  'cost', 'cogs', 'expense', 'buying', 'purchase', 'procurement',
  'spend', 'spending', 'outlay', 'expenditure', 'investment',
  'acquisition', 'material_cost', 'production', 'manufacturing',
  'overhead', 'cp', 'base_price', 'baseprice', 'cost_price',
]

// Keywords that indicate a date column
const DATE_KEYWORDS = [
  'date', 'time', 'day', 'period', 'month', 'year', 'week',
  'timestamp', 'datetime', 'created', 'updated', 'when', 'on',
]

// Columns to skip — these are identifiers, not useful data
const SKIP_KEYWORDS = [
  'code', 'id', 'sap', 'barcode', 'serial', 'ref', 'reference',
  'index', 'sr', 'sno', 's.no', 'sl',
]

// Keywords that indicate this is NOT business/sales data — used for rejection
const NON_BUSINESS_KEYWORDS = [
  'latitude', 'longitude', 'lat', 'lng', 'lon', 'elevation', 'altitude',
  'temperature', 'humidity', 'weather', 'precipitation', 'wind',
  'grade', 'marks', 'score', 'gpa', 'attendance', 'exam', 'semester',
  'genome', 'dna', 'rna', 'chromosome', 'gene', 'protein', 'sequence',
  'pixel', 'resolution', 'rgb', 'hex', 'saturation', 'brightness',
  'velocity', 'acceleration', 'mass', 'force', 'voltage', 'ampere',
  'patient', 'diagnosis', 'symptom', 'prescription', 'dosage', 'blood',
  'sepal', 'petal', 'species', 'genus', 'kingdom', 'phylum',
  'earthquake', 'magnitude', 'richter', 'epicenter', 'tectonic',
  'orbit', 'planet', 'star', 'galaxy', 'constellation', 'redshift',
]

// ── Helpers ──────────────────────────────────────────────────────────

// Properly parse a single CSV line — handles quoted fields with commas inside
function parseCSVLine(line) {
  const cols = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim().replace(/^₹/, ''))
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur.trim().replace(/^₹/, ''))
  return cols
}

// Case-insensitive column index lookup
function colIdx(headers, name) {
  if (!name) return -1
  const lower = name.trim().toLowerCase()
  return headers.findIndex(h => h.trim().toLowerCase() === lower)
}

// Check if a value looks numeric (price/quantity-like)
function looksNumeric(val) {
  if (!val || typeof val !== 'string') return false
  const cleaned = val.replace(/[₹$,\s]/g, '')
  return cleaned !== '' && !isNaN(parseFloat(cleaned))
}

// Check if a value looks like a text label (item name-like)
function looksTextual(val) {
  if (!val || typeof val !== 'string') return false
  const trimmed = val.trim()
  if (trimmed === '') return false
  // Reject if it's purely numeric
  if (!isNaN(parseFloat(trimmed.replace(/[₹$,\s]/g, '')))) return false
  // Accept if it contains letters
  return /[a-zA-Z\u0900-\u097F\u0980-\u09FF]/.test(trimmed)
}

// ── Business-relevance validation ────────────────────────────────────

function isBusinessRelated(headers, sampleRows) {
  const allHeaders = headers.map(h => h.toLowerCase().trim())

  // Count how many headers match non-business keywords
  let nonBizHits = 0
  for (const h of allHeaders) {
    if (NON_BUSINESS_KEYWORDS.some(kw => h.includes(kw))) nonBizHits++
  }

  // If majority of columns are non-business, reject
  if (nonBizHits >= Math.ceil(allHeaders.length * 0.5)) {
    return { valid: false, reason: 'This dataset doesn\'t look like business or sales data. Selldesk works with product, sales, and pricing data.' }
  }

  // Check if there's at least one text column and one numeric column in data
  if (sampleRows.length > 0) {
    const colCount = sampleRows[0].length
    let hasTextCol = false
    let hasNumCol  = false

    for (let c = 0; c < colCount; c++) {
      const colVals = sampleRows.map(r => r[c]).filter(Boolean)
      const textRatio = colVals.filter(looksTextual).length / Math.max(colVals.length, 1)
      const numRatio  = colVals.filter(looksNumeric).length / Math.max(colVals.length, 1)
      if (textRatio >= 0.5) hasTextCol = true
      if (numRatio  >= 0.5) hasNumCol  = true
    }

    if (!hasTextCol && !hasNumCol) {
      return { valid: false, reason: 'Could not find recognizable item names or numeric values in this dataset.' }
    }
    if (!hasTextCol) {
      return { valid: false, reason: 'No item/product name column detected. Selldesk needs at least one column with text labels (product names, categories, etc.).' }
    }
    if (!hasNumCol) {
      return { valid: false, reason: 'No numeric column detected. Selldesk needs at least one column with prices, amounts, or quantities.' }
    }
  }

  return { valid: true }
}

// ── AI mapping ───────────────────────────────────────────────────────

async function inferMapping(headers, sampleRows) {
  const prompt = `You are a data analyst. I have a CSV with these columns:
${headers.join(', ')}

Sample rows:
${sampleRows.map(r => r.join(', ')).join('\n')}

First, determine if this data is business/sales/product/pricing related. If it is clearly NOT business data (e.g. weather, scientific, medical, academic data), respond with:
{"rejected":true,"reason":"brief explanation"}

Otherwise, identify the best column for each field. Use the EXACT column name as it appears above. Be flexible — column names may not be standard. Look for columns that CONTAIN item labels (could be called category, content, type, service, etc.) and columns with monetary values (could be called total, amount, fee, charge, etc.).
- item_col: which column contains the product/item/category/service name?
- price_col: which column contains the price, amount, total, or monetary value?
- sold_col: which column contains units sold count? (null if each row is one sale)
- cost_col: which column contains cost/expense? (null if not present)
- date_col: which column contains the date? (null if not present)
- format: "transaction" if each row = 1 sale, "summary" if each row = 1 product with totals

Respond ONLY with JSON, no markdown, no explanation:
{"format":"transaction","item_col":"exact_name","price_col":"exact_name","sold_col":null,"cost_col":null,"date_col":"exact_name"}`

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      const match = text.match(/\{[\s\S]*?\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        // If AI says it's not business data, propagate the rejection
        if (parsed.rejected) return { rejected: true, reason: parsed.reason }
        // Validate that at least item_col and price_col are present
        if (parsed.item_col && parsed.price_col) return parsed
      }
    } catch {
      continue
    }
  }
  return null
}

// ── Heuristic fallback — expanded keyword matching ───────────────────

function heuristicMapping(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())

  // Pre-mark identifier/code columns as used so they never get matched
  const usedIndices = new Set()
  for (let i = 0; i < lower.length; i++) {
    // Skip columns that are purely identifiers (code, sap code, barcode, etc.)
    const h = lower[i]
    const isSkip = SKIP_KEYWORDS.some(kw => h === kw || h.includes(kw))
    // Only skip if the column doesn't ALSO match a business keyword
    const isBiz = [...ITEM_KEYWORDS, ...PRICE_KEYWORDS, ...SOLD_KEYWORDS, ...COST_KEYWORDS]
      .some(kw => h === kw)
    if (isSkip && !isBiz) usedIndices.add(i)
  }

  // findCol: iterates KEYWORDS in priority order, then scans all headers.
  // This ensures 'item' (high priority) matches "Item" column before
  // 'category' (lower priority) could grab "Category".
  const findCol = (keywords) => {
    // Priority 1: exact match, checking keywords in priority order
    for (const kw of keywords) {
      for (let i = 0; i < lower.length; i++) {
        if (usedIndices.has(i)) continue
        if (lower[i] === kw) {
          usedIndices.add(i)
          return headers[i]
        }
      }
    }
    // Priority 2: substring match, checking keywords in priority order
    for (const kw of keywords) {
      for (let i = 0; i < lower.length; i++) {
        if (usedIndices.has(i)) continue
        if (lower[i].includes(kw)) {
          usedIndices.add(i)
          return headers[i]
        }
      }
    }
    return null
  }

  // Order matters — item first so it doesn't get grabbed by price keywords like "total"
  const item  = findCol(ITEM_KEYWORDS)
  const price = findCol(PRICE_KEYWORDS)
  const sold  = findCol(SOLD_KEYWORDS)
  const cost  = findCol(COST_KEYWORDS)
  const date  = findCol(DATE_KEYWORDS)

  return {
    format:    sold ? 'summary' : 'transaction',
    item_col:  item,
    price_col: price,
    sold_col:  sold,
    cost_col:  cost,
    date_col:  date,
  }
}

// ── Smart positional fallback — infer columns from data content ──────

function smartPositionalMapping(headers, sampleRows) {
  const colCount = headers.length
  if (colCount < 2 || sampleRows.length === 0) return null

  // Analyze each column to determine if it's text-dominant or numeric-dominant
  const colProfiles = []
  for (let c = 0; c < colCount; c++) {
    const vals = sampleRows.map(r => r[c]).filter(Boolean)
    const textCount = vals.filter(looksTextual).length
    const numCount  = vals.filter(looksNumeric).length
    const total     = Math.max(vals.length, 1)
    colProfiles.push({
      index: c,
      header: headers[c],
      textRatio: textCount / total,
      numRatio:  numCount / total,
    })
  }

  // Pick the first text-dominant column as the item column
  const itemCol = colProfiles.find(p => p.textRatio >= 0.5)
  if (!itemCol) return null

  // Among remaining numeric columns, pick the best price candidate
  const numCols = colProfiles.filter(p => p.numRatio >= 0.5 && p.index !== itemCol.index)
  if (numCols.length === 0) return null

  // The first numeric column is most likely the primary value (price/total/amount)
  const priceCol = numCols[0]
  const soldCol  = numCols.length >= 2 ? numCols[1] : null
  const costCol  = numCols.length >= 3 ? numCols[2] : null

  return {
    format:    soldCol ? 'summary' : 'transaction',
    item_col:  itemCol.header,
    price_col: priceCol.header,
    sold_col:  soldCol?.header ?? null,
    cost_col:  costCol?.header ?? null,
    date_col:  null,
  }
}

// ── Row parsers ──────────────────────────────────────────────────────

function aggregateTransactions(dataLines, headers, mapping) {
  const itemIdx  = colIdx(headers, mapping.item_col)
  const priceIdx = colIdx(headers, mapping.price_col)
  const dateIdx  = colIdx(headers, mapping.date_col)

  if (itemIdx === -1) return { rows: [], weeks: 1 }

  const map   = {}
  const dates = []

  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    const item  = cols[itemIdx]?.trim()
    const money = priceIdx !== -1 ? parseFloat(cols[priceIdx]) : NaN
    const date  = dateIdx  !== -1 ? new Date(cols[dateIdx])    : null

    if (!item) continue
    if (!map[item]) map[item] = { total: 0, count: 0 }
    map[item].count++
    if (!isNaN(money)) map[item].total += money
    if (date && !isNaN(date.getTime())) dates.push(date)
  }

  let weeks = 1
  if (dates.length >= 2) {
    const span = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
    weeks = Math.max(1, Math.round(span / 7))
  }

  const rows = Object.entries(map)
    .filter(([, { count }]) => count > 0)
    .map(([item, { total, count }]) => ({
      id:    crypto.randomUUID(),
      item,
      sold:  Math.max(1, Math.round(count / weeks)),
      price: total > 0 ? Math.round(total / count) : 0,
      cost:  0,
    }))

  return { rows, weeks }
}

function parseSummary(dataLines, headers, mapping) {
  const iIdx = colIdx(headers, mapping.item_col)  !== -1 ? colIdx(headers, mapping.item_col)  : 0
  const sIdx = colIdx(headers, mapping.sold_col)  !== -1 ? colIdx(headers, mapping.sold_col)  : 1
  const pIdx = colIdx(headers, mapping.price_col) !== -1 ? colIdx(headers, mapping.price_col) : 2
  const cIdx = colIdx(headers, mapping.cost_col)  !== -1 ? colIdx(headers, mapping.cost_col)  : 3

  const rows = []
  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    const item  = cols[iIdx]?.trim()
    const sold  = parseFloat(cols[sIdx])
    const price = parseFloat(cols[pIdx])
    const cost  = parseFloat(cols[cIdx])
    if (!item || isNaN(sold) || isNaN(price)) continue
    rows.push({ id: crypto.randomUUID(), item, sold, price, cost: isNaN(cost) ? 0 : cost })
  }
  return rows
}

// ── Main export ──────────────────────────────────────────────────────

// Detect preamble/metadata lines and find the actual header row.
// Many POS / report exports prepend lines like:
//   Start Date:, 1 Jun 2026
//   End Date:, 30 Jun 2026
//   (blank)
//   Restaurant, Group Name, Category, Item, ...   ← real header
function findHeaderRow(lines) {
  if (lines.length === 0) return 0

  // Parse every line so we can compare column counts
  const parsed = lines.slice(0, Math.min(lines.length, 30)).map(parseCSVLine)

  // The most common column count among lines with ≥ 2 columns is likely the table width
  const colCounts = parsed.map(p => p.length).filter(c => c >= 2)
  if (colCounts.length === 0) return 0

  const freq = {}
  for (const c of colCounts) freq[c] = (freq[c] || 0) + 1
  const tableWidth = parseInt(
    Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
  )

  for (let i = 0; i < parsed.length; i++) {
    const cols = parsed[i]
    const nonEmpty = cols.filter(c => c.trim() !== '').length

    // Skip lines with too few non-empty columns compared to the table width
    if (nonEmpty < Math.max(2, Math.floor(tableWidth * 0.4))) continue

    // Skip lines that look like key:value metadata ("Start Date:", "Report:", etc.)
    const firstCol = cols[0]?.trim() || ''
    if (firstCol.endsWith(':') && nonEmpty <= 2) continue

    // Skip lines that are purely numeric (totals/summary rows before data)
    const allNumeric = cols.filter(c => c.trim()).every(c => looksNumeric(c))
    if (allNumeric) continue

    // Skip lines where ALL populated cells are numeric (no text labels = not a header)
    const textCells = cols.filter(c => c.trim() && looksTextual(c))
    if (textCells.length === 0) continue

    // This line has enough columns, has text labels, and isn't metadata → it's the header
    // Extra validation: check that the NEXT line has a similar column count (data follows)
    if (i + 1 < parsed.length) {
      const nextNonEmpty = parsed[i + 1].filter(c => c.trim() !== '').length
      if (nextNonEmpty >= Math.max(2, Math.floor(nonEmpty * 0.5))) {
        return i
      }
    }

    // If there's no next line to validate, still use this one
    return i
  }

  return 0 // fallback: first line is the header
}

export async function parseCSV(text) {
  const allLines  = text.trim().split(/\r?\n/)
  const nonEmpty  = allLines.filter(l => l.trim())
  if (nonEmpty.length === 0) return { rows: [], warning: null }

  // Strip UTF-8 BOM if present
  nonEmpty[0] = nonEmpty[0].replace(/^﻿/, '')

  // Find the real header row (skip preamble metadata)
  const headerIdx = findHeaderRow(nonEmpty)
  const headerLine = nonEmpty[headerIdx]
  const headers   = parseCSVLine(headerLine)
  const dataLines = nonEmpty.slice(headerIdx + 1)
  const sampleRows = dataLines.slice(0, 5).map(parseCSVLine)

  // 0. Business-relevance check
  const bizCheck = isBusinessRelated(headers, sampleRows)
  if (!bizCheck.valid) {
    return { rows: [], warning: null, rejected: true, rejectedReason: bizCheck.reason }
  }

  // 1. Try AI mapping
  let mapping = null
  if (API_KEY) mapping = await inferMapping(headers, sampleRows)

  // If AI explicitly rejected the data as non-business
  if (mapping?.rejected) {
    return {
      rows: [], warning: null, rejected: true,
      rejectedReason: mapping.reason || 'This dataset doesn\'t appear to be business or sales data.',
    }
  }

  // 2. Heuristic fallback
  if (!mapping || !mapping.item_col || !mapping.price_col) {
    mapping = heuristicMapping(headers)
  }

  // 3. Smart positional fallback if heuristic couldn't find item+price
  if (!mapping.item_col || !mapping.price_col) {
    const smart = smartPositionalMapping(headers, sampleRows)
    if (smart) mapping = smart
  }

  const isTransaction = mapping.format === 'transaction' || !mapping.sold_col

  // 4. Parse
  let rows, weeks
  if (isTransaction) {
    ({ rows, weeks } = aggregateTransactions(dataLines, headers, mapping))
  } else {
    rows  = parseSummary(dataLines, headers, mapping)
    weeks = null
  }

  // 5. If still empty, try smart positional as last resort
  if (rows.length === 0) {
    const smart = smartPositionalMapping(headers, sampleRows)
    if (smart) {
      mapping = smart
      if (smart.sold_col) {
        rows = parseSummary(dataLines, headers, mapping)
      } else {
        ({ rows, weeks } = aggregateTransactions(dataLines, headers, mapping))
      }
    }
  }

  // 6. Absolute last resort: old positional fallback
  if (rows.length === 0) {
    mapping = { format: 'summary', item_col: headers[0], sold_col: headers[1], price_col: headers[2], cost_col: headers[3] }
    rows = parseSummary(dataLines, headers, mapping)
  }

  const costMissing = !mapping.cost_col || rows.every(r => r.cost === 0)
  const warning = costMissing && rows.length > 0
    ? `Cost column not found — all costs set to ₹0. Please fill them in before analysing.`
    : null

  const weekNote = isTransaction && weeks
    ? `Detected transaction data — ${rows.length} items aggregated over ~${weeks} week${weeks !== 1 ? 's' : ''}. ${warning ?? ''}`
    : warning

  return { rows, isTransaction, weeks, warning: weekNote }
}
