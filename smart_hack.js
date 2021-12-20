import {weakenProgress} from "./constants.js";

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    const [target] = ns.args.map(e => `${e}`);

    const hostname = ns.getHostname();
    const maxCash = ns.getServerMaxMoney(target);
    const maxRam = ns.getServerMaxRam(hostname);

    const threadCost = ns.getScriptRam('worker.js');
    const thisScriptCost = ns.getScriptRam('smart_hack.js');

    const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

    while (true) {
        await primeTarget(ns, target);

        let taking = 0.99;
        let ratio = 1 / taking + 0.01;
        let hackThreads = ns.hackAnalyzeThreads(target, taking * maxCash);
        let growThreads = calculateGrowThreads(ns, target, ratio);
        let weakThreads = calculateWeakThreads(ns, growThreads, hackThreads);
        ns.tprint(`Hack: ${taking}, ${ratio}, ${hackThreads}, ${growThreads}, ${weakThreads}`)

        while (hackThreads + growThreads + weakThreads > maxThreads) {
            taking -= 0.01;
            ratio = 1 / taking + 0.01;
            hackThreads = Math.floor(ns.hackAnalyzeThreads(target, taking * maxCash));
            growThreads = calculateGrowThreads(ns, target, ratio);
            weakThreads = calculateWeakThreads(ns, growThreads, hackThreads);
        }

        ns.tprint(`Hack: ${taking}, ${ratio}, ${hackThreads}, ${growThreads}, ${weakThreads}`)

        const timestamp = Date.now() + 5000;

        _hack(ns, target, hackThreads, timestamp);
        _grow(ns, target, hackThreads, timestamp);
        const isRunning = _weaken(ns, target, hackThreads, timestamp);
        while (isRunning()) await ns.sleep(100);
    }
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 */
async function primeTarget(ns, target) {
    const hostname = ns.getHostname();
    const minSec = ns.getServerMinSecurityLevel(target);
    const maxCash = ns.getServerMaxMoney(target);
    const maxRam = ns.getServerMaxRam(hostname);

    const threadCost = ns.getScriptRam('worker.js');
    const thisScriptCost = ns.getScriptRam('smart_hack.js');

    const maxThreads = Math.floor((maxRam - thisScriptCost) / threadCost);

    ns.tprint(`Security: ${ns.getServerSecurityLevel(target)} > ${minSec}`)
    while (ns.getServerSecurityLevel(target) > minSec) {
        const security = ns.getServerSecurityLevel(target) - minSec;
        const threads = Math.min(Math.ceil(security / weakenProgress), maxThreads);
        ns.tprint(`Security threads: ${threads}`)
        const isRunning = _weaken(ns, target, threads);
        while (isRunning()) await ns.sleep(100);
        ns.tprint(`Security: ${ns.getServerSecurityLevel(target)} > ${minSec}`)
    }

    ns.tprint(`Money: ${ns.getServerMoneyAvailable(target)} < ${maxCash}`)
    while (ns.getServerMoneyAvailable(target) < maxCash) {
        let ratio = maxCash / ns.getServerMoneyAvailable(target);

        let growThreads = calculateGrowThreads(ns, target, ratio);
        let weakThreads = calculateWeakThreads(ns, growThreads);
        ns.tprint(`Grow threads: ${ratio}, ${growThreads}, ${weakThreads}`)

        while (growThreads + weakThreads > maxThreads) {
            ratio -= 0.01;
            growThreads = calculateGrowThreads(ns, target, ratio);
            weakThreads = calculateWeakThreads(ns, growThreads);
            ns.tprint(`Grow threads: ${ratio}, ${growThreads}, ${weakThreads}`)
        }

        const stamp = Date.now() + 5000;
        _grow(ns, target, growThreads, stamp);
        const isRunning = _weaken(ns, target, weakThreads, stamp);
        while (isRunning()) await ns.sleep(100);
        ns.tprint(`Money: ${ns.getServerMoneyAvailable(target)} < ${maxCash}`)
    }
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} ratio
 * @returns {number}
 */
function calculateGrowThreads(ns, target, ratio) {
    return Math.ceil(ns.growthAnalyze(target, ratio));
}

/**
 * @param {import("Ns").NS } ns
 * @param {number} growThreads
 * @param {number} hackThreads
 * @returns {number}
 */
function calculateWeakThreads(ns, growThreads, hackThreads = 0) {
    const security = Math.ceil(ns.growthAnalyzeSecurity(growThreads) + ns.hackAnalyzeSecurity(hackThreads));
    const threads = Math.ceil(security / weakenProgress);
    return threads;
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 */
function _weaken(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    ns.exec('worker.js', host, threads, target, 'weaken', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'weaken', timestamp);
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 */
function _hack(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    ns.exec('worker.js', host, threads, target, 'hack', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'hack', timestamp);
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 * @returns {function(): boolean}
 * @private
 */
function _grow(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 1000;
    const host = ns.getHostname();

    ns.exec('worker.js', host, threads, target, 'grow', timestamp);

    return () => ns.isRunning('worker.js', host, target, 'grow', timestamp);
}


/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}