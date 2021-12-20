import {getServers} from "./scan.js";
import {files} from "./updater.js";
import {weakenProgress} from "./constants.js";

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    const [target] = ns.args.map(e => `${e}`);

    const minSec = ns.getServerMinSecurityLevel(target);
    const maxCash = ns.getServerMaxMoney(target);

    while (true) {
        const slaves = await getSlaves(ns);

        const currencySec = ns.getServerSecurityLevel(target);
        const currentMoney = ns.getServerMoneyAvailable(target)

        const missingMoneyFactor = maxCash / currentMoney;
        const growthThreads = Math.ceil(ns.growthAnalyze(target, missingMoneyFactor));

        const neededSec = currencySec - minSec;
        const secThreads = Math.ceil(neededSec / weakenProgress);
        
        for (const slave of slaves) {
            const used = ns.getServerUsedRam(slave.name);
            const max = ns.getServerMaxRam(slave.name);
            const free = max - used;
            const cost = Math.max(
                ns.getScriptRam('hack.js'),
                ns.getScriptRam('grow.js'),
                ns.getScriptRam('weak.js'));
            const threads = Math.floor(free / cost);

            if (threads < 1) continue;

            if (ns.getServerSecurityLevel(target) > minSec)
                ns.exec('weak.js', slave.name, threads, target);
            else if (ns.getServerMoneyAvailable(target) < maxCash)
                ns.exec('grow.js', slave.name, threads, target);
            else
                ns.exec('hack.js', slave.name, threads, target);
        }
        await ns.sleep(1000);
    }
}

/** @param {import("Ns").NS } ns */
async function getSlaves(ns) {
    const slaves = getServers(ns)
        .filter(e => !e.isHome())
        .filter(e => ns.hasRootAccess(e.name));

    for (const slave of slaves) {
        await ns.scp(files.map(e => `${e}.js`), ns.getHostname(), slave.name);
    }

    return slaves;
}


/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}