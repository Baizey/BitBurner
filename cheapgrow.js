import {Runner} from 'utils.js'
import {asPercent} from 'utils.js'
import {Server} from 'server.js'

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const targetName = ns.args[0];
    const allServers = Server.get(ns);
    const target = allServers.filter(e => e.name === targetName)[0];
    ns.disableLog('sleep');

    let readyOn = Date.now();

    while (!target.hasMaxMoney) {
        ns.clearLog();
        ns.print(`Waiting ${((readyOn - Date.now()) / 1000).toFixed(2)} seconds`);
        while (Date.now() < readyOn)
            await ns.sleep(1000);
        ns.clearLog();
        ns.print(`At: ${asPercent(target.moneyAvail / target.moneyMax)}`);

        const growTime = ns.getGrowTime(target.name) * 1000;
        const startTime = Date.now() + 10000;
        readyOn = startTime + growTime + 1000;

        for (let server of allServers) {
            if (!server.hasRoot || server.name === 'home') continue;
            const used = 1.8;
            const threads = Math.floor(server.freeRam / used);
            await Runner.runGrow(ns, threads, target.name, startTime, server.name);
        }

        await ns.sleep(5000);
    }
}