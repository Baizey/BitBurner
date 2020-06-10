import {Runner} from 'utils.js'
import {asPercent} from 'utils.js'
import {Server} from 'server.js'

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
let _ns;

export async function main(ns) {
    _ns = ns;
    const targetName = ns.args[0];
    const allServers = Server.get(ns);
    const target = allServers.filter(e => e.name === targetName)[0];
    ns.disableLog('sleep');
    ns.clearLog();
    await growFull(target);
}

/**
 * @returns {Server[]}
 */
function workerServers() {
    return Server.get(_ns).filter(e => e.hasRoot || e.name !== 'home');
}

/**
 * @param {Server} target
 * @returns {Promise<void>}
 */
async function growFull(target) {
    const servers = workerServers();
    while (!target.hasMaxMoney) {
        const totalThreads = servers.reduce((a, b) => a + b.availThreads, 0);
        let growThreads = 0;
        let weakenThreads = (target.securityCurr - target.securityMin) / 0.05;
        while (growThreads + Math.ceil(weakenThreads) < totalThreads) {
            growThreads += 1;
            weakenThreads += 0.08;
        }
        growThreads--;

        const allThreads = {
            grow: growThreads,
            weaken: weakenThreads,
            hack: 0
        }

        const weakTime = _ns.getWeakenTime(target.name);
        const startTime = Date.now() + 1000;
        for (let server of servers) {
            let threads = server.availThreads;
            if (weakenThreads >= threads) {
                await Runner.runWeaken(_ns, threads, target.name, startTime, server.name);
                weakenThreads -= threads;
            } else if (weakenThreads > 0) {
                await Runner.runWeaken(_ns, weakenThreads, target.name, startTime, server.name);
                threads -= weakenThreads;
            }
            if (threads > 0 && growThreads > 0) {
                await Runner.runWeaken(_ns, Math.min(threads, growThreads), target.name, startTime, server.name);
                growThreads -= threads;
            }
        }

        const endTime = startTime + weakTime + 500;
        while (Date.now() < endTime) {
            display(target, 'Full grow', endTime, allThreads);
            await _ns.sleep(1000);
        }
        _ns.clearLog();
    }
}

/**
 * @param {Server} target
 * @param {string} stage
 * @param {number} readyOn
 * @param {{grow: number, weaken: number, hack: number}} threads
 */
function display(target, stage, readyOn, threads) {
    _ns.print(`Waiting ${Math.round((readyOn - Date.now()) / 1000)} seconds`);
    _ns.print(`Type: ${stage}`);
    _ns.print(`Target: ${target.name}`);
    _ns.print(`Money: ${asPercent(target.moneyAvail / target.moneyMax, 2)}`);
    _ns.print(`Security: ${target.securityCurr.toFixed(2)} with limit at ${target.securityMin}`);
}