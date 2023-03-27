import * as CryptoJS from 'crypto-js';

export const signAesDecrypt = (signature: string) => {
  if (!signature) {
    console.error('signAesDecrypt 参数错误');
  }
  const key = 'Arws3bH7Yiac96JFpIql10fOuBeZy4hognRQP8jKdxGkEDUmTSCXVLt5zN2WMv!';
  const bytes = CryptoJS.AES.decrypt(signature, key);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;
};
