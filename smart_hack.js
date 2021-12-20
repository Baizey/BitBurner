import {weakenProgress} from "./constants.js";
import {getServers} from "./scan.js";

/** {import("Ns").NS } ns */
let ns;

/** @param {import("Ns").NS } _ns */
export function findBestServer(_ns) {
    ns = _ns;
    const servers = getServers(ns)
        .filter(e => e.name !== 'home')
        .filter(e => ns.getServerMaxMoney(e.name))
        .filter(e => ns.hasRootAccess(e.name));

    servers.forEach(server => {
        server.cycleTime = ns.getWeakenTime(server.name);
        server.maxMoney = ns.getServerMaxMoney(server.name);
        server.hackChance = ns.hackAnalyzeChance(server.name);

        const maxCash = server.maxMoney;
        const target = server.name;
        const maxThreads = Math.floor(ns.getServerMaxRam(ns.getHostname()) / ns.getScriptRam('worker.js'));

        let taking = 0.99;
        let ratio = 1 / (1 - taking) + 0.01;
        let hackThreads = calculateHackThreads(target, taking, maxCash);
        let growThreads = calculateGrowThreads(target, ratio);
        let weakHackThreads = calculateWeakThreads(0, hackThreads);
        let weakGrowThreads = calculateWeakThreads(growThreads, 0);

        while (hackThreads + growThreads + weakHackThreads + weakGrowThreads > maxThreads) {
            taking -= 0.01;
            ratio = 1 / (1 - taking) + 0.01;
            hackThreads = calculateHackThreads(target, taking, maxCash);
            weakHackThreads = calculateWeakThreads(0, hackThreads);
            growThreads = calculateGrowThreads(target, ratio);
            weakGrowThreads = calculateWeakThreads(growThreads, 0);
        }

        server.taking = taking;
        server.cycleEarning = maxCash * server.hackChance * server.taking;
        server.score = server.cycleEarning / server.cycleTime;
    })

    return servers.sort((a, b) => b.score - a.score);

}

/** @param {import("Ns").NS } _ns */
export async function main(_ns) {
    ns = _ns;
    // noinspection InfiniteLoopJS
    while (true) {
        const target = ns.args[0] || findBestServer(ns)[0].name;

        programPrint(`Target: ${target}`)

        const hostname = ns.getHostname();
        const maxCash = ns.getServerMaxMoney(target);
        const maxRam = ns.getServerMaxRam(hostname);

        const threadCost = ns.getScriptRam('worker.js');
        const thisScriptCost = ns.getScriptRam('smart_hack.js');

        const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

        await primeTarget(target);

        let taking = 0.99;
        let ratio = 1 / (1 - taking) + 0.01;
        let hackThreads = calculateHackThreads(target, taking, maxCash);
        let growThreads = calculateGrowThreads(target, ratio);
        let weakHackThreads = calculateWeakThreads(0, hackThreads);
        let weakGrowThreads = calculateWeakThreads(growThreads, 0);

        programPrint(`Ideal Hack: ${taking}, ${ratio}, ${hackThreads}, ${weakHackThreads}, ${growThreads}, ${weakGrowThreads}`)

        while (hackThreads + growThreads + weakHackThreads + weakGrowThreads > maxThreads) {
            taking -= 0.01;
            ratio = 1 / (1 - taking) + 0.01;
            hackThreads = calculateHackThreads(target, taking, maxCash);
            weakHackThreads = calculateWeakThreads(0, hackThreads);
            growThreads = calculateGrowThreads(target, ratio);
            weakGrowThreads = calculateWeakThreads(growThreads, 0);
        }

        programPrint(`Actual Hack: ${taking}, ${ratio}, ${hackThreads}, ${weakHackThreads}, ${growThreads}, ${weakGrowThreads}`)

        const timestamp = Date.now() + 5000;

        const growTime = ns.getGrowTime(target);
        const hackTime = ns.getHackTime(target);
        const weakTime = ns.getWeakenTime(target);

        _hack(target, hackThreads, timestamp + weakTime + 500 - hackTime);

        _weaken(target, weakHackThreads, timestamp + weakTime + 1000 - weakTime);

        _grow(target, growThreads, timestamp + weakTime + 1500 - growTime);

        const isRunning = _weaken(target, weakGrowThreads, timestamp + weakTime + 2000 - weakTime);

        while (isRunning()) await ns.sleep(100);
    }
}

