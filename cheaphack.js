import {Runner} from 'utils.js'
import {asPercent} from 'utils.js'
import {Server} from 'server.js'
import {asFormat} from "utils.js";

let _ns;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;
    const targetName = ns.args[0];
    const target = Server.create(_ns, targetName);
    ns.disableLog('sleep');
    ns.clearLog();
    await growFull(target);
    await hackCycle(target);
}

/**
 * @returns {Server[]}
 */
function workerServers() {
    return Server.get(_ns).filter(s => s.hasRoot && s.name !== 'home');
}

/**
 * @param {Server} target
 * @returns {Promise<void>}
 */
async function hackCycle(target) {
    while (target.hasMaxMoney && target.hasMinSecurity) {
        const servers = workerServers();
        const threads = calcHackThreads(servers, target);
        const first = servers[0];
        const second = servers[1];

        const growthTime = _ns.getGrowTime(target.name) * 1000;
        const hackTime = _ns.getHackTime(target.name) * 1000;
        const weakTime = _ns.getWeakenTime(target.name) * 1000;

        const now = Date.now();
        const hackWeakenStart = now + 10000;
        const hackStart = hackWeakenStart + weakTime - hackTime - 1000;
        const growWeakenStart = now + 12000;
        const growStart = growWeakenStart + weakTime - growthTime - 1000;

        if (second.availThreads >= threads.hack) {
            await Runner.runHack(_ns, threads.hack, target.name, hackStart, second.name);
            await Runner.runGrow(_ns, threads.grow, target.name, growStart, first.name);
        } else {
            await Runner.runHack(_ns, threads.hack, target.name, hackStart, first.name);
            await Runner.runGrow(_ns, threads.grow, target.name, growStart, second.name);
        }

        let growWeakenThreads = threads.growWeaken;
        let hackWeakenThreads = threads.hackWeaken;
        for (let server of servers) {
            let serverThreads = server.availThreads;
            if (growWeakenThreads > 0 && serverThreads > 0) {
                const using = Math.min(growWeakenThreads, serverThreads);
                await Runner.runWeaken(_ns, using, target.name, growWeakenStart, server.name);
                growWeakenThreads -= using;
                serverThreads -= using;
            }
            if (hackWeakenThreads > 0 && serverThreads > 0) {
                const using = Math.min(hackWeakenThreads, serverThreads);
                await Runner.runGrow(_ns, using, target.name, hackWeakenStart, server.name);
                hackWeakenThreads -= using;
                serverThreads -= using;
            }
        }

        const endTime = growWeakenStart + weakTime + 1000;
        const taking = threads.hack * (_ns.hackAnalyzePercent(target.name) / 100);
        await _ns.sleep(5000);
        while (Date.now() < endTime) {
            display(target, 'Hack cycle', endTime, now, threads, taking);
            await _ns.sleep(200);
        }
        _ns.clearLog();
    }
}

/**
 * @param target
 * @param servers
 * @returns {{hack: number, grow: number, growWeaken: number, hackWeaken: number}}
 */
function calcHackThreads(servers, target) {
    const totalThreads = servers.reduce((a, b) => a + b.availThreads, 0);
    servers.sort((a, b) => b.availThreads - a.availThreads);
    const first = servers[0];
    const second = servers[1];
    const hackTake = _ns.hackAnalyzePercent(target.name) / 100;
    let hackThreads = 0;
    let growThreads = 0;
    while (
        (hackThreads <= first.availThreads && growThreads <= first.availThreads)
        && (hackThreads <= second.availThreads || growThreads <= second.availThreads)
        && (hackThreads + growThreads
            + Math.ceil(hackThreads * 0.04) + 2
            + Math.ceil(growThreads * 0.08) + 2 < totalThreads)) {

        hackThreads += 1;
        const taking = hackThreads * hackTake;
        const remaining = 1 - taking;
        const growthFactor = 1 / remaining;
        growThreads = Math.ceil(_ns.growthAnalyze(target.name, growthFactor));
    }
    hackThreads -= 1;
    const taking = hackThreads * hackTake;
    const remaining = 1 - taking;
    const growthFactor = 1 / remaining;
    growThreads = Math.ceil(_ns.growthAnalyze(target.name, growthFactor));
    const hackWeaken = Math.ceil(hackThreads * 0.04) + 2;
    const growWeaken = Math.ceil(growThreads * 0.08) + 2;
    return {
        hack: hackThreads,
        hackWeaken: hackWeaken,
        grow: growThreads,
        growWeaken: growWeaken,
    }
}

