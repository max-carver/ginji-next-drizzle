import fs from "fs-extra";
import path from "path";
import Handlebars from "handlebars";

/**
 * Compiles and writes all templates to the project directory
 */
export async function compileTemplates(
  projectDir: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // Create server/db directory structure
    await fs.ensureDir(path.join(projectDir, "src", "server", "db"));
    await fs.ensureDir(path.join(projectDir, "src", "server", "db", "schema"));

    // Write drizzle.config.ts
    await writeDrizzleConfig(projectDir);

    // Write db.ts (database connection)
    await writeDbFile(projectDir);

    // Write schema files
    await writeSchemaFiles(projectDir);

    // Write migration script
    await writeMigrationScript(projectDir);

    // Write env.ts file for t3-env
    await writeEnvFile(projectDir);

    // Write server actions
    await writeServerActions(projectDir);

    // Write example page
    await writeExamplePage(projectDir);

    // Write seed script
    await writeSeedScript(projectDir);
  } catch (error) {
    throw new Error(
      `Failed to compile templates: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function writeDrizzleConfig(projectDir: string): Promise<void> {
  const content = `import 'dotenv/config'; import type { Config } from "drizzle-kit";
import { env } from "@/env";

export default {
  schema: "./src/server/db/schema",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;

`;

  await fs.writeFile(path.join(projectDir, "drizzle.config.ts"), content);
}

async function writeDbFile(projectDir: string): Promise<void> {
  const content = `import 'dotenv/config'; import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from "@/env";

const sql = neon(env.DATABASE_URL);
const db = drizzle({ client: sql });

export { db };
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "index.ts"),
    content
  );
}

async function writeSchemaFiles(projectDir: string): Promise<void> {
  // Create an index file
  const indexContent = `// Export all schemas
export * from './users';
export * from './posts';
// Add more schema exports as needed
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "schema", "index.ts"),
    indexContent
  );

  // Create users schema file
  const usersSchemaContent = `import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "schema", "users.ts"),
    usersSchemaContent
  );

  // Create posts schema file
  const postsSchemaContent = `import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "schema", "posts.ts"),
    postsSchemaContent
  );
}

async function writeMigrationScript(projectDir: string): Promise<void> {
  // Create migrations directory
  await fs.ensureDir(
    path.join(projectDir, "src", "server", "db", "migrations")
  );

  // Create a README file in the migrations directory
  const readmeContent = `# Database Migrations

This directory contains your database migrations managed by Drizzle Kit.

## Commands

- Generate migrations: \`pnpm db:generate\`
- Apply migrations: \`pnpm db:push\`
- Start Drizzle Studio: \`pnpm db:studio\`
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "migrations", "README.md"),
    readmeContent
  );
}

async function writeEnvFile(projectDir: string): Promise<void> {
  const content = `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
});

`;

  await fs.writeFile(path.join(projectDir, "src", "env.ts"), content);
}

async function writeServerActions(projectDir: string): Promise<void> {
  // Create actions directory
  await fs.ensureDir(path.join(projectDir, "src", "server", "actions"));

  // Create users action
  const usersActionContent = `"use server";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { desc } from "drizzle-orm";

export async function getUsers() {
  try {
    return await db.select()
      .from(users)
      .orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users");
  }
}
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "actions", "users.ts"),
    usersActionContent
  );

  // Create posts action with SQL-like join syntax
  const postsActionContent = `"use server";

import { db } from "@/server/db";
import { posts, users } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getPosts() {
  try {
    return await db.select({
      post: posts,
      author: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt));
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw new Error("Failed to fetch posts");
  }
}
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "actions", "posts.ts"),
    postsActionContent
  );
}

async function writeExamplePage(projectDir: string): Promise<void> {
  // Create examples directory
  await fs.ensureDir(path.join(projectDir, "src", "app", "examples"));

  // Create example page
  const examplePageContent = `import { getUsers } from "@/server/actions/users";
import { getPosts } from "@/server/actions/posts";

export default async function ExamplesPage() {
  // Fetch data using server actions
  const users = await getUsers();
  const posts = await getPosts();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Database Examples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Users Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          {users.length === 0 ? (
            <p className="text-gray-500">No users found. Try running the seed script.</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border-b pb-4">
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-400">
                    Created: {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Posts Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Posts</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500">No posts found. Try running the seed script.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((item) => (
                <div key={item.post.id} className="border-b pb-4">
                  <h3 className="font-medium text-lg">{item.post.title}</h3>
                  <p className="text-gray-800 my-2">{item.post.content}</p>
                  <p className="text-sm text-gray-600">
                    By {item.author?.name || "Unknown"} on{" "}
                    {item.post.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium mb-2">How it works</h2>
        <p className="text-gray-700">
          This page demonstrates how to use Drizzle ORM with React Server Components.
          The data is fetched directly in this server component using server actions.
          Check out the source code in <code className="bg-gray-100 px-1 rounded">src/server/actions</code> and <code className="bg-gray-100 px-1 rounded">src/app/examples/page.tsx</code>.
        </p>
      </div>
    </div>
  );
}
`;

  await fs.writeFile(
    path.join(projectDir, "src", "app", "examples", "page.tsx"),
    examplePageContent
  );
}

async function writeSeedScript(projectDir: string): Promise<void> {
  const seedScriptContent = `// Load environment variables for scripts run outside Next.js
import "dotenv/config";

import { db } from "./index";
import { users, posts } from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined in your .env file");
    process.exit(1);
  }

  try {
    // Try to connect to the database to ensure it's accessible before proceeding
    console.log("Checking database connection...");
    await db.execute(sql\`SELECT 1\`);
    
    // Clear existing data
    console.log("Clearing existing data...");
    try {
      await db.delete(posts);
    } catch (e) {
      console.log("Posts table may not exist yet, continuing...");
    }
    
    try {
      await db.delete(users);
    } catch (e) {
      console.log("Users table may not exist yet, continuing...");
    }

    // Create users
    console.log("Creating users...");
    const [alice, bob, charlie] = await Promise.all([
      db.insert(users).values({
        name: "Alice Johnson",
        email: "alice@example.com",
      }).returning().then(res => res[0]),
      
      db.insert(users).values({
        name: "Bob Smith",
        email: "bob@example.com",
      }).returning().then(res => res[0]),
      
      db.insert(users).values({
        name: "Charlie Brown",
        email: "charlie@example.com",
      }).returning().then(res => res[0]),
    ]);

    // Create posts
    console.log("Creating posts...");
    await Promise.all([
      db.insert(posts).values({
        title: "Getting Started with Drizzle ORM",
        content: "Drizzle ORM is a TypeScript ORM for SQL databases designed with maximum type safety in mind...",
        authorId: alice.id,
      }),
      
      db.insert(posts).values({
        title: "Building with Next.js App Router",
        content: "The App Router is a new paradigm for building applications with React and Next.js...",
        authorId: alice.id,
      }),
      
      db.insert(posts).values({
        title: "Server Components vs. Client Components",
        content: "Understanding the difference between Server and Client Components is essential for optimal performance...",
        authorId: bob.id,
      }),
      
      db.insert(posts).values({
        title: "Type-safe Environment Variables",
        content: "Using t3-env to manage your environment variables ensures type safety and better developer experience...",
        authorId: charlie.id,
      }),
    ]);

    console.log("✅ Seed completed successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Execute the seed function
seed().catch(console.error);
`;

  await fs.writeFile(
    path.join(projectDir, "src", "server", "db", "seed.ts"),
    seedScriptContent
  );
}
