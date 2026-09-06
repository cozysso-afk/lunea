'use strict';

const ORIGINS = [
  {label:'v2', origin:'https://lunea-astro-api-v2.onrender.com'},
  {label:'legacy', origin:'https://lunea-astro-api.onrender.com'},
];
const TRANSIENT = new Set([408,425,429,500,502,503,504]);

function decodeBody(event) {
  if (!event.body) return undefined;
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;
}

function passthroughHeaders(input = {}) {
  const allow = new Set(['content-type','accept','accept-language','authorization','x-requested-with']);
  const out = {};
  for (const [key,value] of Object.entries(input)) {
    if (allow.has(String(key).toLowerCase()) && value != null) out[key] = value;
  }
  return out;
}

function requestSuffix(event) {
  const raw = String(event.queryStringParameters?.path || '').replace(/^\/+/, '');
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(event.queryStringParameters || {})) {
    if (key === 'path' || value == null) continue;
    params.append(key, String(value));
  }
  const query = params.toString();
  return '/' + raw + (query ? `?${query}` : '');
}

async function callOne(entry, suffix, event, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(entry.origin + suffix, {
      method:event.httpMethod || 'GET',
      headers:passthroughHeaders(event.headers || {}),
      body:['GET','HEAD'].includes(event.httpMethod || 'GET') ? undefined : decodeBody(event),
      redirect:'follow',
      cache:'no-store',
      signal:controller.signal,
    });
    const array = Buffer.from(await response.arrayBuffer());
    const headers = {};
    for (const [key,value] of response.headers.entries()) {
      if (!['content-length','content-encoding','transfer-encoding','connection'].includes(key.toLowerCase())) headers[key] = value;
    }
    return {statusCode:response.status, headers, body:array};
  } finally {
    clearTimeout(timer);
  }
}

async function warmBackends() {
  await Promise.allSettled(ORIGINS.map(async entry => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      await fetch(entry.origin + '/health', {
        method:'GET', cache:'no-store', signal:controller.signal,
        headers:{Accept:'application/json','User-Agent':'LUNEA-Netlify-Warm-V1'}
      });
    } finally {
      clearTimeout(timer);
    }
  }));
}

exports.handler = async function handler(event) {
  const suffix = requestSuffix(event);

  // Keep the app responsive: health is optimistic, but still triggers real Render wake requests.
  if (/^\/health(?:\?|$)/.test(suffix)) {
    await warmBackends();
    return {
      statusCode:200,
      headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},
      body:JSON.stringify({ok:true,warming:true,source:'lunea-netlify-proxy-v1'})
    };
  }

  let last = null;
  let lastError = null;
  for (const entry of ORIGINS) {
    try {
      const result = await callOne(entry, suffix, event, entry.label === 'v2' ? 9000 : 9000);
      last = {...result, originLabel:entry.label};
      if (!TRANSIENT.has(result.statusCode)) {
        return {
          statusCode:result.statusCode,
          headers:{...result.headers,'cache-control':'no-store','x-lunea-api-origin':entry.label},
          body:result.body.toString('base64'),
          isBase64Encoded:true,
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (last) {
    return {
      statusCode:last.statusCode,
      headers:{...last.headers,'cache-control':'no-store','x-lunea-api-origin':last.originLabel || 'unknown'},
      body:last.body.toString('base64'),
      isBase64Encoded:true,
    };
  }

  return {
    statusCode:503,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},
    body:JSON.stringify({ok:false,error:'LUNEA calculation server is waking',detail:String(lastError?.message || 'upstream unavailable')})
  };
};
