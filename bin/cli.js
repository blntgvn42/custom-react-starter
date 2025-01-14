#!/usr/bin/env node

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unknown error occurred'));
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
  fs.writeFileSync(path.join(projectPath, 'src', 'i18n.ts'), i18nConfig);
};

const main = async ()=> {
  try {
    // Validate command line arguments
    const repoName = process.argv[2];
    if (!repoName) {
      console.error(chalk.red('Please specify the project name: ') + chalk.yellow('npx @bulent.guven/custom-react-starter my-app'));
      process.exit(1);
    }

    // Get user preferences
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'multiLanguageSupport',
        message: chalk.cyan('Do you want multi-language support?'),
        default: false,
      },
    ]);

    // Setup commands
    const gitCheckoutCommand = `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${repoName}`;
    const installCommand = `cd ${repoName} && pnpm install`;

    // Clone repository
    console.log(chalk.blue(`\n📦 Creating a new React project with the name of ${chalk.bold(repoName)}...`));
    const checkedOut = runCommand(gitCheckoutCommand);
    if (!checkedOut) {
      console.error(chalk.red('❌ Failed to clone the repository'));
      process.exit(1);
    }

    // Install dependencies
    console.log(chalk.blue('\n🚀 Installing dependencies...'));
    const installed = runCommand(installCommand);
    if (!installed) {
      console.error(chalk.red('❌ Failed to install dependencies'));
      process.exit(1);
    }

    const gitFolderPath = path.join(repoName, '.git');
    if (fs.existsSync(gitFolderPath)) {
      fs.rmSync(gitFolderPath, { recursive: true, force: true });
      console.log(chalk.green('\n🔄 Disconnected from the original Git repository.'));
    }

    // Handle multi-language support
    if (answers.multiLanguageSupport) {
      console.log(chalk.blue('\n🌐 Adding multi-language support...'));
      const i18nInstallCommand = `cd ${repoName} && pnpm add i18next react-i18next i18next-http-backend i18next-browser-languagedetector`;
      
      const i18nInstalled = runCommand(i18nInstallCommand);
      if (!i18nInstalled) {
        console.error(chalk.red('❌ Failed to install i18n dependencies'));
        process.exit(1);
      }

      createI18nConfig(repoName);
      console.log(chalk.green('✨ Multi-language support added!'));
    } else {
      console.log(chalk.yellow('\n⏭️  Skipping multi-language support setup.'));
    }

    // Initialize a new Git repository
    console.log(chalk.blue('\n📝 Initializing a new Git repository...'));
    const gitInitCommand = `cd ${repoName} && git init && git add . && git commit -m "Initial commit"`;
    const gitInitialized = runCommand(gitInitCommand);
    if (!gitInitialized) {
      console.error(chalk.yellow('⚠️  Git initialization failed. You may need to initialize it manually.'));
    } else {
      console.log(chalk.green('✅ Git repository initialized with an initial commit.'));
    }

    console.log(chalk.green('\n🎉 Project setup complete! 🎉'));
    console.log(chalk.cyan('\nTo get started:'));
    console.log(chalk.white(`  cd ${chalk.bold(repoName)}`));
    console.log(chalk.white('  pnpm run dev\n'));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('Setup failed:', error.message));
    } else {
      console.error(chalk.red('Setup failed with an unknown error'));
    }
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(chalk.red('Fatal error:', error));
  process.exit(1);
});