#!/usr/bin/env node

import { checkbox, confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Enhanced logging with emoji support and better formatting
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
  debug: (message) =>
    process.env.DEBUG && console.log(chalk.gray("  ◼ ") + message),
};

// Write translation files
const writeTranslationFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
  }
};

// Enhanced command runner with better error handling
const runCommand = (command, cwd = process.cwd()) => {
  log.debug(`Running command: ${command}`);
  try {
    execSync(command, { stdio: "ignore", cwd });
    return true;
  } catch (error) {
    log.error(`Command failed: ${chalk.yellow(command)}`);
    if (error instanceof Error) {
      log.error(`Error: ${error.message}`);
    }
    return false;
  }
};

// Improved i18n configuration with better type safety
const configureI18n = (projectPath, packageManager, projectName) => {
  try {
    const i18nInstallCommand = `cd ${projectName} && ${packageManager === "npm" ? "npm install" : `${packageManager} add`} i18next react-i18next i18next-http-backend i18next-browser-languagedetector`;

    const i18nInstalled = runCommand(i18nInstallCommand);
    if (!i18nInstalled) {
      log.error("Failed to install i18n dependencies");
      process.exit(1);
    }

    const localesPath = path.join(projectPath, "locales");
    const enPath = path.join(localesPath, "en");
    const trPath = path.join(localesPath, "tr");
    const typesPath = path.join(projectPath, "src", "@types");

    // Create directories recursively
    [enPath, trPath, typesPath].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    writeTranslationFile(path.join(enPath, "translation.json"), {
      welcome: "Welcome to the React App!",
      description: "This is a custom React starter template.",
      language: "Language",
    });

    writeTranslationFile(path.join(trPath, "translation.json"), {
      welcome: "React Uygulamasına Hoşgeldiniz!",
      description: "Bu, özel bir React başlangıç şablonudur.",
      language: "Dil",
    });

    // Create i18n configuration
    const i18nConfig = `import i18n from 'i18next';
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
    debug: process.env.NODE_ENV !== 'production',
    resources: {
      en: { translation: enTranslation },
      tr: { translation: trTranslation },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;`;

    const i18nPath = path.join(projectPath, "src", "i18n.ts");
    if (!fs.existsSync(i18nPath)) {
      fs.writeFileSync(i18nPath, i18nConfig);
    }

    // Update main.tsx with proper AST manipulation
    const mainFilePath = path.join(projectPath, "src", "main.tsx");
    if (fs.existsSync(mainFilePath)) {
      let content = fs.readFileSync(mainFilePath, "utf-8");

      if (!content.includes("I18nextProvider")) {
        content = content.replace(
          `import './index.css'`,
          `import './index.css';\nimport { I18nextProvider } from 'react-i18next';\nimport i18n from './i18n';`
        );

        content = content.replace(
          /<RouterProvider router={router} \/>/,
          `<I18nextProvider i18n={i18n}>\n  <RouterProvider router={router} />\n</I18nextProvider>`
        );

        fs.writeFileSync(mainFilePath, content);
      }
    }

    // Add TypeScript type definitions
    const i18nTypeDefs = `import 'i18next';
import enTranslation from '../../locales/en/translation.json';
import trTranslation from '../../locales/tr/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'en';
    resources: {
      en: typeof enTranslation;
      tr: typeof trTranslation;
    };
  }
}`;

    const typeDefPath = path.join(typesPath, "i18next.d.ts");
    if (!fs.existsSync(typeDefPath)) {
      fs.writeFileSync(typeDefPath, i18nTypeDefs);
    }
  } catch (error) {
    log.error(`Failed to configure i18n: ${error.message}`);
    process.exit(1);
  }
};

