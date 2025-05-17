import fs from "fs-extra";
import path from "path";

/**
 * Validates if the given directory is a Next.js project
 */
export async function validateNextJsProject(
  projectDir: string
): Promise<boolean> {
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(projectDir, "package.json");
    if (!(await fs.pathExists(packageJsonPath))) {
      return false;
    }

    // Read package.json and check for Next.js dependency
    const packageJson = await fs.readJSON(packageJsonPath);

    // Check if Next.js is a dependency
    const hasNextJs =
      (packageJson.dependencies && packageJson.dependencies.next) ||
      (packageJson.devDependencies && packageJson.devDependencies.next);

    if (!hasNextJs) {
      return false;
    }

    // Check if next.config.js/ts exists
    const hasNextConfig =
      (await fs.pathExists(path.join(projectDir, "next.config.js"))) ||
      (await fs.pathExists(path.join(projectDir, "next.config.mjs"))) ||
      (await fs.pathExists(path.join(projectDir, "next.config.ts")));

    return hasNextConfig;
  } catch (error) {
    console.error(`Error validating Next.js project: ${error}`);
    return false;
  }
}
