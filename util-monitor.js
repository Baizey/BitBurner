import {Server} from "util-server.js";
import {asFormat, asPercent} from "util-utils.js";

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    ns.disableLog('ALL');
    const target = Server.create(ns, ns.args[0]);

    while (true) {
        ns.clearLog();
        ns.print(`Target: ${target.name}`)
        ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio)})`)
        ns.print(`Security: ${target.securityExcess}`)
        await ns.sleep(1);
    }

}