"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RNaes = require("react-native-aes");
// Check what methods are available
console.log('react-native-aes methods:');
console.log('- encrypt:', typeof RNaes.encrypt);
console.log('- decrypt:', typeof RNaes.decrypt);
console.log('- pbkdf2:', typeof RNaes.pbkdf2);
console.log('- hmac256:', typeof RNaes.hmac256);
console.log('- sha1:', typeof RNaes.sha1);
console.log('- sha256:', typeof RNaes.sha256);
console.log('- randomKey:', typeof RNaes.randomKey);
// Check if it has GCM mode
console.log('Checking for GCM support...');
