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
        let growThreads = ns.growthAnalyze(target, ratio);
        let weakThreads = ns.growthAnalyzeSecurity(growThreads) + ns.hackAnalyzeSecurity(hackThreads);

        while (hackThreads + growThreads + weakThreads > maxThreads) {
            taking -= 0.01;
            ratio = 1 / taking + 0.01;
            hackThreads = ns.hackAnalyzeThreads(target, taking * maxCash);
            growThreads = ns.growthAnalyze(target, ratio);
            weakThreads = ns.growthAnalyzeSecurity(growThreads) + ns.hackAnalyzeSecurity(hackThreads);
        }

        const timestamp = Date.now() + 5000;

        hack(ns, target, hackThreads, timestamp);
        grow(ns, target, hackThreads, timestamp);
        await weaken(ns, target, hackThreads, timestamp);
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

    while (ns.getServerSecurityLevel(target) > minSec) {
        const security = ns.getServerSecurityLevel(target) - minSec;
        const threads = Math.min(
            Math.ceil(security / weakenProgress),
            maxThreads);
        await weaken(ns, target, threads);
    }

    while (ns.getServerMoneyAvailable(target) < maxCash) {
        let ratio = maxCash / ns.getServerMoneyAvailable(target);
        let growThreads = ns.growthAnalyze(target, ratio);
        let weakThreads = ns.growthAnalyzeSecurity(growThreads);
        while (growThreads + weakThreads > maxThreads) {
            ratio -= 0.01;
            growThreads = ns.growthAnalyze(target, ratio);
            weakThreads = ns.growthAnalyzeSecurity(growThreads);
        }

        const stamp = Date.now() + 5000;
        grow(ns, target, growThreads, stamp);
        await weaken(ns, target, weakThreads, stamp);
    }
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 */
async function weaken(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 5000;
    const runtime = ns.getWeakenTime(target);
    ns.run('worker.js', threads, target, 'weaken', timestamp);
    await ns.sleep((timestamp + runtime) - Date.now());
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 */
async function hack(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 5000;
    const runtime = ns.getHackTime(target);
    ns.run('worker.js', threads, target, 'hack', timestamp);
    await ns.sleep((timestamp + runtime) - Date.now());
}

/**
 * @param {import("Ns").NS } ns
 * @param {string} target
 * @param {number} threads
 * @param {number} timestamp
 */
async function grow(ns, target, threads, timestamp = undefined) {
    timestamp ||= Date.now() + 5000;
    const runtime = ns.getGrowTime(target);
    ns.run('worker.js', threads, target, 'grow', timestamp);
    await ns.sleep((timestamp + runtime) - Date.now() + 1000);
}


/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}