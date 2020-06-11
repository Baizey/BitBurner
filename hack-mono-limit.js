import {Server} from 'util-server.js'
import {asFormat, asPercent} from 'util-utils.js';
import {Runner, Hacker} from 'util-runner.js';

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const targetName = ns.args[0];
    const target = Server.create(ns, targetName);
    const self = Server.create(ns, ns.getHostname());
    ns.disableLog('ALL');
    await Hacker.growServer(ns, target, self);
    while (true) await work(ns, target, self);
}

/**
 * @param {Ns} ns
 * @param {Server} target
 * @param {Server} self
 * @returns {Promise<void>}
 */
async function work(ns, target, self) {
    const safety = 1000;
    const taking = 0.05;



}