import '@testing-library/jest-dom';

// Polyfills necessários para react-router v7 no ambiente JSDOM do CRA
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