/**
 * @param {string} target
 */
async function primeTarget(target) {
    const hostname = ns.getHostname();
    const minSec = ns.getServerMinSecurityLevel(target);
    const maxCash = ns.getServerMaxMoney(target);
    const maxRam = ns.getServerMaxRam(hostname);

    const threadCost = ns.getScriptRam('worker.js');
    const thisScriptCost = ns.getScriptRam('smart_hack.js');

    const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

    programPrint(`Security: ${ns.getServerSecurityLevel(target)} > ${minSec}`)
    while (ns.getServerSecurityLevel(target) > minSec) {
        const security = ns.getServerSecurityLevel(target) - minSec;
        const threads = Math.min(Math.ceil(security / weakenProgress), maxThreads);
        programPrint(`Security threads: ${threads}`)
        const isRunning = _weaken(target, threads);
        while (isRunning()) await ns.sleep(100);
    }
    programPrint(`Security: ${ns.getServerSecurityLevel(target)} > ${minSec}`)

    programPrint(`Money: ${ns.getServerMoneyAvailable(target)} < ${maxCash}`)
    while (ns.getServerMoneyAvailable(target) < maxCash) {
        let ratio = maxCash / ns.getServerMoneyAvailable(target);

        let growThreads = calculateGrowThreads(target, ratio);
        let weakThreads = calculateWeakThreads(growThreads);
        programPrint(`Ideal Grow threads: ${ratio}, ${growThreads}, ${weakThreads}`)

        while (growThreads + weakThreads > maxThreads) {
            ratio -= 0.01;
            growThreads = calculateGrowThreads(target, ratio);
            weakThreads = calculateWeakThreads(growThreads);
        }

        programPrint(`Actual Grow threads: ${ratio}, ${growThreads}, ${weakThreads}`)

        const stamp = Date.now() + 5000;
        _grow(target, growThreads, stamp);
        const isRunning = _weaken(target, weakThreads, stamp);
        while (isRunning()) await ns.sleep(100);
        programPrint(`Money: ${ns.getServerMoneyAvailable(target)} < ${maxCash}`)
    }
}

/**
 * @param {string} target
 * @param {number} taking
 * @param {number} maxCash
 * @returns {number}
 */
function calculateHackThreads(target, taking, maxCash) {
    return Math.floor(ns.hackAnalyzeThreads(target, taking * maxCash))
}

/**
 * @param {string} target
 * @param {number} ratio
 * @returns {number}
 */
function calculateGrowThreads(target, ratio) {
    return Math.ceil(ns.growthAnalyze(target, ratio));
}

/**
 * @param {number} growThreads
 * @param {number} hackThreads
 * @returns {number}
 */
function calculateWeakThreads(growThreads, hackThreads = 0) {
    const security = Math.ceil(ns.growthAnalyzeSecurity(growThreads) + ns.hackAnalyzeSecurity(hackThreads));
    return Math.ceil(security / weakenProgress);
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

    programPrint(new Date().toISOString());
    ns.exec('worker.js', host, threads, target, 'weaken', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'weaken', timestamp);
}

/**
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 */
function _hack(target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    programPrint(new Date().toISOString());
    ns.exec('worker.js', host, threads, target, 'hack', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'hack', timestamp);
}

/**
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 * @private
 */
function _grow(target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    programPrint(new Date().toISOString());
    ns.exec('worker.js', host, threads, target, 'grow', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'grow', timestamp);
}

function programPrint(data) {
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