#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Fashion Era E-commerce Application...');
console.log('=' .repeat(60));

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('Please create a .env file with the required environment variables.');
  process.exit(1);
}

console.log('✅ Environment file found');

// Function to start a process
const startProcess = (command, args, cwd, name, color) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true
    });

    process.stdout.on('data', (data) => {
      console.log(`${color}[${name}]${'\x1b[0m'} ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data) => {
      console.log(`${color}[${name}]${'\x1b[0m'} ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} exited with code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });

    return process;
  });
};

// Function to check if port is available
const checkPort = (port) => {
  return new Promise(async (resolve) => {
    const { createServer } = await import('net');
    const server = createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
};

// Function to wait for server to be ready
const waitForServer = (url, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = async () => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server startup timeout'));
        return;
      }
      
      setTimeout(check, 1000);
    };
    
    check();
  });
};

const main = async () => {
  try {
    // Check if required ports are available
    console.log('🔍 Checking port availability...');
    
    const backendPortAvailable = await checkPort(5000);
    const frontendPortAvailable = await checkPort(3000);
    
    if (!backendPortAvailable) {
      console.log('❌ Port 5000 is already in use. Please stop the process using this port.');
      process.exit(1);
    }
    
    if (!frontendPortAvailable) {
      console.log('❌ Port 3000 is already in use. Please stop the process using this port.');
      process.exit(1);
    }
    
    console.log('✅ Ports 3000 and 5000 are available');
    
    // Start backend server
    console.log('\n🔧 Starting backend server...');
    const backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'pipe',
      shell: true
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`\x1b[32m[Backend]\x1b[0m ${data.toString().trim()}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.log(`\x1b[32m[Backend]\x1b[0m ${data.toString().trim()}`);
    });
    
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend server to start...');
    try {
      await waitForServer('http://localhost:5000/health');
      console.log('✅ Backend server is ready!');
    } catch (error) {
      console.log('❌ Backend server failed to start:', error.message);
      process.exit(1);
    }
    
    // Start frontend development server
    console.log('\n🎨 Starting frontend development server...');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true
    });
    
    frontendProcess.stdout.on('data', (data) => {
      console.log(`\x1b[36m[Frontend]\x1b[0m ${data.toString().trim()}`);
    });
    
    frontendProcess.stderr.on('data', (data) => {
      console.log(`\x1b[36m[Frontend]\x1b[0m ${data.toString().trim()}`);
    });
    
    // Wait a bit for frontend to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🎉 Application started successfully!');
    console.log('=' .repeat(60));
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🔧 Backend:  http://localhost:5000');
    console.log('📊 Health:   http://localhost:5000/health');
    console.log('=' .repeat(60));
    console.log('\n📝 Available Test Accounts:');
    console.log('👤 Customer: customer@example.com / password123');
    console.log('🏪 Seller:   seller@example.com / password123');
    console.log('👑 Admin:    admin@example.com / password123');
    console.log('\n💡 Tips:');
    console.log('• Use Ctrl+C to stop both servers');
    console.log('• Check the .env file for configuration');
    console.log('• Run "node test-backend.js" to test API endpoints');
    console.log('• MongoDB should be running for full functionality');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });
    
    // Keep the process running
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error starting application:', error.message);
    process.exit(1);
  }
};

// Run the application
main();
