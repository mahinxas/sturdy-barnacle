import { serve } from "https://deno.land/std@0.199.0/http/server.ts";
import { loginUser } from "./routes/login.js";
import { registerUser, getAccountInfo } from "./routes/register.js";
import { registerResource, getResources } from "./routes/resource.js";
import { registerReservation, handleReservationForm } from "./routes/reservation.js";
import { handleIndex, handleDefaultIndex } from "./routes/indexPage.js";
import { getSession, destroySession, getCookieValue } from "./sessionService.js";

let connectionInfo = {};

// In-memory session store (replace with a database in production)
const sessionStore = new Map();

// Utility function: Get content type for static files
function getContentType(filePath) {
    const ext = filePath.split(".").pop();
    const mimeTypes = {
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        svg: "image/svg+xml",
        json: "application/json",
    };
    return mimeTypes[ext] || "application/octet-stream";
}

// Middleware: Add security headers to responses
async function addSecurityHeaders(req, handler) {
    const response = await handler(req);
    response.headers.set(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; form-action 'self';"
    );
    response.headers.set("X-Frame-Options", "DENY"); // Prevent Clickjacking
    response.headers.set("X-Content-Type-Options", "nosniff"); // Prevent MIME type sniffing
    return response;
}

// Serve static files
async function serveStaticFile(path, contentType) {
    try {
        const data = await Deno.readFile(path);
        return new Response(data, { headers: { "Content-Type": contentType } });
    } catch {
        return new Response("File not found", { status: 404 });
    }
}

// Routes: Handle different endpoints
async function handleRoutes(req) {
    const url = new URL(req.url);

    // Static files route
    if (url.pathname.startsWith("/static/")) {
        const filePath = `.${url.pathname}`;
        const contentType = getContentType(filePath);
        return await serveStaticFile(filePath, contentType);
    }

    // Pages and actions
    switch (url.pathname) {
        case "/": {
            const session = getSession(req);
            return session ? await handleIndex(req) : await handleDefaultIndex(req);
        }
        case "/register":
            return req.method === "GET"
                ? await serveStaticFile("./views/register.html", "text/html")
                : await registerUser(await req.formData());
        case "/login":
            return req.method === "GET"
                ? await serveStaticFile("./views/login.html", "text/html")
                : await loginUser(await req.formData(), connectionInfo);
        case "/logout": {
            const cookies = req.headers.get("Cookie") || "";
            const sessionId = getCookieValue(cookies, "session_id");
            if (sessionId) destroySession(sessionId);
            return new Response(null, {
                status: 302,
                headers: {
                    Location: "/",
                    "Set-Cookie": "session_id=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
                },
            });
        }
        case "/resources":
            if (req.method === "GET") {
                const session = getSession(req);
                if (!session || session.role !== "administrator") {
                    return new Response("Unauthorized", { status: 401 });
                }
                return await serveStaticFile("./views/resource.html", "text/html");
            }
            return await registerResource(await req.formData());
        case "/resourcesList":
            return await getResources();
        case "/reservation":
            return req.method === "GET"
                ? await handleReservationForm(req)
                : await registerReservation(await req.formData());
        case "/terms":
            return await serveStaticFile("./views/terms.html", "text/html");
        case "/privacynotice":
            return await serveStaticFile("./views/privacynotice.html", "text/html");
        case "/account":
            // Serve the account page
            return await serveStaticFile("./views/account.html", "text/html");
        case "/accountInfo": {
            // Handle account information retrieval
            const session = getSession(req);
            if (!session) {
                return new Response("Unauthorized", { status: 401 });
            }
            return await getAccountInfo(session.username); // Fetch user info
        }
        default:
            return new Response("Not Found", { status: 404 });
    }
}

// Main handler with middleware
async function mainHandler(req, info) {
    connectionInfo = info;
    return await addSecurityHeaders(req, handleRoutes);
}

// Start the server
serve(mainHandler, { port: 8000 });
