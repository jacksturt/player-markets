export const minimizePubkey = (pubkey: string) => {
  return pubkey.slice(0, 4) + "..." + pubkey.slice(-4);
};
