/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// Define a KV namespace for storing applicant data
var kvNamespace = null;

function getCorsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400" // Optional: cache preflight for 1 day
    };
}

function withCorsHeaders(response, origin) {
    const headers = new Headers(response.headers);
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
        headers.set(key, value);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin") || "*";

        if (request.method === "OPTIONS") {
            return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400"
            }
            });
        }

        kvNamespace = env["annotation-final"];
        const url = new URL(request.url);
        const path = url.pathname;

        if (path === "/upload") {
            return handleUpload(request, origin);
        } else if (path === "/getCompleted") {
            return handleGet(request, origin);
        } else if (path === "/get") {
            return handleGetComment(request, origin);
        } else if (path === "/put") {
            return handlePutComment(request, origin);
        } else {
            return withCorsHeaders(new Response("Not Found", { status: 404 }), origin);
        }
    }
};

function getTime() {
    return new Date().getTime();
}

async function handlePutComment(request, origin) {
    if (request.method !== "POST") {
        return withCorsHeaders(new Response("Method Not Allowed", { status: 405 }), origin);
    }

    const { key, rater, value } = await request.json();
    await kvNamespace.put(key, JSON.stringify({ time: getTime(), rater, value }));

    return withCorsHeaders(new Response(JSON.stringify({ msg: "Annotation uploaded successfully for screenshot", key }), { status: 200 }), origin);
}

async function handleGetComment(request, origin) {
    if (request.method !== "POST") {
        return withCorsHeaders(new Response("Method Not Allowed", { status: 405 }), origin);
    }

    const { key } = await request.json();
    const value = await kvNamespace.get(key);

    if (value == null) {
        return withCorsHeaders(new Response("", { status: 200 }), origin);
    } else {
        return withCorsHeaders(new Response(value, { status: 200 }), origin);
    }
}

async function handleUpload(request, origin) {
    if (request.method !== "POST") {
        return withCorsHeaders(new Response("Method Not Allowed", { status: 405 }), origin);
    }

    const { key, index, rater } = await request.json();
    await kvNamespace.put(`${rater}:${key}`, JSON.stringify({ time: getTime(), index, rater }));

    return withCorsHeaders(new Response(JSON.stringify({ msg: "Annotation progress saved for screenshot", index }), { status: 200 }), origin);
}

async function handleGet(request, origin) {
    if (request.method !== "POST") {
        return withCorsHeaders(new Response("Method Not Allowed", { status: 405 }), origin);
    }

    const { key } = await request.json();
    const value = await kvNamespace.list({ prefix: `${key}:` });

    return withCorsHeaders(new Response(JSON.stringify(value.keys), { status: 200 }), origin);
}
