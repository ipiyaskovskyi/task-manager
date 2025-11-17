#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n✅ Generated JWT_SECRET:');
console.log(secret);
console.log('\n📝 Add this to your .env file:');
console.log(`JWT_SECRET=${secret}\n`);
