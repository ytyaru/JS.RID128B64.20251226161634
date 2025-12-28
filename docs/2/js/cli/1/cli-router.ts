type RunFn = (args:string[]) => string;
type CondFn = (args:string[]) => boolean;
type Route = {condFn:CondFn, runFn:RunFn};
type CliRouterProp = {args:string[], routes:Route[], defaultFn:RunFn};
export default class CliRouter {
    private _: CliRouterProp;
    constructor(defaultFn:RunFn) {this._ = {args:process.argv.slice(2), routes:[], defaultFn:defaultFn}}
    add(condFn:CondFn, runFn:RunFn) {this._.routes.push({condFn, runFn});}
    route() {
        for (let r of this._.routes) {if (r.condFn(this._.args)) {r.runFn(this._.args); return;}}
        this._.defaultFn(this._.args);
    }
}

