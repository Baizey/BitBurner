import {getServers} from "./scan.js";
import {Target} from "./target.js";


/**
 * @param {import("Ns").NS } ns
 * @returns {Target[]}
 */
function findBestServer(ns) {
    const servers = getServers(ns)
        .filter(e => e.name !== 'home')
        .filter(e => !e.name.startsWith('server'))
        .filter(e => ns.getServerMaxMoney(e.name))
        .filter(e => ns.hasRootAccess(e.name))
        .filter(e => ns.getServerRequiredHackingLevel(e.name) <= ns.getHackingLevel())
        .map(e => new Target(ns, e.name));

    servers.forEach(server => {
        const hackChance = ns.hackAnalyzeChance(server.name);
        const maxCash = ns.getServerMaxMoney(server.name);
        const maxThreads = Math.floor(ns.getServerMaxRam(ns.getHostname()) / ns.getScriptRam('worker.js'));

        let taking = 0.99;
        let threads = server.calculateHack(taking);

        while (threads.total > maxThreads) {
            taking -= 0.01;
            threads = server.calculateHack(taking);
        }

        server.cycleTime = ns.getWeakenTime(server.name);
        server.cycleEarning = maxCash * hackChance * taking;
        server.score = server.cycleEarning / server.cycleTime;
    })

    return servers.sort((a, b) => b.score - a.score);

}

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    if (/^\d+$/.test(`${ns.args[0]}`)) {
        const servers = findBestServer(ns);
        const max = Math.min(Number(ns.args[0]), servers.length) || servers.length;
        for (let i = 0; i < max; i++)
            ns.run('smart_hack.js', 1, servers[i].name);
        return;
    }

    // noinspection InfiniteLoopJS
    while (true) {
        const name = ns.args[0] || findBestServer(ns)[0].name;
        const target = new Target(ns, name);

        const maxRam = ns.getServerMaxRam(target.host);
        const threadCost = ns.getScriptRam('worker.js');
        const thisScriptCost = ns.getScriptRam('smart_hack.js');
        const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

        await primeTarget(ns, target);

        const threads = target.calculateHack(0.99, maxThreads);

        const timestamp = Date.now() + 5000;
        const growTime = ns.getGrowTime(target.name);
        const hackTime = ns.getHackTime(target.name);
        const weakTime = ns.getWeakenTime(target.name);

        target.hack(threads.hack, timestamp + weakTime + 500 - hackTime);
        target.weaken(threads.hackWeak, timestamp + weakTime + 1000 - weakTime);
        target.grow(threads.grow, timestamp + weakTime + 1500 - growTime);
        const isRunning = target.weaken(threads.growWeak, timestamp + weakTime + 2000 - weakTime);

        while (isRunning()) await ns.sleep(100);
    }
}

/**
 * @param {import("Ns").NS } ns
 * @param {Target} target
 */
async function primeTarget(ns, target) {
    const maxRam = ns.getServerMaxRam(target.host);

    const threadCost = ns.getScriptRam('worker.js');
    const thisScriptCost = ns.getScriptRam('smart_hack.js');

    const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

    while (target.isSecurityHigh) {
        const isRunning = target.weaken(target.calculateWeaken(target.security, maxThreads));
        while (isRunning()) await ns.sleep(1000);
    }

    while (target.isMoneyLow) {
        const threads = target.calculateGrowth(target.ratio, maxThreads);
        target.grow(threads.grow);
        const isRunning = target.weaken(threads.growWeak);
        while (isRunning()) await ns.sleep(1000);
    }
}

/**
 @param {import("Ns").NS } ns
 * @param  {any} data
 */
function programPrint(ns, data) {
    ns.tprint(data);
}

// noinspection JSUnusedGlobalSymbols
/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}