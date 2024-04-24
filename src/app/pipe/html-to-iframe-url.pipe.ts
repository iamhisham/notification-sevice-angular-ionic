import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'htmlToIframeUrl' })
export class HTMLToIFrameURLPipe implements PipeTransform {
  
  constructor(private domSanitizer: DomSanitizer) { }
  
  transform(htmlContent: string) {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(`data:text/html;charset=utf-16;base64,${this.b64EncodeUnicode(htmlContent || "")}`);
  }

  b64EncodeUnicode(i: string) {
    const o = new Uint16Array(i.length);
    return Array.prototype.forEach.call(o, (s, T, I) => {
      I[T] = i.charCodeAt(T)
    }), this.base64EncArr(new Uint8Array(o.buffer))
  }

  base64EncArr(i: Uint8Array) {
    const o = (3 - i.length % 3) % 3;
    let s = "";
    for (let T, I = i.length, $ = 0, j = 0; j < I; j++)
      T = j % 3,
        $ |= i[j] << (16 >>> T & 24),
        (T === 2 || i.length - j === 1) && (s += String.fromCharCode(this.uint6ToB64($ >>> 18 & 63), this.uint6ToB64($ >>> 12 & 63), this.uint6ToB64($ >>> 6 & 63), this.uint6ToB64($ & 63)),
          $ = 0);
    return o === 0 ? s : s.substring(0, s.length - o) + (o === 1 ? "=" : "==");
  }

  uint6ToB64(i: number) {
    return i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i === 62 ? 43 : i === 63 ? 47 : 65;
  }
}
