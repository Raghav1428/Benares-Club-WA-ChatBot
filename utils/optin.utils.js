import fs from 'fs';
const OPTIN_FILE = '../optins.json';

let optinMap = {};
try {
  const rawData = fs.readFileSync(OPTIN_FILE, 'utf-8');
  optinMap = JSON.parse(rawData);
} catch {
  optinMap = {};
}

export const getOptinStatus = (phone) => {
  return optinMap[phone]; 
};

export const setOptinStatus = (phone, status) => {
  optinMap[phone] = status;
  fs.writeFileSync(OPTIN_FILE, JSON.stringify(optinMap, null, 2));
};
