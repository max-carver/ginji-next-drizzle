# ginji-next-drizzle

A CLI tool for seamlessly adding Drizzle ORM with PostgreSQL to your Next.js applications. It automatically configures and sets up all necessary files and packages to get you started with database operations right away.

## Features

- 🚀 Quickly add Drizzle ORM to an existing Next.js application
- 🔧 Automatically installs all required dependencies
- 📝 Creates configuration files for Drizzle ORM
- 🌐 Configures connection with Neon PostgreSQL
- 🧩 Adds database scripts to your package.json
- 📊 Sets up sample schema

## Installation

### 1. Global Installation

```bash
# Using npm
npm install -g ginji-next-drizzle

# Using pnpm
pnpm add -g ginji-next-drizzle

# Using yarn
yarn global add ginji-next-drizzle
```

### 2. Instant Execution (npx)

```bash
# Using npx
npx ginji-next-drizzle init

# Using pnpm
pnpm dlx ginji-next-drizzle init
```

## Usage

Navigate to your Next.js project directory and run:

```bash
ginji-next-drizzle init
```

Or use it directly with npx/pnpm dlx:

```bash
npx ginji-next-drizzle init
```

### Options

- `-y, --yes`: Skip confirmation prompts
- `-d, --dir <directory>`: Specify the Next.js project directory

Example:

```bash
ginji-next-drizzle init -y -d ./my-nextjs-app
```

## What's Included

After running the CLI, your Next.js application will have:

1. **Drizzle ORM Configuration**

   - `drizzle.config.ts`: Configuration for Drizzle ORM
   - `src/server/db/schema.ts`: Empty schema file ready for your tables
   - `src/server/db/index.ts`: Database connection setup using Neon PostgreSQL

2. **Package Scripts**
   - `db:generate`: Generate SQL migrations
   - `db:push`: Push schema changes to your database
   - `db:studio`: Launch Drizzle Studio for database management

## Next Steps After Installation

1. Add your database URL in `.env.local`:

   ```
   DATABASE_URL="postgresql://username:password@host:port/db_name"
   ```

2. Define your schema in `src/server/db/schema.ts`

3. Run database migrations:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

4. Start using Drizzle in your Next.js app:
   ```typescript
   import { db } from "@/src/server/db";
   ```

## Development

To develop and modify this CLI tool:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/ginji-next-drizzle.git
   cd ginji-next-drizzle
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the project:

   ```bash
   pnpm build
   ```

4. Link for local development:
   ```bash
   pnpm link --global
   ```

## Publishing to npm

To publish the CLI tool to npm:

1. Update the version in `package.json`

2. Build the project:

   ```bash
   pnpm build
   ```

3. Login to npm:

   ```bash
   npm login
   ```

4. Publish the package:
   ```bash
   npm publish
   ```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
