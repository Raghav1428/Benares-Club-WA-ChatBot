import fs from 'fs';
import path from 'path';

const OPTIN_FILE = path.resolve(process.cwd(), 'optins.json');

let optinMap = {};
try {
  const rawData = fs.readFileSync(OPTIN_FILE, 'utf-8');
  optinMap = JSON.parse(rawData);
} catch {
  optinMap = {};
}

export const getOptinStatus = (phone) => {
  console.log('Checking for optin status');
  return optinMap[phone];
};

export const setOptinStatus = (phone, status) => {
  optinMap[phone] = status;
  try {
    fs.writeFileSync(OPTIN_FILE, JSON.stringify(optinMap, null, 2));
    console.log(`✅ Optin status saved for ${phone}: ${status}`);
  } catch (err) {
    console.error('❌ Failed to write optins.json:', err.message);
  }
};