import {getServers} from "./scan.js";
import {Target} from "./target.js";


/**
 * @param {import("Ns").NS } ns
 * @returns {Target[]}
 */
function findBestServer(ns) {
    const servers = getServers(ns)
        .filter(e => e.name !== 'home')
        .filter(e => ns.getServerMaxMoney(e.name))
        .filter(e => ns.hasRootAccess(e.name))
        .filter(e => ns.getServerRequiredHackingLevel(e.name) <= ns.getHackingLevel())
        .map(e => new Target(ns, e.name));

    programPrint(ns, servers.map(e => e.name))

    servers.forEach(server => {
        const hackChance = ns.hackAnalyzeChance(server.name);
        const maxCash = ns.getServerMaxMoney(server.name);
        const maxThreads = Math.floor(ns.getServerMaxRam(ns.getHostname()) / ns.getScriptRam('worker.js'));

        const threads = server.calculateCycleThreads(0.99, maxThreads);

        server.cycleTime = ns.getWeakenTime(server.name);
        server.cycleEarning = maxCash * hackChance * threads.taking;
        server.score = server.cycleEarning / server.cycleTime;
    })

    programPrint(ns, servers.map(e => e.name))
    return servers.sort((a, b) => b.score - a.score);

}

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    ns.disableLog('ALL');

    const [name] = ns.args;

    if (typeof (name) === 'number') {
        const servers = findBestServer(ns);
        const max = Math.min(name, servers.length) || servers.length;
        for (let i = 0; i < max; i++)
            ns.run('smart_hack.js', 1, servers[i].name);
        return;
    }

    const target = new Target(ns, name);
    
    while (true) {
        await target.prepare();
        await target.startCycle({await: true});
    }
}

/**
 @param {import("Ns").NS } ns
 * @param  {any} data
 */
function programPrint(ns, data) {
    ns.print(data);
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