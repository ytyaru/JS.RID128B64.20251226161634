const VERSION:string = `0.0.1`;
class RID128B64 {
    static get():string {return this.#uint8ToBase64URL(this.#random)}
    static get #random():Uint8Array {return crypto.getRandomValues(new Uint8Array(128/8))}
    static #uint8ToBase64(bytes:Uint8Array):string {return 'function'===typeof bytes.toBase64 ? bytes.toBase64() : btoa(String.fromCharCode(...bytes))}
    static #uint8ToBase64URL(bytes:Uint8Array):string {return this.#uint8ToBase64(bytes).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
}
type RunFn = (args:string[]) => string;
type CondFn = (args:string[]) => boolean;
type Route = {condFn:CondFn, runFn:RunFn};
type CliRouterProp = {args:string[], routes:Route[], defaultFn:RunFn};
class CliRouter {
    private _: CliRouterProp;
    constructor(defaultFn:RunFn) {this._ = {args:process.argv.slice(2), routes:[], defaultFn:defaultFn}}
    add(condFn:CondFn, runFn:RunFn) {this._.routes.push({condFn, runFn});}
    route() {
        for (let r of this._.routes) {if (r.condFn(this._.args)) {r.runFn(this._.args); return;}}
        this._.defaultFn(this._.args);
    }
}
const CLI = new CliRouter(()=>console.log(RID128B64.get()));
CLI.add((args)=>'--version'===args[0], ()=>console.log(VERSION));
CLI.add((args)=>'--help'===args[0], ()=>console.log(`ランダムIDを出力する。128bitsの暗号論的安全乱数をBase64URLで出力する。${VERSION}\nhttps://github.com/ytyaru/JS.RID128B64.20251226161634`));
CLI.route();

