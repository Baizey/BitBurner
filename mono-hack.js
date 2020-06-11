import {Server} from "server.js";
import {Runner, asFormat, asPercent} from 'utils.js';

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
        await growCycle(ns, target, self);
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
 * @param {Ns} ns
 * @param {Server} target
 * @param {Server} self
 * @returns {Promise<void>}
 */
async function growCycle(ns, target, self) {
    if (!target.hasMinSecurity)
        await weakenCycle(ns, target, self);

    const maxThreads = self.availThreads;
    const time = ns.getWeakenTime(target.name) * 1000;
    while (!target.hasMaxMoney) {
        // We need 1 weaken thread for each 12.5 grow thread
        const weakenThreads = Math.ceil((1.1 / 13.5) * maxThreads);
        const growThreads = maxThreads - weakenThreads;

        // Run threads
        const start = Date.now() + 500;
        await Runner.runWeaken(ns, weakenThreads, target.name, start);
        await Runner.runGrow(ns, growThreads, target.name, start);

        const end = start + time + 500;
        await display({
            stage: 'Grow',
            endtime: end,
            threads: {grow: growThreads, growWeaken: weakenThreads}
        });
    }

    if (!target.hasMinSecurity)
        await weakenCycle(ns, target, self);
}

/**
 * @param {Ns} ns
 * @param {Server} target
 * @param {Server} self
 * @returns {Promise<void>}
 */
async function weakenCycle(ns, target, self) {
    const maxThreads = self.availThreads;
    while (!target.hasMinSecurity) {
        const time = ns.getWeakenTime(target.name) * 1000;

        // Figure optimal thread usage
        const neededThreads = Math.ceil(target.securityExcess / 0.05);
        const using = Math.min(maxThreads, neededThreads);

        // Run threads
        const start = Date.now() + 500;
        await Runner.runWeaken(ns, using, target.name, start);

        const end = start + time + 500;
        const result = Math.max(0, target.securityExcess - using * 0.05);
        await display({
            stage: 'Weaken',
            result: `${result.toFixed(2)} security excess`,
            endtime: end,
            threads: {weaken: using}
        });
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