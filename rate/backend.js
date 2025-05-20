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

let normalHeader = {
    status: 200,
    statusText: 'OK',
    headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE'
    }
};

let notFoundHeader = {
    status: 404,
    statusText: 'Not Found',
    headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE'
    }
};

let NotAvailableHeader = {
    status: 405,
    statusText: 'Not Found',
    headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE'
    }
};


let alreadyInuse = {
    status: 409,
    statusText: 'Not Found',
    headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE'
    }
};

function withCorsHeaders(response, origin) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return response;
}



export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            const origin = request.headers.get("Origin") || "*";
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization",
                },
            });
        }
        

        kvNamespace = env.annotation-final;

        const url = new URL(request.url);
        const path = url.pathname;

        if (path === "/upload") {
            return handleUpload(request);
        } else if (path === "/getCompleted") {
            return handleGet(request);
        }else if (path === "/get") {
            return handleGetComment(request);
        }else if (path === "/put") {
            return handlePutComment(request);
        }else {
            return new Response("Not Found", notFoundHeader);
        }
    }
}

var getTime = function () {
    return new Date().getTime();
};


async function handlePutComment(request) {
    // only allow post
    if (request.method !== "POST") {
        return withCorsHeaders(
            new Response("Method Not Allowed", NotAvailableHeader),
            request.headers.get("Origin")
        );
        
        
    }
    const { key, rater, value } = await request.json();
    

    // Store applicant data in KV storage
    await kvNamespace.put(key, JSON.stringify({
      "time": getTime(),
      "rater": rater,
      "value": value
    }));

    return withCorsHeaders(
        new Response(JSON.stringify({ msg: 'Annotation uploaded successfully for screenshot', key }), normalHeader),
        request.headers.get("Origin")
    );
    
}

async function handleGetComment(request) {
    // only allow post
    if (request.method !== "POST") {
        return withCorsHeaders(
            new Response("Method Not Allowed", NotAvailableHeader),
            request.headers.get("Origin")
        );
        
    }
    const { key } = await request.json();
    
    const value = await kvNamespace.get(key);

    if(value == null) {
        console.log("No value found in KV for the given image index");
        return withCorsHeaders(
            new Response("", normalHeader),
            request.headers.get("Origin")
        );
        
    } else{
        console.log("Value found in KV for the given image index");
        return withCorsHeaders(
            new Response(JSON.stringify(value), normalHeader),
            request.headers.get("Origin")
        );
        
    }
}


async function handleUpload(request) {
    // only allow post
    if (request.method !== "POST") {
        return withCorsHeaders(
            new Response("Method Not Allowed", NotAvailableHeader),
            request.headers.get("Origin")
        );
        
    }
    const { key, index, rater } = await request.json();
    

    // Store applicant data in KV storage
    await kvNamespace.put(rater+":"+key, JSON.stringify({
      "time": getTime(),
      "index": index,
      "rater": rater
    }));

    return withCorsHeaders(
        new Response(JSON.stringify({ msg: 'Annotation progress saved for screenshot', index }), normalHeader),
        request.headers.get("Origin")
    );
    
}

async function handleGet(request) {
    // only allow post
    if (request.method !== "POST") {
        return withCorsHeaders(
            new Response("Method Not Allowed", NotAvailableHeader),
            request.headers.get("Origin")
        );
    }

    const { key } = await request.json();
    const value = await kvNamespace.list({ prefix: key + ":" });

    return withCorsHeaders(
        new Response(JSON.stringify(value.keys), normalHeader),
        request.headers.get("Origin")
    );
}
