import {Server} from 'util-server.js'
import {asFormat, asPercent} from 'util-utils.js';
import {Runner, HackRunner} from 'util-runner.js';

let _ns;
let _target;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;
    const targetName = ns.args[0];
    const taking = (ns.args[1] - 0) || 10;
    const target = Server.create(ns, targetName);
    _target = target;
    const self = Server.create(ns, ns.getHostname());
    ns.disableLog('sleep');
    await hackCycle(ns, target, self, taking);
}

/**
 * @param {Ns} ns
 * @param {Server} target
 * @param {Server} self
 * @param {number} taking
 * @returns {Promise<void>}
 */
async function hackCycle(ns, target, self, taking) {
    const takingPercent = taking / 100;
    while (true) {
        await HackRunner.growServer(ns, target, self);
        const maxThreads = self.availThreads;
        const weakenTime = ns.getWeakenTime(target.name) * 1000;
        const growTime = ns.getGrowTime(target.name) * 1000;
        const hackTime = ns.getHackTime(target.name) * 1000;

        const hackTakes = ns.hackAnalyzePercent(target.name);
        const hackThreads = Math.floor(taking / hackTakes);
        const hackWeakenThreads = Math.ceil(hackThreads / 25 + 1);
        // Always calculate as if we're taking 1 more percent than we are
        const growThreads = Math.ceil(ns.growthAnalyze(target.name, 1 / (1 - takingPercent - 0.01)));
        const growWeakenThreads = Math.ceil(growThreads / 12.5 + 1);

        const safety = 1000;
        while (target.hasMaxMoney && target.hasMinSecurity) {
            const now = Date.now();
            const firstEnd = now + safety + weakenTime;

            const hackStart = firstEnd - hackTime + 0 * safety;
            const hackWeakenStart = firstEnd - weakenTime + 1 * safety;
            const growStart = firstEnd - growTime + 2 * safety;
            const growWeakenStart = firstEnd - weakenTime + 3 * safety;

            await Runner.runHack(ns, hackThreads, target.name, hackStart);
            await Runner.runWeaken(ns, hackWeakenThreads, target.name, hackWeakenStart);
            await Runner.runGrow(ns, growThreads, target.name, growStart);
            await Runner.runWeaken(ns, growWeakenThreads, target.name, growWeakenStart);

            const end = now + weakenTime + 4 * safety;
            await display({
                stage: 'Hack',
                endtime: end,
                taking: taking / 100,
                threads: {
                    hack: hackThreads,
                    hackWeaken: hackWeakenThreads,
                    grow: growThreads,
                    growWeaken: growWeakenThreads
                }
            });
        }
    }
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
        if (threads.hack) _ns.print(`HackWeaken: ${threads.hackWeaken}, Hack: ${threads.hack}, Taking: ${asPercent(data.taking)}`);
        _ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio, 2)})`);
        _ns.print(`Security excess: ${excess}`);
        await _ns.sleep(200);
    }
    await _ns.sleep(1000);
}

function staticRam() {
    if (true) return;
    _ns.hack();
    _ns.grow();
    _ns.weaken();
}