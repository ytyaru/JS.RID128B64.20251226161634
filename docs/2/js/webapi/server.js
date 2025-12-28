import { $ } from "bun";
import { readFileSync, existsSync } from "node:fs";
import RID128B64 from "./rid128b64.mjs";
const CERT_FILE = "cert.pem";
const KEY_FILE = "key.pem";
// 1. 証明書が存在しない場合にのみ生成
if (!existsSync(CERT_FILE) || !existsSync(KEY_FILE)) {
  console.log("証明書を生成中...");
  await $`openssl req -x509 -newkey rsa:4096 -keyout ${KEY_FILE} -out ${CERT_FILE} -sha256 -days 365 -nodes -subj "/C=JP/ST=Tokyo/L=Minato/O=Development/OU=IT/CN=localhost"`;
  console.log("証明書の生成が完了しました。");
}
// 2. Bun.serve で HTTPS サーバーを起動
// https://localhost:8443/rid/api/get でJSONを返す
const PORT = 8443; // Linuxで一般ユーザー時443等1024以下にすると「error: permission denied 0.0.0.0:443」になる
Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if ('/rid/api/get'===url.pathname) {
      return Response.json({
        type: 'rid',
        bits: 128,
        base: 64,
        body: RID128B64.get(),
      });
    }
    return new Response(`次のURLでランダムなIDを持つJSONを返します。<a href="/rid/api/get">/rid/api/get</a>`, {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
  tls: {
    cert: readFileSync(CERT_FILE),
    key: readFileSync(KEY_FILE),
  },
});
console.log(`HTTPS WebAPI サーバーが起動しました: https://localhost:${PORT}`);
