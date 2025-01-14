#! /usr/bin/env node
import { execSync } from 'child_process';


const runCommand = command => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return false;
    }
    return true;
}

const repoName: string = process.argv[2];
const gitCheckoutCommand: string = `git clone --depth 1 https://github.com/blntgvn42/custom-react-starter ${repoName}`;
const installCommand: string = `cd ${repoName} && pnpm install`;

console.log(`Creating a new React project with the name of ${repoName}...`);
const checkedOut = runCommand(gitCheckoutCommand);
if (!checkedOut) process.exit(1);

console.log('Installing dependencies...');
const installed = runCommand(installCommand);
if (!installed) process.exit(1);

console.log('Project is ready! 🚀, Build something fun...');
console.log(`cd ${repoName} && pnpm run dev`);
