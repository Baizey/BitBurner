import {Runner} from 'Runner.js';
import {asPercent, Server, getArgs} from "helper.js";

let takingDefault = .5;
let growChange = .004;
let hackChange = .002;
let weakenChange = .05;

/**
 * @param {Server} server
 * @returns {number}
 */
let threadsToWeaken = server => Math.ceil((server.securityCurr - server.securityMin) / weakenChange);

/**
 * @param {Server} server
 * @returns {boolean}
 */
let needToWeaken = server => threadsToWeaken(server) >= 10;

/**
 * @param {Server} server
 * @param {Runner} runner
 * @param {boolean} bypass
 * @returns {Promise<void>}
 */
async function soften(server, runner, bypass = false) {
    // Don't weaken if less than 10 threads are needed, simply not the time
    if (!bypass && !needToWeaken(server))
        return;
    while (!server.hasMinSecurity)
        await runner.finish('weaken.script', threadsToWeaken(server));
    server.ns.print('Weakened server...');
}

/**
 * @param {Server} server
 * @param {Runner} runner
 * @returns {Promise<number>}
 */
async function calculateGrowth(server, runner) {
    server.ns.print('Calculating grow threads...');
    await soften(server, runner);
    while (server.moneyMax * 0.95 <= server.moneyAvail)
        await runner.finish('hack.script', 25);
    await soften(server, runner);
    let growBy = 0;
    while (growBy < 0.000001) {
        let curr = server.moneyAvail + 1;
        await runner.finish('grow.script');
        growBy = (server.moneyAvail - curr) / curr;
    }
    return growBy;
}

/**
 * @param {Server} server
 * @param {Runner} runner
 * @returns {Promise<number>}
 */
async function calculateHack(server, runner) {
    server.ns.print('Calculating hack threads...');
    await soften(server, runner);
    while (server.moneyAvail <= 100000)
        await runner.finish('grow.script', 10000);
    await soften(server, runner);
    let avail = server.moneyAvail;
    while (server.moneyAvail === avail)
        await runner.finish('hack.script');
    return (avail - server.moneyAvail) / avail;
}

/**
 * @param {Server} server
 * @returns {Promise<void>}
 */
async function awaitServerPrepared(server) {
    server.ns.print('Waiting for server to be prepared...');
    server.ns.print('Waiting for root...');
    while (!server.hasRoot)
        await server.ns.sleep(30000);
    server.ns.print('Waiting for hacking level...');
    while (server.levelNeeded > server.ns.getHackingLevel())
        await server.ns.sleep(30000);
}

/**
 * @param {Server} server
 * @param {number} taking
 * @param {number} growBy
 * @param {number} hackBy
 * @returns {{hack: number, grow: number, weak: number}}
 */
function calculateThreads(server, taking, growBy, hackBy) {
    server.ns.print('Calculating thread counts...');
    let moneyLeftAfterHack = server.moneyMax * (1 - taking);
    let growFrom = (server.moneyMax - moneyLeftAfterHack) / moneyLeftAfterHack;
    let hackThreads = Math.floor(taking / hackBy);
    let growThreads = Math.ceil(growFrom / growBy) + 10;
    let weakThreads = Math.ceil((hackChange * hackThreads + growChange * growThreads) / weakenChange);
    server.ns.print(`Hack: ${hackThreads} Grow: ${growThreads}, Weak: ${weakThreads}`);
    return {
        hack: hackThreads,
        grow: growThreads,
        weak: weakThreads
    }
}

/**
 * @param {Server} server
 * @param {Runner} runner
 * @param {number} growBy
 * @returns {Promise<void>}
 */
async function fillServer(server, runner, growBy) {
    server.ns.print('Growing server to 100%');
    await soften(server, runner);
    while (!server.hasMaxMoney) {
        server.ns.print(`At ${asPercent(server.moneyAvail / server.moneyMax)}`);
        let need = (server.moneyMax - server.moneyAvail) / server.moneyAvail;
        let threads = Math.ceil(need / growBy);
        await runner.finish('grow.script', threads);
        await soften(server, runner);
    }
    await soften(server, runner, true);
}

export async function main(ns) {
    ns.disableLog('ALL');
    let args = getArgs(ns);
    let target = args[0];
    let taking = args.length > 1 ? args[1] - 0 : takingDefault;
    let server = Server.create(ns, target);
    let runner = new Runner(ns, ns.getHostname(), target);

    ns.print('Cleaning up old scripts...');
    await runner.kill(['grow.script', 'weaken.script', 'hack.script']);

    await awaitServerPrepared(server);

    let growBy = await calculateGrowth(server, runner);
    let hackBy = await calculateHack(server, runner);
    let threads = calculateThreads(server, taking, growBy, hackBy);

    await fillServer(server, runner, growBy);

    ns.print('Done...');
    await runner.start('hack.js', threads.hack, `${target};${threads.grow};${threads.weak};${taking}`);
}