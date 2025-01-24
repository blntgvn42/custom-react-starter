#!/usr/bin/env node

import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
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

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    tailwind: false,
    i18n: false,
    projectName: "",
    help: false,
    packageManager: "pnpm",
    authPages: false,
  };

  if (args.some((arg) => arg.startsWith("--all") || arg.startsWith("-a"))) {
    options.tailwind = true;
    options.i18n = true;
    options.projectName = args.find((arg) => !arg.startsWith("--"));
    options.authPages = true;
    return options;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--tailwind") {
      options.tailwind = true;
    } else if (arg === "--i18n") {
      options.i18n = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--auth-pages") {
      options.authPages = true;
    } else if (arg.startsWith("--pm=")) {
      const pm = arg.split("=")[1];
      if (["npm", "pnpm", "yarn", "bun"].includes(pm)) {
        options.packageManager = pm;
      } else {
        log.error(`Invalid package manager: ${pm}`);
        log.info("Supported package managers: npm, pnpm, yarn, bun");
        process.exit(1);
      }
    } else if (!arg.startsWith("--")) {
      options.projectName = arg;
    }
  }

  return options;
};

const showHelp = () => {
  log.title("Custom React Starter CLI Help");
  console.log("\nDescription:");
  log.info(
    "This command line tool helps you create a new React project with the minimum configuration required for a basic web app."
  );

  console.log("\nUsage:");
  log.command(
    `${chalk.cyan("npx")} ${chalk.magenta("@bulent.guven/custom-react-starter")} ${chalk.yellow("<project-name>")} ${chalk.green("[options]")}`
  );

  console.log("\nOptions:");
  console.log(chalk.green("  --help, -h") + "        Show this help message");
  console.log(chalk.green("  --tailwind") + "        Add Tailwind CSS support");
  console.log(
    chalk.green("  --i18n") +
      "            Add i18n (internationalization) support"
  );
  console.log(
    chalk.green("  --pm=<manager>") +
      "    Specify package manager (npm, pnpm, yarn, bun). Default: pnpm"
  );
  console.log(
    chalk.green("  --auth") +
      "    Add authentication pages (login, register)"
  );
  console.log(
    chalk.green("  --all, -a") +
      "    Add both Tailwind CSS and i18n support"
  );

  process.exit(0);
};

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  if (!options.projectName) {
    log.error("Please provide a project name");
    showHelp();
    process.exit(1);
  }

  log.title("Custom React Starter");

  const projectPath = path.join(process.cwd(), options.projectName);

  if (fs.existsSync(projectPath)) {
    log.error(`The directory ${options.projectName} already exists.`);
    process.exit(1);
  }

  const startTime = Date.now();
  log.step(`Creating a new React app in ${chalk.green(projectPath)}`);

  const gitCheckoutCommand = `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${options.projectName}`;
  const installDepsCommand = `cd ${options.projectName} && ${options.packageManager} install`;

  log.info("Downloading files...");
  const checkedOut = runCommand(gitCheckoutCommand);
  if (!checkedOut) process.exit(1);

  // Update package.json with new project name and version
  log.info("Updating package.json...");
  const packageJsonPath = path.join(projectPath, "package.json");
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name = options.projectName;
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

  if (options.tailwind) {
    log.step("Setting up Tailwind CSS...");
    const tailwindCommand = `cd ${options.projectName} && ${options.packageManager} add -D tailwindcss @tailwindcss/vite`;
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
    const viteConfigPath = path.join(options.projectName, "vite.config.ts");
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

  if (options.i18n) {
    log.step("Configuring multi-language support");
    log.info("Installing i18n related dependencies...");
    const i18nInstallCommand = `cd ${options.projectName} && ${options.packageManager === "npm" ? "npm install " : `${options.packageManager} add`} i18next react-i18next i18next-http-backend i18next-browser-languagedetector`;

    const i18nInstalled = runCommand(i18nInstallCommand);
    if (!i18nInstalled) {
      log.error("Failed to install i18n dependencies");
      process.exit(1);
    }

    log.step("Setting up i18n...");
    createI18nConfig(projectPath);
  }

  if (options.authPages) {
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
    fs.writeFileSync(path.join(
      projectPath,
      "src",
      "routes",
      "_layout_auth.tsx"
    ), authLayout);
  }

  // Clean up git
  fs.rmSync(path.join(projectPath, ".git"), { recursive: true, force: true });
  log.step("Initializing Git repository");
  const gitInitCommand = `cd ${options.projectName} && git init && git add . && git commit -m "Initial commit"`;
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
  log.info(`Created ${options.projectName} at ${projectPath}`);
  log.info("Inside that directory, you can run several commands:");
  log.command("pnpm start");
  log.info("  Starts the development server.");
  log.command("pnpm run build");
  log.info("  Bundles the app into static files for production.");
  log.info("\nWe suggest that you begin by typing:");
  log.command(`cd ${options.projectName}`);
  log.command("pnpm start");
  log.info("\nHappy hacking!");
}

main().catch((error) => {
  log.error(`Fatal error: ${error}`);
  process.exit(1);
});
