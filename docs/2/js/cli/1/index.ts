import RID128B64 from "./rid128b64.ts";
import CliRouter from "./cli-router.ts";
const VERSION:string = `0.0.1`;
const CLI = new CliRouter(()=>console.log(RID128B64.get()));
CLI.add((args)=>'--version'===args[0], ()=>console.log(VERSION));
CLI.add((args)=>'--help'===args[0], ()=>console.log(`ランダムIDを出力する。128bitsの暗号論的安全乱数をBase64URLで出力する。${VERSION}\nhttps://github.com/ytyaru/JS.RID128B64.20251226161634`));
CLI.route();
