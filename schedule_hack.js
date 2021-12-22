import {Target} from "./target.js";

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    const [name, argCycle, argGap] = ns.args;

    const maxCycles = argCycle || 10;
    const gap = argGap || 100;
    const bigGap = gap * 2.5;

    const target = new Target(ns, name);
    
    await target.prepare();

    let starts = [];
    let ends = [];

    // noinspection InfiniteLoopJS
    while (true) {
        await ns.sleep(5);
        const now = Date.now();

        const cleanStartIndex = starts.findIndex(e => e > now + gap)
        if (cleanStartIndex >= 0) starts = starts.slice(cleanStartIndex);

        const cleanEndIndex = ends.findIndex(e => e > now + bigGap)
        if (cleanEndIndex >= 0) ends = ends.slice(cleanEndIndex);

        if (ends.length >= maxCycles) {
            continue;
        }

        const threads = target.calculateHack(0.1);
        const hackTime = ns.getHackTime(target.name);
        const growTime = ns.getGrowTime(target.name);
        const weakenTime = ns.getWeakenTime(target.name);

        const start = now + 5000;
        const hackStart = start + weakenTime - hackTime;
        const hackWeakStart = start + weakenTime - weakenTime + gap;
        const growStart = start + weakenTime - growTime + 2 * gap;
        const growWeakStart = start + weakenTime - weakenTime + 3 * gap;
        const endTime = start + weakenTime + 1.5 * gap

        if (!safeStart(hackStart, ends, bigGap)) {
            continue;
        }
        if (!safeStart(hackWeakStart, ends, bigGap)) {
            continue;
        }
        if (!safeStart(growStart, ends, bigGap)) {
            continue;
        }
        if (!safeStart(growWeakStart, ends, bigGap)) {
            continue;
        }
        if (!safeEnd(endTime, starts, ends, bigGap)) {
            continue;
        }

        ns.tprint(`Adding cycle`)
        target.hack(threads.hack, hackStart);
        target.weaken(threads.hackWeak, hackWeakStart);
        target.grow(threads.grow, growStart);
        target.weaken(threads.growWeak, growWeakStart);

        ends.push(endTime);
        starts.push(hackStart);
        starts.push(hackWeakStart);
        starts.push(growStart);
        starts.push(growWeakStart);

        ns.tprint(`Active cycles: ${ends.length}`)
    }
}

/**
 * @param {number} start
 * @param {number[]} ends
 * @param {number} bigGap
 */
function safeStart(start, ends, bigGap) {
    return ends.every(end => Math.abs(end - start) >= bigGap);
}

/**
 * @param {number} end
 * @param {number[]} starts
 * @param {number[]} ends
 * @param {number} bigGap
 */
function safeEnd(end, starts, ends, bigGap) {
    return ends.every(e => Math.abs(e - end) >= 2 * bigGap) &&
        starts.every(start => Math.abs(start - end) >= bigGap)
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