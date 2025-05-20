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

export default {
    async fetch(request, env) {
      if (request.method === "OPTIONS") {
            // Make sure to customize these headers to fit your needs.
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": request.headers.get('Origin'), // Adjust this to be more restrictive if needed
                    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", // Include other methods your API needs
                    "Access-Control-Allow-Headers": "Content-Type, Authorization", // Add other headers your API expects
                },
            })
        }

        kvNamespace = env.annotation-final;

        normalHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
        NotAvailableHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
        notFoundHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
        alreadyInuse.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
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
        return new Response("Method Not Allowed", NotAvailableHeader);
    }
    const { key, rater, value } = await request.json();
    

    // Store applicant data in KV storage
    await kvNamespace.put(key, JSON.stringify({
      "time": getTime(),
      "rater": rater,
      "value": value
    }));

    return new Response(JSON.stringify({ "msg": 'Annotation uploaded successfully for screenshot', key}), normalHeader);
}

async function handleGetComment(request) {
    // only allow post
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", NotAvailableHeader);
    }
    const { key } = await request.json();
    
    const value = await kvNamespace.get(key);

    if(value == null) {
        console.log("No value found in KV for the given image index");
        return new Response("", normalHeader);
    } else{
        console.log("Value found in KV for the given image index");
        return new Response(JSON.stringify(value), normalHeader);
    }
}


async function handleUpload(request) {
    // only allow post
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", NotAvailableHeader);
    }
    const { key, index, rater } = await request.json();
    

    // Store applicant data in KV storage
    await kvNamespace.put(rater+":"+key, JSON.stringify({
      "time": getTime(),
      "index": index,
      "rater": rater
    }));

    return new Response(JSON.stringify({ "msg": 'Annotation progress saved for screenshot', index }), normalHeader);
}

async function handleGet(request) {
    // only allow post
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", NotAvailableHeader);
    }
    const { key } = await request.json();
    
    const value = await kvNamespace.list({ prefix: key+":" });

    return new Response(JSON.stringify(value.keys), normalHeader);
}