// Improved Tailwind configuration
const configureTailwind = (projectPath, packageManager) => {
  try {
    log.step("Configuring Tailwind CSS v4...");

    // Install Vite-specific Tailwind dependencies
    const installCommand = `${packageManager === "npm" ? "npm install" : `${packageManager} add`} tailwindcss @tailwindcss/vite`;

    if (!runCommand(installCommand, projectPath)) {
      throw new Error("Failed to install Tailwind CSS dependencies");
    }

    // Update vite.config.ts
    const viteConfigPath = path.join(projectPath, "vite.config.ts");
    if (fs.existsSync(viteConfigPath)) {
      let viteConfig = fs.readFileSync(viteConfigPath, "utf-8");

      // Add Tailwind import
      if (!viteConfig.includes("@tailwindcss/vite")) {
        viteConfig = viteConfig.replace(
          /import { defineConfig } from 'vite'/,
          `import { defineConfig } from 'vite';\nimport tailwindcss from '@tailwindcss/vite';`
        );
      }

      // Add to plugins array
      if (!viteConfig.includes("tailwindcss()")) {
        viteConfig = viteConfig.replace(
          /plugins: \[/,
          "plugins: [\n    tailwindcss(),"
        );
      }

      fs.writeFileSync(viteConfigPath, viteConfig);
    }

    // Configure base CSS
    const cssPath = path.join(projectPath, "src", "index.css");
    if (fs.existsSync(cssPath)) {
      fs.writeFileSync(cssPath, `@import "tailwindcss";\n`);
    }

    log.success("Tailwind CSS v4 configured successfully");
  } catch (error) {
    log.error(`Tailwind CSS configuration failed: ${error.message}`);
    process.exit(1);
  }
};

// Add auth pages
const configureAuth = (projectPath) => {
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
 return (
    <React.Fragment>
      Auth Layout
      <Outlet />
    </React.Fragment>
  )
}
  `;
  fs.writeFileSync(
    path.join(projectPath, "src", "routes", "_layout_auth.tsx"),
    authLayout
  );
};

// Add react-query
const configureReactQuery = (projectPath, packageManager) => {
  // Install Vite-specific react-query dependencies
  const installCommand = `${packageManager === "npm" ? "npm install" : `${packageManager} add`} @tanstack/react-query @tanstack/react-query-devtools`;

  if (!runCommand(installCommand, projectPath)) {
    throw new Error("Failed to install react query dependencies");
  }

  const rootPath = path.join(projectPath, "src", "routes", "__root.tsx");
  if (fs.existsSync(rootPath)) {
    let rootTsx = fs.readFileSync(rootPath, "utf-8");
    // Add Tailwind import
    if (!rootTsx.includes("@tanstack/react-query-devtools")) {
      rootTsx = rootTsx.replace(
        /import { TanStackRouterDevtools } from '@tanstack\/router-devtools'/,
        `import { TanStackRouterDevtools } from '@tanstack/router-devtools';\nimport { ReactQueryDevtools } from '@tanstack/react-query-devtools';`
      );
    }


    if (!rootTsx.includes("<ReactQueryDevtools />")) {
      rootTsx = rootTsx.replace(
        /<TanStackRouterDevtools \/>/,
        `<ReactQueryDevtools />
      <TanStackRouterDevtools />`
      );
    }

    fs.writeFileSync(rootPath, rootTsx);
  }

  const mainTsx = path.join(projectPath, "src", "main.tsx");
  if (fs.existsSync(mainTsx)) {
    let content = fs.readFileSync(mainTsx, "utf-8");

    if (!content.includes("QueryClientProvider")) {
      content = content.replace(
        `import { routeTree } from './routeTree.gen'`,
        `import { routeTree } from './routeTree.gen';\nimport { QueryClient, QueryClientProvider } from '@tanstack/react-query';\nconst queryClient = new QueryClient();`
      );

      content = content.replace(
        /<RouterProvider router={router} \/>/,
        `<QueryClientProvider client={queryClient}>\n  <RouterProvider router={router} />\n</QueryClientProvider>`
      );

      fs.writeFileSync(mainTsx, content);
    }
  }
}

// Enhanced project setup validation
const validateProjectName = (name) => {
  const sanitized = name.trim();
  if (!sanitized) return "Project name cannot be empty";
  if (!/^[a-z0-9-]+$/.test(sanitized)) {
    return "Project name should only contain lowercase letters, numbers, and hyphens";
  }
  return true;
};

// Improved Git initialization
const initializeGitRepository = (projectPath) => {
  try {
    log.step("Initializing Git repository...");

    const commands = [
      "git init --quiet",
      "git add .",
      'git commit --quiet -m "Initial commit"',
    ];

    commands.forEach((cmd) => {
      if (!runCommand(cmd, projectPath)) {
        throw new Error(`Git command failed: ${cmd}`);
      }
    });

    log.success("Git repository initialized successfully");
  } catch (error) {
    log.warning(`Git initialization skipped: ${error.message}`);
  }
};

// Main execution flow
async function main() {
  try {
    const { projectName, packageManager, options, initializeGit } = {
      projectName: await input({
        message: "Project name:",
        validate: validateProjectName,
        filter: (input) => input.trim().toLowerCase(),
      }),
      packageManager: await select({
        message: "Package manager:",
        default: "pnpm",
        choices: ["pnpm", "npm", "yarn", "bun"],
      }),
      options: await checkbox({
        message: "Additional features:",
        default: ["tailwind", "i18n", "auth", "reactQuery"],
        choices: [
          { name: "Tailwind CSS", value: "tailwind" },
          { name: "Internationalization (i18n)", value: "i18n" },
          { name: "Authentication Pages", value: "auth" },
          { name: "React Query", value: "reactQuery" }
        ],
      }),
      initializeGit: await confirm({
        message: "Initialize Git repository?",
        default: false,
      }),
    };

    const projectPath = path.resolve(projectName);
    const startTime = Date.now();

    log.title("Starting React Project Setup");

    // Clone template repository
    log.step("Downloading project template...");
    if (fs.existsSync(projectName)) {
      throw new Error(
        `Directory "${projectName}" already exists. Please use a different project name or delete the existing directory.`
      );
    }

    if (
      !runCommand(
        `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${projectName}`
      )
    ) {
      throw new Error("Failed to clone repository");
    }

    // Update package.json
    log.step("Configuring project settings...");
    const packageJsonPath = path.join(projectPath, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    packageJson.name = projectName;
    packageJson.version = "1.0.0";
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Install dependencies
    log.step("Installing dependencies...");
    if (!runCommand(`${packageManager} install`, projectPath)) {
      throw new Error("Dependency installation failed");
    }

    // Configure additional features
    if (options.includes("tailwind")) {
      configureTailwind(projectPath, packageManager);
    }

    if (options.includes("reactQuery")) {
      log.step("Installing react query");
      configureReactQuery(projectPath, packageManager);
    }

    if (options.includes("i18n")) {
      log.step("Setting up internationalization...");
      configureI18n(projectPath, packageManager, projectName);
    }

    if (options.includes("auth")) {
      log.step("Creating authentication pages...");
      configureAuth(projectPath);
    }

    fs.rmSync(path.join(projectPath, "bin"), { recursive: true, force: true });

    // Cleanup and finalize
    log.step("Finalizing setup...");
    fs.rmSync(path.join(projectPath, ".git"), { recursive: true, force: true });
    if (initializeGit) {
      initializeGitRepository(projectPath);
    }

    // Show completion message
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log.success(`Setup completed in ${elapsed} seconds!`);
    console.log(`
Next steps:
  ${chalk.cyan(`cd ${projectName}`)}
  ${chalk.cyan(`${packageManager} run dev`)}
    `);
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
