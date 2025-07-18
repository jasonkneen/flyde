#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import prompts from 'prompts';
import { reportEvent } from '@flyde/core';
import * as os from 'os';

// Generate anonymous ID for this session
const generateAnonymousId = () => 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Get CLI version from package.json
const getCliVersion = () => {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
};

// Build system info
const getSystemInfo = () => ({
  cliVersion: getCliVersion(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  osRelease: os.release(),
  osType: os.type(),
  timestamp: new Date().toISOString()
});

async function main() {
  const userId = generateAnonymousId();
  const systemInfo = getSystemInfo();

  console.log(chalk.blue('🚀 Welcome to Flyde!'));
  console.log(chalk.gray('Creating your visual flow project...\n'));

  // Get project name from args or prompt
  let projectName = process.argv[2];
  
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-flyde-project'
    });
    
    if (!response.projectName) {
      console.log(chalk.red('❌ Project creation cancelled.'));
      process.exit(0);
    }
    
    projectName = response.projectName;
  }

  const projectPath = path.resolve(process.cwd(), projectName);

  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`❌ Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  try {
    // Create project directory
    console.log(chalk.blue('📁 Creating project directory...'));
    fs.ensureDirSync(projectPath);

    // Copy template files
    console.log(chalk.blue('📋 Setting up project files...'));
    const templatePath = path.join(__dirname, '..', 'templates', 'default');
    fs.copySync(templatePath, projectPath);

    // Update package.json with project name
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = projectName;
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });

    // Install dependencies
    console.log(chalk.blue('📦 Installing dependencies...'));
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });

    // Install VS Code extension
    console.log(chalk.blue('🔧 Installing VS Code extension...'));
    try {
      execSync('code --install-extension flyde.flyde-vscode', { stdio: 'pipe' });
      console.log(chalk.green('✅ VS Code extension installed!'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not install VS Code extension automatically.'));
      console.log(chalk.gray('   Please install it manually from the VS Code marketplace.'));
    }

    // Success message
    console.log(chalk.green('\n🎉 Project created successfully!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray(`  cd ${projectName}`));
    console.log(chalk.gray('  code .')); 
    console.log(chalk.gray('  Open hello-world.flyde to get started\n'));

    // Open VS Code automatically
    try {
      console.log(chalk.blue('🚀 Opening VS Code...'));
      execSync(`code "${projectPath}" "${projectPath}/hello-world.flyde"`, { stdio: 'pipe' });
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not open VS Code automatically.'));
      console.log(chalk.gray(`   Please run: cd ${projectName} && code .`));
    }

    // Report success
    reportEvent(userId, 'create-project:success', systemInfo);

  } catch (error) {
    console.error(chalk.red('❌ Error creating project:'), error);
    
    // Report error
    reportEvent(userId, 'create-project:error', {
      ...systemInfo,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Clean up on error
    if (fs.existsSync(projectPath)) {
      fs.removeSync(projectPath);
    }
    process.exit(1);
  }
}

main().catch(console.error);