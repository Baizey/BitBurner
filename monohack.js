import {Server} from "./server";

let _data;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const targetName = ns.args[0];
    const target = Server.create(ns, targetName);
    _data = new Data(ns, target);
    ns.disableLog('sleep');
}


class Data {
    /**
     * @param {Ns} ns
     * @param {Server} target
     */
    constructor(ns, target) {
        this.ns = ns;
        this.target = target;
    }
}