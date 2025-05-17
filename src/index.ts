#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initDrizzle } from "./commands/init";

const program = new Command();

// More visually appealing and informative banner
console.log(
  chalk.cyan(`
╭───────────────────────────────────────────────╮
│                                               │
│        ${chalk.bold.white("Ginji Next.js Drizzle Setup")}            │
│        ${chalk.dim("v1.0.0")}                                 │
│                                               │
╰───────────────────────────────────────────────╯
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

// Add examples section to help output
program.addHelpText(
  "after",
  `
${chalk.bold("Examples:")}
  $ ginji-next-drizzle init                 # Initialize in current directory
  $ ginji-next-drizzle init -y              # Initialize with default options
  $ ginji-next-drizzle init -d ./my-nextjs  # Initialize in specified directory
`
);

program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
