import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    reset: '\x1b[0m'
};

// Add these lines to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function printStatus(message, success) {
    process.stdout.write(`\r${message}${success ? 
        colors.green + 'done.' + colors.reset : 
        colors.red + 'fail.' + colors.reset}\n`);
}

async function installDependencies() {
    process.stdout.write('> Installing Node.js libs for INJ...');
    try {
        execSync('npm install', { stdio: ['ignore', 'ignore', 'pipe'] });
        printStatus('> Installing Node.js libs for INJ...', true);
        return true;
    } catch (error) {
        printStatus('> Installing Node.js libs for INJ...', false);
        return false;
    }
}

async function setEnvironmentVariable() {
    process.stdout.write('> Creating environment variable...');
    const currentDir = path.resolve(__dirname);
    
    try {
        if (process.platform === 'win32') {
            // Windows: modify PATH using PowerShell
            const command = `
                $currentPath = [Environment]::GetEnvironmentVariable('Path', 'User');
                $newPath = '${currentDir};' + $currentPath;
                [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
            `;
            execSync(`powershell -Command "${command}"`, { stdio: ['ignore', 'ignore', 'pipe'] });
        } else {
            // Linux/MacOS: modify ~/.profile or ~/.bash_profile
            const profilePath = path.join(os.homedir(), '.profile');
            const exportLine = `\nexport PATH="$PATH:${currentDir}"`;
            
            fs.appendFileSync(profilePath, exportLine);
            execSync(`source ${profilePath}`, { stdio: ['ignore', 'ignore', 'pipe'] });
        }
        
        printStatus('> Creating environment variable...', true);
        return true;
    } catch (error) {
        printStatus('> Creating environment variable...', false);
        return false;
    }
}

async function main() {
    if (await installDependencies()) {
        await setEnvironmentVariable();
    }
}

main();
