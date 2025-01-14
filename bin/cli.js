#!/usr/bin/env node

import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

const log = {
  info: (message) =>
    console.log(`\n${chalk.blue("ℹ ")}${chalk.cyan(message)}`),
  success: (message) =>
    console.log(`\n${chalk.green("✔ ")}${chalk.greenBright(message)}`),
  warning: (message) =>
    console.log(`\n${chalk.yellow("⚠ ")}${chalk.yellowBright(message)}`),
  error: (message) =>
    console.error(`\n${chalk.red("✖ ")}${chalk.redBright(message)}`),
  title: (message) =>
    console.log(
      `\n\n${chalk.magenta("🚀 ")}${chalk.magentaBright.bold(message)}\n`
    ),
  step: (message) =>
    console.log(`\n\n${chalk.blue("📌 ")}${chalk.blueBright(message)}`),
  command: (message) =>
    console.log(`\n  ${chalk.gray("$")} ${chalk.whiteBright(message)}`),
};

const runCommand = (command) => {
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Command failed: ${error.message}`);
    } else {
      log.error("An unknown error occurred while running command");
    }
    return false;
  }
};

const createI18nConfig = (projectPath) => {
  const i18nConfig = `
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
`;
  fs.writeFileSync(path.join(projectPath, "src", "i18n.ts"), i18nConfig);
};

const main = async () => {
  try {
    log.title("Custom React Starter CLI");

    // Validate command line arguments
    const repoName = process.argv[2];
    if (!repoName) {
      log.error("Project name is required!");
      log.command("npx @bulent.guven/custom-react-starter my-app");
      process.exit(1);
    }

    // Get user preferences with styled prompts
    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "multiLanguageSupport",
        message: `${chalk.cyan("🌍")} Do you want multi-language support?`,
        default: false,
      },
      {
        type: "list",
        name: "styleChoice",
        message: `${chalk.cyan("🎨")} Which styling option do you prefer?`,
        choices: ["Pure CSS", "Tailwind CSS"],
        default: "Pure CSS",
      },
    ]);

    log.step(`Creating project: ${chalk.bold(repoName)}`);
    console.log("\n");

    // Clone repository
    const gitCheckoutCommand = `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${repoName}`;
    log.info("Cloning template repository...");
    const checkedOut = runCommand(gitCheckoutCommand);
    if (!checkedOut) {
      log.error("Failed to clone the repository");
      process.exit(1);
    }
    log.success("Template repository cloned successfully");

    // Install dependencies
    log.step("Setting up project dependencies");
    log.info("Installing packages...");
    const installed = runCommand(`cd ${repoName} && pnpm install`);
    if (!installed) {
      log.error("Failed to install dependencies");
      process.exit(1);
    }
    log.success("Dependencies installed successfully");
    console.log("\n");

    // Remove .git folder
    const gitFolderPath = path.join(repoName, ".git");
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true, force: true });
      log.success("Disconnected from template repository");
    }

    const { multiLanguageSupport, styleChoice } = answers;

    // Handle multi-language support
    if (multiLanguageSupport) {
      log.step("Configuring multi-language support");
      const i18nInstallCommand = `cd ${repoName} && pnpm add i18next react-i18next i18next-http-backend i18next-browser-languagedetector`;

      const i18nInstalled = runCommand(i18nInstallCommand);
      if (!i18nInstalled) {
        log.error("Failed to install i18n dependencies");
        process.exit(1);
      }

      createI18nConfig(repoName);
      log.success("Multi-language support configured successfully");
    } else {
      log.warning("Skipping multi-language support");
    }

    // Handle styling setup
    log.step(`Configuring styling: ${styleChoice}`);
    if (styleChoice === "Tailwind CSS") {
      log.info("Installing Tailwind CSS dependencies...");
      runCommand(
        `cd ${repoName} && pnpm add -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
      );

      // Add Tailwind configuration
      const tailwindConfig = `
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};`;
      fs.writeFileSync(
        path.join(repoName, "tailwind.config.js"),
        tailwindConfig
      );

      const tailwindCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;`;
      fs.writeFileSync(path.join(repoName, "src", "index.css"), tailwindCSS);

      log.success("Tailwind CSS configured successfully");
    } else {
      log.info("Using Pure CSS configuration");
    }

    // Initialize Git repository
    log.step("Initializing Git repository");
    const gitInitCommand = `cd ${repoName} && git init && git add . && git commit -m "Initial commit"`;
    const gitInitialized = runCommand(gitInitCommand);
    if (!gitInitialized) {
      log.warning(
        "Git initialization failed. You may need to initialize it manually."
      );
    } else {
      log.success("Git repository initialized with initial commit");
    }

    // Final success message
    console.log("\n");
    log.title("Project Setup Complete!");
    console.log("\n");
    console.log(chalk.cyan("Next steps:"));
    log.command(`cd ${repoName}`);
    log.command("pnpm run dev");
    console.log("\n\n");
  } catch (error) {
    if (error instanceof Error) {
      log.error(`Setup failed: ${error.message}`);
    } else {
      log.error("Setup failed with an unknown error");
    }
    process.exit(1);
  }
};

main().catch((error) => {
  log.error(`Fatal error: ${error}`);
  process.exit(1);
});
