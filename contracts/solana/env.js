"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.user = exports.secretKeySeed = void 0;
var web3_js_1 = require("@solana/web3.js");
var bs58_1 = require("bs58");
exports.secretKeySeed = [
    141, 50, 173, 182, 62, 254, 159, 225, 72, 220, 42, 203, 73, 173, 125, 240,
    145, 76, 61, 180, 139, 109, 185, 193, 55, 42, 83, 115, 54, 228, 131, 160, 108,
    106, 246, 135, 4, 166, 200, 62, 121, 213, 61, 51, 71, 8, 15, 152, 104, 168,
    67, 209, 205, 169, 230, 244, 245, 151, 129, 119, 48, 136, 219, 206,
];
exports.user = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode("5CRUk4VtepG1AttFqnRgcq8cSYETtw5x1Z5WDPF88TzxWQRxUnp2acvnvesg4mxixpAu2QTzFkJGzWmWBsxoU5Wr"));
