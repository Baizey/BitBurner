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

        const threads = server.calculateHack(0.99, maxThreads);

        server.cycleTime = ns.getWeakenTime(server.name);
        server.cycleEarning = maxCash * hackChance * threads.taking;
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
        const bestAuto = findBestServer(ns)[0];
        programPrint(ns, bestAuto)

        const name = ns.args[0] || bestAuto.name;
        const target = new Target(ns, name);

        programPrint(ns, `Target ${name}`)

        const maxRam = ns.getServerMaxRam(target.host);
        const threadCost = ns.getScriptRam('worker.js');
        const thisScriptCost = ns.getScriptRam('smart_hack.js');
        const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

        programPrint(ns, `Preparing...`)
        await target.prepare();

        const threads = target.calculateHack(0.99, maxThreads);
        programPrint(ns, threads)

        const timestamp = Date.now() + 5000;
        const growTime = ns.getGrowTime(target.name);
        const hackTime = ns.getHackTime(target.name);
        const weakTime = ns.getWeakenTime(target.name);

        programPrint(ns, `Hacking...`)
        target.hack(threads.hack, timestamp + weakTime + 500 - hackTime);
        target.weaken(threads.hackWeak, timestamp + weakTime + 1000 - weakTime);
        target.grow(threads.grow, timestamp + weakTime + 1500 - growTime);
        await target.weaken(threads.growWeak, timestamp + weakTime + 2000 - weakTime);
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