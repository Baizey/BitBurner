/** @param {import("Ns").NS } ns */
import {getServers} from "./scan.js";

export async function main(ns) {
    const [target] = ns.args;

    const minSec = ns.getServerMinSecurityLevel(target);
    const maxCash = ns.getServerMaxMoney(target);

    const slaves = getServers(ns)
        .filter(e => !e.isHome())
        .filter(e => ns.hasRootAccess(e.name));

    for (const server of slaves) {
        await ns.scp('updater.js', ns.getCurrentServer(), server.name);
        ns.exec('updater.js', server.name);
    }

    while (true) {
        slaves.forEach(slave => {
            const used = ns.getServerUsedRam(slave.name);
            const max = ns.getServerMaxRam(slave.name);
            const free = max - used;
            const cost = Math.max(
                ns.getScriptRam('hack.js'),
                ns.getScriptRam('grow.js'),
                ns.getScriptRam('weak.js'));
            const threads = Math.floor(free / cost);

            if (threads < 1) return;

            if (ns.getServerSecurityLevel(target) > minSec)
                ns.exec('weak.js', slave.name, threads);
            else if (ns.getServerMoneyAvailable(target) < maxCash)
                ns.exec('grow.js', slave.name, threads);
            else
                ns.exec('hack.js', slave.name, threads);
        });
        await ns.sleep(1000);
    }
}


/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}