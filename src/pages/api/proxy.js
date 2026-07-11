import { rejectFakeMineIfRemote, rejectLocalNodeInProxy } from '../../lib/proxyGuards.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

async function forwardToNode({ nodeBase, nodePath, method = 'GET', body = null }) {
  if (!nodePath || !nodeBase) {
    return jsonResponse({ code: 1, error: 'Missing params' }, 400);
  }

  const localNodeRejection = rejectLocalNodeInProxy(nodeBase);
  if (localNodeRejection) {
    return new Response(localNodeRejection.body, {
      status: localNodeRejection.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });
  }

  const fakeMineRejection = rejectFakeMineIfRemote(nodePath, nodeBase);
  if (fakeMineRejection) {
    return new Response(fakeMineRejection.body, {
      status: fakeMineRejection.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });
  }

  const targetUrl = nodeBase.replace(/\/$/, '') + '/' + nodePath.replace(/^\//, '');
  const controller = new AbortController();
  const isSlowPath = /account\/[^/]+\/history\//i.test(String(nodePath || ''));
  const timeoutMs = isSlowPath ? 25000 : 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions = {
    method,
    signal: controller.signal,
    headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
  };

  if (method !== 'GET' && method !== 'HEAD' && body != null) {
    fetchOptions.body = body;
    fetchOptions.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const trimmed = text.trim();
      let parsed = null;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        // not JSON
      }
      if (parsed && typeof parsed === 'object') {
        return jsonResponse(parsed, response.status);
      }

      const preview = trimmed.slice(0, 160).replace(/\s+/g, ' ');
      return jsonResponse(
        {
          code: 1,
          error: preview
            ? `Upstream returned non-JSON (HTTP ${response.status}): ${preview}`
            : `Upstream returned empty/non-JSON response (HTTP ${response.status})`,
        },
        response.ok ? 502 : response.status,
      );
    }

    if (!text.trim()) {
      return jsonResponse(
        {
          code: 1,
          error: `Upstream returned empty JSON body (HTTP ${response.status}) for ${nodePath}`,
        },
        response.ok ? 502 : response.status,
      );
    }

    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return jsonResponse(
        {
          code: 1,
          error: `Node request timed out contacting ${nodeBase}. The node may be offline or unreachable from the server.`,
        },
        408,
      );
    }
    return jsonResponse(
      {
        code: 1,
        error: `Upstream fetch failed for ${nodeBase}: ${error.message || 'network error'}`,
      },
      502,
    );
  }
}

export async function GET({ request }) {
  const url = new URL(request.url);
  return forwardToNode({
    nodeBase: url.searchParams.get('nodeBase'),
    nodePath: url.searchParams.get('nodePath'),
    method: 'GET',
  });
}

export async function POST({ request }) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const envelope = await request.json();
      if (envelope?.nodeBase && envelope?.nodePath != null) {
        const forwardBody = envelope.body != null
          ? JSON.stringify(envelope.body)
          : null;
        return forwardToNode({
          nodeBase: envelope.nodeBase,
          nodePath: envelope.nodePath,
          method: envelope.method || 'GET',
          body: forwardBody,
        });
      }
    } catch {
      // fall through
    }
  }

  const url = new URL(request.url);
  const nodePath = url.searchParams.get('nodePath');
  const nodeBase = url.searchParams.get('nodeBase');
  if (!nodePath || !nodeBase) {
    return jsonResponse({ code: 1, error: 'Missing params' }, 400);
  }

  const body = await request.text();
  return forwardToNode({
    nodeBase,
    nodePath,
    method: 'POST',
    body: body || null,
  });
}
