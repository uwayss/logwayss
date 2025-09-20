// Test if Web Crypto API is available in Expo
console.log('Testing Web Crypto API availability...');
if (typeof crypto !== 'undefined' && crypto.subtle) {
    console.log('Web Crypto API is available');
    console.log('Available methods:', Object.keys(crypto.subtle));
}
else {
    console.log('Web Crypto API is not available');
}
if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    console.log('Window Crypto API is available');
}
else {
    console.log('Window Crypto API is not available');
}
