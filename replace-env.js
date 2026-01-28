/**
 * Script to replace environment variables in production build
 * This will be used during deployment to inject actual API URL and Stripe keys
 */

const fs = require('fs');
const path = require('path');

// Get environment variables or use defaults
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5000/api/';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51SuRgi2KcqO1GUZP8kxeFzorQlkClPbvh1c8AJpJn9Uer3IAGCr88ZjX7ukVTL1KMIBGyn7XGsuBreuacb1FdjuF00PDencxcz';

// Path to the built files
const distDir = path.join(__dirname, 'dist', 'Ecommerce');
const indexHtmlPath = path.join(distDir, 'index.html');
const mainJsPath = path.join(distDir, 'main.*.js'); // May need to adjust for actual filename

// Replace placeholders in index.html if it exists
if (fs.existsSync(indexHtmlPath)) {
  let indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Replace placeholders
  indexContent = indexContent.replace(/\${BACKEND_API_URL}/g, BACKEND_API_URL);
  indexContent = indexContent.replace(/\${STRIPE_PUBLISHABLE_KEY}/g, STRIPE_PUBLISHABLE_KEY);
  
  fs.writeFileSync(indexHtmlPath, indexContent);
  console.log('Replaced environment variables in index.html');
}

// Look for main.js file in dist directory and replace placeholders
const files = fs.readdirSync(distDir);
files.forEach(file => {
  if (file.startsWith('main.') && file.endsWith('.js')) {
    const mainJsPath = path.join(distDir, file);
    let mainContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Replace placeholders
    mainContent = mainContent.replace(/\$\{BACKEND_API_URL\}/g, BACKEND_API_URL);
    mainContent = mainContent.replace(/\$\{STRIPE_PUBLISHABLE_KEY\}/g, STRIPE_PUBLISHABLE_KEY);
    
    fs.writeFileSync(mainJsPath, mainContent);
    console.log(`Replaced environment variables in ${file}`);
  }
});

console.log('Environment variable replacement completed.');