import {Runner} from 'utils.js'
import {asPercent} from 'utils.js'
import {Server} from 'server.js'

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const targetName = ns.args[0];
    const type = ns.args[1] || 'weaken';
    const allServers = Server.get(ns);
    const target = allServers.filter(e => e.name === targetName)[0];
    ns.disableLog('sleep');

    let readyOn = Date.now();

    const condition = findCondtionFunc(type, target, ns);
    const time = findTimeFunc(type, target, ns);
    const runner = findRunnerFunc(type, target, ns);

    while (condition()) {
        const usedTime = time() * 1000;
        const startTime = Date.now() + 10000;
        readyOn = startTime + usedTime + 1000;

        for (let server of allServers) {
            if (!server.hasRoot || server.name === 'home') continue;
            const used = 1.75;
            const threads = Math.floor(server.freeRam / used);
            await Runner[runner](ns, threads, target.name, startTime, server.name);
        }

        await ns.sleep(8000);
        ns.clearLog();
        ns.print(`Waiting ${((readyOn - Date.now()) / 1000).toFixed(2)} seconds`);
        ns.print(`Type: ${type}`);
        ns.print(`Money: ${asPercent(target.moneyAvail / target.moneyMax)}`);
        ns.print(`Security: ${target.securityCurr.toFixed(2)} with limit at ${target.securityMin}`);
        while (Date.now() < readyOn)
            await ns.sleep(1000);
        ns.clearLog();
    }
}

function findRunnerFunc(type) {
    if (type === 'grow') return 'runGrow';
    if (type === 'hack') return 'runHack';
    return 'runWeaken';
}

function findCondtionFunc(type, target) {
    if (type === 'grow') return () => !target.hasMaxMoney;
    if (type === 'hack') return () => target.moneyAvail > 1000000;
    return () => !target.hasMinSecurity
}

function findTimeFunc(type, target, ns) {
    if (type === 'grow') return () => ns.getGrowTime(target.name);
    if (type === 'hack') return () => ns.getHackTime(target.name);
    return () => ns.getWeakenTime(target.name);
}