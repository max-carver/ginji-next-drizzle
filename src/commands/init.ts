import inquirer from "inquirer";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import execa from "execa";
import { compileTemplates } from "../utils/templates";
import { validateNextJsProject } from "../utils/validate";

interface InitOptions {
  yes?: boolean;
  dir?: string;
}

export async function initDrizzle(options: InitOptions): Promise<void> {
  try {
    // Determine project directory
    const projectDir = options.dir ? path.resolve(options.dir) : process.cwd();

    console.log(
      chalk.cyan(`\n🔍 Checking Next.js project in ${chalk.bold(projectDir)}`)
    );

    // Validate that this is a Next.js project
    if (!(await validateNextJsProject(projectDir))) {
      console.error(
        chalk.red(
          "❌ This does not appear to be a Next.js project. Make sure you run this in a Next.js project directory."
        )
      );
      process.exit(1);
    }

    // Skip interactive prompts with --yes flag
    if (!options.yes) {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message:
            "This will set up Drizzle ORM with PostgreSQL in your Next.js project. Continue?",
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow("⏹️ Operation cancelled."));
        process.exit(0);
      }
    }

    // Get database configuration
    let databaseConfig: Record<string, string> = {};

    if (!options.yes) {
      console.log(
        chalk.cyan("\n📝 Please provide your database connection details:")
      );
      console.log(
        chalk.gray(
          "  (You can set these up later by editing .env if you prefer)"
        )
      );

      databaseConfig = await inquirer.prompt([
        {
          type: "input",
          name: "dbUrl",
          message:
            "PostgreSQL Connection URL (or leave empty to set up later):",
          default: "",
        },
      ]);
    }

    // Installation steps
    const spinner = ora("Setting up Drizzle ORM with PostgreSQL...").start();

    // 1. Install required dependencies
    spinner.text = "Installing dependencies...";
    await installDependencies(projectDir);

    // 2. Create necessary files
    spinner.text = "Creating configuration files...";
    await createConfigFiles(projectDir, databaseConfig);

    // 3. Add scripts to package.json
    spinner.text = "Updating package.json scripts...";
    await updatePackageJson(projectDir);

    spinner.succeed(
      chalk.green(
        "✅ Drizzle ORM with PostgreSQL has been successfully set up!"
      )
    );

    console.log(chalk.cyan("\n📝 Important note about seeding data:"));
    console.log(`
To seed your database with mock data, follow these steps:

1. First set up your database URL in ${chalk.bold(".env")} 
2. Run ${chalk.bold("pnpm db:generate")} to create migration files
3. Run ${chalk.bold("pnpm db:push")} to create tables in your database
4. Run ${chalk.bold("pnpm db:seed")} to populate with sample data
5. Visit ${chalk.bold("/examples")} to see your data
`);

    // Display next steps
    console.log(chalk.cyan("\n📋 Next steps:"));
    console.log(`
1. ${chalk.yellow("Add your database URL")} in ${chalk.bold(
      ".env"
    )} if you haven't already:
  ${chalk.gray(
    'DATABASE_URL="postgresql://username:password@host:port/db_name"'
  )}

2. ${chalk.yellow("Create or modify your schema")} in ${chalk.bold(
      "src/server/db/schema/"
    )} directory

3. ${chalk.yellow("Run database migrations to create your tables")}:
  ${chalk.gray("pnpm db:generate")} - Generate SQL migration files
  ${chalk.gray("pnpm db:push")} - Apply migrations to your database

4. ${chalk.yellow("Seed your database with mock data")}:
  ${chalk.gray(
    "pnpm db:seed"
  )} - This will populate your database with sample users and posts

5. ${chalk.yellow("View the example page")} at ${chalk.bold(
      "/examples"
    )} to see your data

6. ${chalk.yellow("Use Drizzle in your app")} by importing:
  ${chalk.gray('import { db } from "@/src/server/db";')}

7. ${chalk.yellow("Use typesafe environment variables")} by importing:
  ${chalk.gray('import { env } from "@/src/env";')}
`);
  } catch (error) {
    console.error(
      chalk.red(
        `\n❌ Error: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    process.exit(1);
  }
}

async function installDependencies(projectDir: string): Promise<void> {
  try {
    // Install Drizzle ORM and PostgreSQL dependencies
    await execa(
      "pnpm",
      [
        "add",
        "drizzle-orm",
        "postgres",
        "@neondatabase/serverless",
        "dotenv",
        "@t3-oss/env-nextjs",
        "zod",
      ],
      { cwd: projectDir }
    );

    // Install dev dependencies
    await execa("pnpm", ["add", "-D", "drizzle-kit", "tsx"], {
      cwd: projectDir,
    });
  } catch (error) {
    throw new Error(
      `Failed to install dependencies: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function createConfigFiles(
  projectDir: string,
  config: Record<string, string>
): Promise<void> {
  try {
    // Compile and write templates
    await compileTemplates(projectDir, config);

    // Create .env.example file
    const envExamplePath = path.join(projectDir, ".env.example");
    await fs.writeFile(
      envExamplePath,
      `# Database connection settings
DATABASE_URL="postgresql://username:password@host:port/db_name"

# Add other environment variables your application needs here
`
    );

    console.log(
      chalk.green(`✅ Created .env.example with example DATABASE_URL`)
    );
  } catch (error) {
    throw new Error(
      `Failed to create configuration files: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function updatePackageJson(projectDir: string): Promise<void> {
  try {
    const packageJsonPath = path.join(projectDir, "package.json");
    const packageJson = await fs.readJSON(packageJsonPath);

    // Add database scripts to package.json
    packageJson.scripts = {
      ...packageJson.scripts,
      "db:generate": "drizzle-kit generate",
      "db:push": "drizzle-kit push",
      "db:studio": "drizzle-kit studio",
      "db:seed": "tsx src/server/db/seed.ts",
    };

    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
  } catch (error) {
    throw new Error(
      `Failed to update package.json: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
