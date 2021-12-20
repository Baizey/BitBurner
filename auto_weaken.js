import {getServers} from "./scan.js";
import {weakenProgress} from "./constants.js";

/** {import("Ns").NS } ns */
let ns;

/**
 * @param {import("Ns").NS } _ns
 * @returns {void}
 */
export async function main(_ns) {
    ns = _ns;
    const servers = getServers(ns).map(e => e.name);
    while (true) {
        for (const server of servers) {
            if (!ns.hasRootAccess(server)) continue;
            if (!ns.getServerMaxMoney(server)) continue;
            const minSec = ns.getServerMinSecurityLevel(server);
            const security = ns.getServerSecurityLevel(server) - minSec;
            const currMax = Math.floor((ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname())) / ns.getScriptRam('worker.js'));

            ns.print(`Current max: ${currMax}`)

            while (currMax === 0) {
                await ns.sleep(10000);}

            const threads = Math.min(Math.ceil(security / weakenProgress), currMax);
            if (threads > 0) _weaken(server, threads);
        }

        await ns.sleep(10000);
    }
}


/**
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 */
function _weaken(target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    ns.exec('worker.js', host, threads, target, 'weaken', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'weaken', timestamp);
}