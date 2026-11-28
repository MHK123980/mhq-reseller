/**
 * Lightweight, zero-dependency courier tracking scraper & cache (Node 22 native fetch).
 * Strict 3.5s timeout + graceful fallback so it never blocks or crashes the server.
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const FETCH_TIMEOUT_MS = 3500;
const trackingCache = new Map();

function stripHtml(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        ...(options.headers || {})
      }
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function detectDelivered(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (lower.includes('not delivered') || lower.includes('undelivered') || lower.includes('failed delivery')) {
    return false;
  }
  return /\bdelivered\b/i.test(lower);
}

async function scrapeTrax(cn) {
  const url = `https://sonic.pk/api/shipment/track?tracking_number=${encodeURIComponent(cn)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data) return null;

  const history = data.tracking_history || data.details?.tracking_history || data.history || [];
  if (Array.isArray(history) && history.length > 0) {
    const events = history.map(item => ({
      status: item.status || item.description || item.remarks || 'Transit Update',
      location: item.city || item.location || item.hub || '',
      timestamp: item.date_time || item.datetime || item.created_at || ''
    }));
    const currentStatus = events[0].status;
    return { currentStatus, events, isDelivered: detectDelivered(currentStatus) };
  }
  if (data.status || data.current_status) {
    const st = String(data.current_status || data.status);
    return {
      currentStatus: st,
      events: [{ status: st, location: data.destination || '', timestamp: '' }],
      isDelivered: detectDelivered(st)
    };
  }
  return null;
}

async function scrapePostEx(cn) {
  const url = `https://api.postex.pk/services/integration/api/order/v1/track-order?trackingNumber=${encodeURIComponent(cn)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || !data.dist) return null;

  const dist = data.dist;
  const history = dist.transactionStatusHistory || [];
  const events = Array.isArray(history)
    ? history.map(h => ({
        status: h.transactionStatusMessage || h.status || 'Update',
        location: h.cityName || '',
        timestamp: h.updatedAt || ''
      })).reverse()
    : [];

  const currentStatus = dist.transactionStatus || (events[0] && events[0].status) || '';
  if (!currentStatus && events.length === 0) return null;

  return {
    currentStatus,
    events: events.length > 0 ? events : [{ status: currentStatus, location: dist.cityName || '', timestamp: '' }],
    isDelivered: detectDelivered(currentStatus)
  };
}

async function scrapeLeopards(cn) {
  const url = `https://www.leopardscourier.com/leopards_tracking/?track_numbers=${encodeURIComponent(cn)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const html = await res.text();
  if (!html) return null;

  // Extract table rows from Leopards tracking HTML if available
  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const events = [];
  for (const row of rowMatches) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripHtml(c[1])).filter(Boolean);
    if (cells.length >= 2 && !/date|time|status|activity/i.test(cells[0])) {
      events.push({
        timestamp: cells[0] || '',
        status: cells[1] || '',
        location: cells[2] || ''
      });
    }
  }
  if (events.length > 0) {
    const currentStatus = events[0].status;
    return { currentStatus, events: events.slice(0, 8), isDelivered: detectDelivered(currentStatus) };
  }
  return null;
}

async function scrapeCallCourier(cn) {
  const url = `https://cod.callcourier.com.pk/api/CallCourier/GetTackingHistory?cn=${encodeURIComponent(cn)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!Array.isArray(data) || data.length === 0) return null;

  const events = data.map(item => ({
    status: item.ProcessDescForPortal || item.ProcessDesc || 'Transit Update',
    location: item.Origin || item.Destination || '',
    timestamp: item.TransactionDate || ''
  })).reverse();

  const currentStatus = events[0]?.status || '';
  if (!currentStatus) return null;
  return { currentStatus, events: events.slice(0, 8), isDelivered: detectDelivered(currentStatus) };
}

async function scrapeTCS(cn) {
  const url = `https://www.tcsexpress.com/track/${encodeURIComponent(cn)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;
  const html = await res.text();
  if (!html) return null;

  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const events = [];
  for (const row of rowMatches) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(c => stripHtml(c[1])).filter(Boolean);
    if (cells.length >= 2 && !/date|status|location/i.test(cells[0])) {
      events.push({
        timestamp: cells[0] || '',
        status: cells[1] || '',
        location: cells[2] || ''
      });
    }
  }
  if (events.length > 0) {
    const currentStatus = events[0].status;
    return { currentStatus, events: events.slice(0, 8), isDelivered: detectDelivered(currentStatus) };
  }
  return null;
}

/**
 * Fetch live courier tracking status with 10-minute in-memory cache.
 * Never throws; returns { available: boolean, currentStatus, events, isDelivered, cached }.
 */
async function fetchLiveCourierStatus(courierCompany, trackingNumber) {
  const company = (courierCompany || '').trim();
  const cn = (trackingNumber || '').trim();
  if (!company || !cn) {
    return { available: false, events: [], currentStatus: '', isDelivered: false };
  }

  const cacheKey = `${company.toLowerCase()}:${cn.toLowerCase()}`;
  const cached = trackingCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts < CACHE_TTL_MS)) {
    return { ...cached.data, cached: true };
  }

  let result = null;
  try {
    switch (company) {
      case 'Trax':
        result = await scrapeTrax(cn);
        break;
      case 'PostEx':
        result = await scrapePostEx(cn);
        break;
      case 'Leopard':
        result = await scrapeLeopards(cn);
        break;
      case 'Call Courier':
        result = await scrapeCallCourier(cn);
        break;
      case 'TCS':
        result = await scrapeTCS(cn);
        break;
      default:
        result = null;
    }
  } catch (err) {
    // Silent fallback on timeout/network errors
    result = null;
  }

  const payload = result
    ? { available: true, ...result }
    : { available: false, currentStatus: '', events: [], isDelivered: false };

  // Cache positive results for 10 min, negative results for 2 min to avoid hammering carrier sites
  trackingCache.set(cacheKey, {
    ts: result ? Date.now() : (Date.now() - CACHE_TTL_MS + 120000),
    data: payload
  });

  return { ...payload, cached: false };
}

module.exports = { fetchLiveCourierStatus };
