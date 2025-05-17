#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initDrizzle } from "./commands/init";

const program = new Command();

console.log(
  chalk.cyan(`
╔═══════════════════════════════════════════════╗
║                                               ║
║        ${chalk.bold("Ginji Next.js Drizzle Setup")}            ║
║                                               ║
╚═══════════════════════════════════════════════╝
`)
);

program
  .name("ginji-next-drizzle")
  .description(
    "CLI tool for adding Drizzle ORM with PostgreSQL to Next.js applications"
  )
  .version("1.0.0");

program
  .command("init")
  .description(
    "Initialize Drizzle ORM with PostgreSQL in your Next.js application"
  )
  .option("-y, --yes", "Skip confirmation prompts")
  .option("-d, --dir <directory>", "Specify the Next.js project directory")
  .action(initDrizzle);

program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
