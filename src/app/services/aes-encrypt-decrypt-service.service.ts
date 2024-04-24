import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';


@Injectable({
  providedIn: 'root'
})
export class AESEncryptDecryptServiceService {

  secretKey = "595e0f6d-270f-4b52-8fa3-c986b0ab7d4c";
  constructor() { }

  encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, this.secretKey.trim()).toString();
  }
}
