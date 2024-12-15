import client from "../db/db.js";
import { z } from "https://deno.land/x/zod@v3.16.1/mod.ts"; // Import Zod

// Zod schema for validating the registration form
const resourceSchema = z.object({
    resourceName: z.string()
    .min(4, "Resource name must be at least 4 characters")
    .max(8, "Resource name must not exceed 8 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Resource name can only contain alphanumeric characters and underscores"),
    resourceDescription: z.string()
    .min(1, "Resource name must be at least 1 characters")
    .max(50, "Resource name must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Resource name can only contain alphanumeric characters and underscores"),
});

export async function getResources(req) {
    const query = `SELECT resource_id, resource_name, resource_description FROM zephyr_resources`;
    try {
        const result = await client.queryObject(query);
        return new Response(JSON.stringify(result.rows), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error('Error fetching resources:', error);
        return new Response("Internal Server Error", { status: 500 });
    }
}

export async function registerResource(req) {
    const resourceName = req.get("resource_name");
    const resourceDescription = req.get("resource_description");
    try {
        resourceSchema.parse({ resourceName, resourceDescription });
        const query = `INSERT INTO zephyr_resources (resource_name, resource_description) VALUES ($1, $2)`;
        await client.queryArray(query, [resourceName, resourceDescription]);
        return new Response(null, { status: 302, headers: { Location: "/", }, });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Handle validation errors from Zod
            return new Response(`Validation Error: ${error.errors.map(e => e.message).join(", ")}`, { status: 400 });
        }
        console.error(error);
        return new Response("Error during adding resource", { status: 500 });
    }
}
