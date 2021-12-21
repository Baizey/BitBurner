﻿import {weakenProgress} from "./constants.js";

const gap = 500;
const maxCycles = 10;

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    const [target] = ns.args;
    
    // noinspection InfiniteLoopJS
    while (true) {
    }
}

class Threads{
    
}


/**
 * @param {string} target
 */
async function prepareTarget(target) {
    const hostname = ns.getHostname();
    ns.scriptKill('worker.js', hostname);
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