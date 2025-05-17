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

    // Installation steps - better progress indicators
    console.log(chalk.cyan("\n📦 Setting up Drizzle with PostgreSQL\n"));

    // 1. Install required dependencies
    const installSpinner = ora("Installing dependencies...").start();
    try {
      await installDependencies(projectDir);
      installSpinner.succeed(
        chalk.green("Dependencies installed successfully")
      );
    } catch (error) {
      installSpinner.fail(chalk.red("Failed to install dependencies"));
      throw error;
    }

    // 2. Create necessary files
    const configSpinner = ora("Creating configuration files...").start();
    try {
      await createConfigFiles(projectDir);
      configSpinner.succeed(chalk.green("Configuration files created"));
    } catch (error) {
      configSpinner.fail(chalk.red("Failed to create configuration files"));
      throw error;
    }

    // 3. Add scripts to package.json
    const pkgSpinner = ora("Updating package.json scripts...").start();
    try {
      await updatePackageJson(projectDir);
      pkgSpinner.succeed(chalk.green("package.json updated with new scripts"));
    } catch (error) {
      pkgSpinner.fail(chalk.red("Failed to update package.json"));
      throw error;
    }

    console.log(
      chalk.green(
        "\n✅ Drizzle ORM with PostgreSQL has been successfully set up!"
      )
    );

    // More visually organized next steps section
    console.log(chalk.bold.cyan("\n📝 NEXT STEPS"));
    console.log(chalk.dim("─".repeat(50)));

    console.log(`
${chalk.cyan("1.")} Create a .env file based on the template
   ${chalk.dim("$")} ${chalk.bold("cp .env.example .env")}
      
${chalk.cyan("2.")} Add your database connection string to the .env file
   ${chalk.dim("DATABASE_URL=")}${chalk.italic.dim(
      "postgresql://username:password@host:port/db_name"
    )}
      
${chalk.cyan(
  "3."
)} Run database migrations to create your tables and seed (see package.json for more details)

${chalk.cyan("4.")} View the example page at ${chalk.underline("/examples")}

${chalk.cyan("5.")} Use Drizzle in your app by importing:
   ${chalk.bold('import { db } from "@/server/db";')}
      
${chalk.cyan("6.")} Use typesafe environment variables by importing:
   ${chalk.bold('import { env } from "@/env";')}
`);

    console.log(chalk.dim("─".repeat(50)));
    console.log(
      chalk.cyan("\n💡 TIP:") +
        " Run " +
        chalk.bold("pnpm db:studio") +
        " to open Drizzle Studio and manage your database visually"
    );
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

async function createConfigFiles(projectDir: string): Promise<void> {
  try {
    // Compile and write templates
    await compileTemplates(projectDir);

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
