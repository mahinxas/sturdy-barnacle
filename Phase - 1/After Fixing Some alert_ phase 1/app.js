import { Hono } from "https://deno.land/x/hono/mod.ts";
import { registerUser } from "./routes/register.js"; // Import registration logic
import { serveStatic } from "https://deno.land/x/hono/middleware.ts"; // Middleware for serving static files

const app = new Hono();

// Middleware: Add security headers
app.use('*', async (c, next) => {
  // Content Security Policy
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );

  // Anti-Clickjacking
  c.header('X-Frame-Options', 'DENY');

  // Prevent MIME Type Sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Additional Security Headers (optional)
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  await next();
});

// Serve static files (e.g., CSS, JS, images)
app.use('/static/*', serveStatic({ root: './static' }));

// Serve the registration form (GET request)
app.get('/register', async (c) => {
  try {
    const html = await Deno.readTextFile('./views/register.html');
    return c.html(html);
  } catch (error) {
    console.error('Error loading register.html:', error);
    return c.text('Error loading registration page', 500);
  }
});

// Route for user registration (POST request)
app.post('/register', async (c) => {
  try {
    return await registerUser(c); // Delegate to the registration logic
  } catch (error) {
    console.error('Error during user registration:', error);
    return c.text('Registration failed', 500);
  }
});

// Fallback route for undefined paths
app.all('*', (c) => c.text('404 Not Found', 404));

// Start the server
console.log('Server is running at http://localhost:8000');
Deno.serve(app.fetch);