/**
 * @param {Server} target
 * @returns {Promise<void>}
 */
async function growFull(target) {
    const servers = workerServers();
    while (!target.hasMaxMoney || !target.hasMinSecurity) {
        const allThreads = calcGrowthWeakenThreads(target, servers);
        // Expected time to weaken server
        const weakTime = _ns.getWeakenTime(target.name) * 1000;

        // Give calculation 2 seconds to get all scripts up and running
        const now = Date.now();
        const startTime = now + 2000;
        await runGrowthWeakenThreads(target, servers, startTime);

        // End half a second after expected endtime, just to be safe
        const endTime = startTime + weakTime + 500;
        while (Date.now() < endTime) {
            display(target, 'Full grow', endTime, now, allThreads);
            await _ns.sleep(1000);
        }
        _ns.clearLog();
    }
}

async function runGrowthWeakenThreads(target, servers, startTime) {
    const threads = calcGrowthWeakenThreads(target, servers);
    for (let server of servers) {
        let serverThreads = server.availThreads;
        if (threads.growWeaken > 0 && serverThreads > 0) {
            const using = Math.min(threads.growWeaken, serverThreads);
            await Runner.runWeaken(_ns, using, target.name, startTime, server.name);
            threads.growWeaken -= using;
            serverThreads -= using;
        }
        if (threads.grow > 0 && serverThreads > 0) {
            const using = Math.min(threads.grow, serverThreads);
            await Runner.runGrow(_ns, using, target.name, startTime, server.name);
            threads.grow -= using;
            serverThreads -= using;
        }
    }
}

/**
 * @param target
 * @param servers
 * @returns {{hack: number, grow: number, growWeaken: number, hackWeaken: number}}
 */
function calcGrowthWeakenThreads(target, servers) {
    let growThreads = 0;
    const totalThreads = servers.reduce((a, b) => a + b.availThreads, 0);
    let weakenThreads = (target.securityCurr - target.securityMin) / 0.05;
    if (!target.hasMaxMoney)
        while (growThreads + Math.ceil(weakenThreads) <= totalThreads) {
            growThreads += 1;
            weakenThreads += 0.08;
        }
    growThreads--;
    weakenThreads = Math.ceil(weakenThreads);
    return {
        grow: growThreads,
        growWeaken: weakenThreads,
        hack: NaN,
        hackWeaken: NaN
    }
}

/**
 * @param {Server} target
 * @param {string} stage
 * @param {number} readyOn
 * @param {number} startTime
 * @param {{grow: number, hackWeaken: number, growWeaken: number, hack: number}} threads
 * @param {number} taking
 */
function display(target, stage, readyOn, startTime, threads, taking = 0) {
    _ns.clearLog();
    _ns.print(`Waiting ${Math.round((readyOn - Date.now()) / 1000)} seconds`);
    _ns.print(`State: ${stage}`);
    _ns.print(`Target: ${target.name}`);
    _ns.print(`GrowWeaken: ${threads.growWeaken}, Grow: ${threads.grow}`);
    _ns.print(`HackWeaken: ${threads.hackWeaken}, Hack: ${threads.hack}, Taking: ${asPercent(taking)}`);
    _ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyAvail / target.moneyMax, 2)})`);
    _ns.print(`Security: ${target.securityCurr.toFixed(2)} with limit at ${target.securityMin}`);
}