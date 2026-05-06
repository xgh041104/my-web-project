// WebSocket连接参数处理类
export default class WsParam {
  constructor(APPID, APIKey, APISecret, gptUrl) {
    this.APPID = APPID;
    this.APIKey = APIKey;
    this.APISecret = APISecret;
    const parsedUrl = new URL(gptUrl);
    this.host = parsedUrl.host;
    this.path = parsedUrl.pathname;
    this.gptUrl = gptUrl;
  }

  async createUrl() {
    const now = new Date();
    const date = now.toUTCString();

    const signatureOrigin = `host: ${this.host}\ndate: ${date}\nGET ${this.path} HTTP/1.1`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.APISecret);
    const data = encoder.encode(signatureOrigin);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureShaBase64 = btoa(String.fromCharCode(...signatureArray));

    const authorizationOrigin = `api_key="${this.APIKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureShaBase64}"`;
    const authorization = btoa(authorizationOrigin);

    const params = new URLSearchParams({
      authorization,
      date,
      host: this.host
    });

    return `${this.gptUrl}?${params.toString()}`;
  }
}
