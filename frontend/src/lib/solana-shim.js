/**
 * Universal shim for @solana/* packages.
 *
 * @web3auth/modal transitively imports from several @solana/* v2 ("Solana Kit")
 * packages, but this app only uses the EVM (wagmi) side of Web3Auth.  The Solana
 * Kit packages have deep peer-dep chains that bloat the install and cause
 * build-time crashes when left unresolved.
 *
 * Rather than installing the full Solana Kit tree, we alias every @solana/*
 * package to this shim in next.config.js.  The Proxy ensures that ANY named
 * import (e.g. `getTransactionDecoder`) resolves to a no-op function instead of
 * `undefined`, preventing "is not a function" errors during module evaluation
 * on the server.
 *
 * At runtime the Solana code paths are never reached (SolanaProvider renders
 * client-only), so the no-op behaviour is safe.
 */

function noop() {
  return noop;
}

const shim = new Proxy(noop, {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return shim;
    if (prop === Symbol.toPrimitive) return () => '';
    if (prop === Symbol.iterator) return function* () {};
    return noop;
  },
});

module.exports = shim;
module.exports.default = shim;
