#!/usr/bin/env node

import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

const log = {
  info: (message) => console.log(chalk.blue("ℹ ") + chalk.cyan(message)),
  success: (message) =>
    console.log(chalk.green("✔ ") + chalk.greenBright(message)),
  warning: (message) =>
    console.log(chalk.yellow("⚠ ") + chalk.yellowBright(message)),
  error: (message) =>
    console.error(chalk.red("✖ ") + chalk.redBright(message)),
  title: (message) =>
    console.log(chalk.magenta("\n🚀 ") + chalk.magentaBright.bold(message)),
  step: (message) =>
    console.log(chalk.blue("\n📌 ") + chalk.blueBright(message)),
  command: (message) =>
    console.log(chalk.gray("  $ ") + chalk.whiteBright(message)),
};

const runCommand = (command) => {
  try {
    execSync(command, { stdio: "ignore" });
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
  const localesPath = path.join(projectPath, "locales");
  const enPath = path.join(localesPath, "en");
  const trPath = path.join(localesPath, "tr");
  const typesPath = path.join(projectPath, "src", "@types");

  // Klasörleri oluştur
  fs.mkdirSync(enPath, { recursive: true });
  fs.mkdirSync(trPath, { recursive: true });
  fs.mkdirSync(typesPath, { recursive: true });

  const enTranslation = `
{
  "welcome": "Welcome to the React App!",
  "description": "This is a custom React starter template.",
  "language": "Language"
}`;

  const trTranslation = `
{
  "welcome": "React Uygulamasına Hoşgeldiniz!",
  "description": "Bu, özel bir React başlangıç şablonudur.",
  "language": "Dil"
}`;

  fs.writeFileSync(path.join(enPath, "translation.json"), enTranslation);
  fs.writeFileSync(path.join(trPath, "translation.json"), trTranslation);

  const i18nConfig = `
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from '../locales/en/translation.json';
import trTranslation from '../locales/tr/translation.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: true,
    resources: {
      en: {
        translation: {
          ...enTranslation,
        },
      },
      tr: {
        translation: {
          ...trTranslation,
        },
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
`;
  fs.writeFileSync(path.join(projectPath, "src", "i18n.ts"), i18nConfig);

  const mainFilePath = path.join(projectPath, "src", "main.tsx");
  let mainFileContent = fs.readFileSync(mainFilePath, "utf-8");

  // First, check if i18n is already imported
  if (!mainFileContent.includes("i18n")) {
    // Try different possible patterns for the index.css import
    const patterns = [
      "import './index.css'",
      "import './index.css';",
      'import "./index.css"',
      'import "./index.css";',
    ];

    let replaced = false;
    for (const pattern of patterns) {
      if (mainFileContent.includes(pattern)) {
        mainFileContent = mainFileContent.replace(
          pattern,
          `import './i18n'
import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'

${pattern}`
        );
        replaced = true;
        break;
      }
    }

    if (replaced) {
      // Also add the I18nextProvider wrapper
      mainFileContent = mainFileContent.replace(
        "<RouterProvider router={router} />",
        `<I18nextProvider i18n={i18n}>
  <RouterProvider router={router} />
</I18nextProvider>`
      );

      fs.writeFileSync(mainFilePath, mainFileContent);
      log.success("Updated main.tsx with i18n configuration");
    } else {
      log.error("Could not find index.css import in main.tsx");
    }
  }

  const i18nTSConfig = `
import "i18next";
import enTranslation from "../../locales/en/translation.json";
import trTranslation from "../../locales/tr/translation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "en";
    resources: {
      en: typeof enTranslation;
      tr: typeof trTranslation;
    };
    keySeparator: ".";
    supportedLngs: ["en", "tr"];
  }
}
  `;
  fs.writeFileSync(
    path.join(projectPath, "src", "@types", "i18n.d.ts"),
    i18nTSConfig
  );
};

const showHelp = () => {
  log.title("Custom React Starter CLI Help");
  console.log("\nDescription:");
  log.info(
    "This command line tool helps you create a new React project with the minimum configuration required for a basic web app."
  );

  console.log("\nUsage:");
  log.command(
    `${chalk.cyan("npx")} ${chalk.magenta("@bulent.guven/custom-react-starter")}`
  );
  process.exit(0);
};

async function main() {
  const { projectName, options, pm  } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is the name of the project?",
      validate: (input) => input.trim() !== "",
    },
    {
      type: "list",
      name: "pm",
      message: "Which package manager do you use?",
      choices: ["npm", "pnpm", "yarn", "bun"],
      default: "pnpm",
    },
    {
      type: "checkbox",
      name: "options",
      message: "What options do you want to add?",
      choices: [
        { name: "Tailwind CSS", value: "tailwind" },
        { name: "i18n", value: "i18n" },
        { name: "Authentication", value: "auth" },
      ],
    },
  ]);

  if (!projectName) {
    log.error("Please provide a project name");
    showHelp();
    process.exit(1);
  }

  log.title("Custom React Starter");

  const projectPath = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    log.error(`The directory ${projectName} already exists.`);
    process.exit(1);
  }

  const startTime = Date.now();
  log.step(`Creating a new React app in ${chalk.green(projectPath)}`);

  const gitCheckoutCommand = `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${projectName}`;
  const installDepsCommand = `cd ${projectName} && ${pm} install`;

  log.info("Downloading files...");
  const checkedOut = runCommand(gitCheckoutCommand);
  if (!checkedOut) process.exit(1);

  // Update package.json with new project name and version
  log.info("Updating package.json...");
  const packageJsonPath = path.join(projectPath, "package.json");
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name =projectName;
    packageJson.version = "1.0.0";
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    log.error("Failed to update package.json");
    process.exit(1);
  }

  // Delete bin folder
  const binPath = path.join(process.cwd(), "bin");
  if (fs.existsSync(binPath)) {
    fs.rmSync(binPath, { recursive: true, force: true });
  }

  log.info("Installing dependencies...");
  const installedDeps = runCommand(installDepsCommand);
  if (!installedDeps) process.exit(1);

  if (options.includes("tailwind")) {
    log.step("Setting up Tailwind CSS...");
    const tailwindCommand = `cd ${projectName} && ${pm} add -D tailwindcss @tailwindcss/vite`;
    const installedTailwind = runCommand(tailwindCommand);
    if (!installedTailwind) process.exit(1);

    // --------------------- TAILWIND V4 REMOVED ---------------------
    // Configure Tailwind CSS
    //     const tailwindConfig = path.join(projectPath, 'tailwind.config.js');
    //     fs.writeFileSync(tailwindConfig, `
    // /** @type {import('tailwindcss').Config} */
    // module.exports = {
    //   content: [
    //     "./src/**/*.{js,jsx,ts,tsx}",
    //   ],
    //   theme: {
    //     extend: {},
    //   },
    //   plugins: [],
    // }
    //     `);

    // Add Tailwind directives to index.css
    const indexCssPath = path.join(projectPath, "src", "index.css");
    fs.writeFileSync(indexCssPath, `@import "tailwindcss";`);

    log.info("Updating vite.config.ts to include Tailwind CSS...");

    // 📌 Modify vite.config.ts to include Tailwind plugin
    const viteConfigPath = path.join(projectName, "vite.config.ts");
    if (fs.existsSync(viteConfigPath)) {
      let viteConfig = fs.readFileSync(viteConfigPath, "utf-8");

      if (!viteConfig.includes("@tailwindcss/vite")) {
        viteConfig = viteConfig.replace(
          "export default defineConfig({",
          `import tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({`
        );

        viteConfig = viteConfig.replace(
          "plugins: [",
          "plugins: [\n    tailwindcss(),"
        );

        fs.writeFileSync(viteConfigPath, viteConfig);
        log.success("Added Tailwind CSS to vite.config.ts");
      } else {
        log.warning("Tailwind CSS is already included in vite.config.ts");
      }
    } else {
      log.error("vite.config.ts not found, skipping Tailwind setup.");
    }

    log.success("Tailwind CSS configured successfully.");
  }

  if (options.includes("i18n")) {
    log.step("Configuring multi-language support");
    log.info("Installing i18n related dependencies...");
    const i18nInstallCommand = `cd ${projectName} && ${pm === "npm" ? "npm install" : `${pm} add`} i18next react-i18next i18next-http-backend i18next-browser-languagedetector`;

    const i18nInstalled = runCommand(i18nInstallCommand);
    if (!i18nInstalled) {
      log.error("Failed to install i18n dependencies");
      process.exit(1);
    }

    log.step("Setting up i18n...");
    createI18nConfig(projectPath);
  }

  if (options.includes("auth")) {
    log.step("Setting up authentication pages...");
    const authLayoutPath = path.join(
      projectPath,
      "src",
      "routes",
      "_layout_auth"
    );
    fs.mkdirSync(authLayoutPath, { recursive: true });

    const login = `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout_auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout_auth/login"!</div>
}
  `;

    const register = `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout_auth/register')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout_auth/register"!</div>
}

`;

    fs.writeFileSync(path.join(authLayoutPath, "login.tsx"), login);
    fs.writeFileSync(path.join(authLayoutPath, "register.tsx"), register);

    const authLayout = `import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout_auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
    `;
    fs.writeFileSync(
      path.join(projectPath, "src", "routes", "_layout_auth.tsx"),
      authLayout
    );
  }

  // Clean up git
  fs.rmSync(path.join(projectPath, ".git"), { recursive: true, force: true });
  log.step("Initializing Git repository");
  const gitInitCommand = `cd ${projectName} && git init && git add . && git commit -m "Initial commit"`;
  const gitInitialized = runCommand(gitInitCommand);
  if (!gitInitialized) {
    log.warning(
      "Git initialization failed. You may need to initialize it manually."
    );
  } else {
    log.success("Git repository initialized with initial commit");
  }

  const endTime = Date.now();

  const elapsedTime = (endTime - startTime) / 1000; // in seconds
  log.success(`Total execution time: ${elapsedTime.toFixed(2)} seconds`);

  log.success("Installation completed successfully!");
  log.info(`Created ${projectName} at ${projectPath}`);
  log.info("Inside that directory, you can run several commands:");
  log.command("pnpm start");
  log.info("  Starts the development server.");
  log.command("pnpm run build");
  log.info("  Bundles the app into static files for production.");
  log.info("\nWe suggest that you begin by typing:");
  log.command(`cd ${projectName}`);
  log.command("pnpm start");
  log.info("\nHappy hacking!");
}

main().catch((error) => {
  log.error(`Fatal error: ${error}`);
  process.exit(1);
});
