import {Runner} from 'util-runner.js'
import {asPercent, asFormat} from 'utils.js'
import {Server} from 'util-server.js'

let _ns, _target;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;
    ns.disableLog('ALL');
    ns.clearLog();

    while (true) {
        const target = getTarget();
        _target = target;
        if (!target) return;

        const workers = getWorkers().sort((a, b) => b.availThreads - a.availThreads);
        const time = ns.getHackTime(target.name) * 1000;
        let allThreads = 0;
        for (let worker of workers) {
            const threads = worker.availThreads;
            if (threads < 1) continue;
            allThreads += threads;
            const start = Date.now() + threads + 10;
            await Runner.runHack(ns, threads, target.name, start, worker.name);
        }
        await display({
            stage: 'Hack',
            endtime: Date.now() + time + 100,
            threads: {hack: allThreads}
        });

    }
}

/**
 * @returns {Server}
 */
function getTarget() {
    const servers = Server.get(_ns).filter(e => e.moneyAvail >= 500000);
    servers.sort((a, b) => b.moneyAvail - a.moneyAvail);
    servers.sort((a, b) => a.securityCurr - b.securityCurr);
    return servers[0];
}

/**
 * @returns {Server[]}
 */
function getWorkers() {
    return Server.get(_ns).filter(s => s.hasRoot && s.name !== 'home');
}


/**
 * @param {{
 *          stage: string,
 *          endtime: number,
 *          taking: number,
 *          result: string,
 *          threads: {
 *              grow: number,
 *              growWeaken: number,
 *              hack: number
 *              hackWeaken: number,
 *              weaken: number,
 *           }
 *      }} data
 */
async function display(data) {
    const target = _target;
    const threads = data.threads || {};
    const end = data.endtime;
    _ns.disableLog('ALL');
    while (Date.now() < end) {
        const excess = target.securityExcess === 0 ? target.securityExcess : target.securityExcess.toFixed(2);
        _ns.clearLog();
        _ns.print(`Waiting ${Math.round((data.endtime - Date.now()) / 1000)} seconds`);
        _ns.print(`State: ${data.stage}`);
        _ns.print(`Target: ${target.name}`);
        if (data.result) _ns.print(`Result: ${data.result}`)
        if (threads.weaken) _ns.print(`Weaken: ${threads.weaken}`);
        if (threads.grow) _ns.print(`GrowWeaken: ${threads.growWeaken}, Grow: ${threads.grow}`);
        if (threads.hack) _ns.print(`HackWeaken: ${threads.hackWeaken}, Hack: ${threads.hack}`);
        _ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio, 2)})`);
        _ns.print(`Security excess: ${excess}`);
        await _ns.sleep(200);
    }
    await _ns.sleep(1000);
}