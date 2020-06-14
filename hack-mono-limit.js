import {Server} from 'util-server.js'
import {asFormat, asPercent} from 'util-utils.js';
import {Runner, Hacker} from 'util-runner.js';

let _ns, hackTime, growTime, weakTime, executionSafety, target, host, taking;
let hackThreads, growThreads, hackWeakenThreads, growWeakenThreads;
let hackTakes, hackChance, hackingLevel;
let scheduler;

const delay = 5000;

const statistics = {
    maxActive: 0,
    completed: 0,
    startTime: 0
}

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    await init(ns);
    scheduler = new Scheduler(executionSafety);
    while (true) {
        hackingLevel = ns.getHackingLevel();
        await update();
        scheduler = new Scheduler(executionSafety);

        while (hackingLevel === ns.getHackingLevel()) {
            const now = Date.now();

            const endHack = now + weakTime + delay;
            const endHackWeak = endHack + executionSafety;
            const endGrow = endHack + 2 * executionSafety;
            const endGrowWeak = endHack + 3 * executionSafety;

            const startHack = endHack - hackTime;
            const startHackWeak = endHackWeak - weakTime;
            const startGrow = endGrow - growTime;
            const startGrowWeak = endGrowWeak - weakTime;

            const endMiddle = endGrow - executionSafety / 2;
            const ends = [endHack, endHackWeak, endGrow, endGrowWeak];
            const starts = [startHack, startHackWeak, startGrow, startGrowWeak];
            const cycle = new HackCycle(endMiddle, ends, starts);

            if (hackThreads + hackWeakenThreads + growThreads + growWeakenThreads < host.availThreads) {
                if (scheduler.tryAdd(cycle)) {
                    await Runner.runHack(ns, hackThreads, target.name, startHack, host.name);
                    await Runner.runWeaken(ns, hackWeakenThreads, target.name, startHackWeak, host.name);
                    await Runner.runGrow(ns, growThreads, target.name, startGrow, host.name);
                    await Runner.runWeaken(ns, growWeakenThreads, target.name, startGrowWeak, host.name);
                }
            }

            await ns.sleep(10);
            const removed = scheduler.cleanup();
            if (removed && !statistics.completed)
                statistics.startTime = Date.now();
            statistics.completed += removed;

            await display();
        }
    }
}

async function init(ns) {
    _ns = ns;
    _ns.disableLog('ALL');
    host = Server.create(_ns, _ns.args[0] || _ns.getHostname());
    target = Server.create(_ns, _ns.args[1]);
    executionSafety = (_ns.args[2] - 0) || 100;
    taking = (_ns.args[3] - 0) || .05;
    if (taking >= 1) taking /= 100;
}

async function update() {
    await _ns.killall(target.name);
    if (scheduler.cycles.length > 0) {
        while (scheduler.cycles.length > 0) {
            scheduler.cleanup();
            _ns.clearLog();
            _ns.print(`Waiting for ${scheduler.cycles.length} cycles to end (${((scheduler.cycles[scheduler.cycles.length - 1].end - Date.now()) / 1000).toFixed(2)} seconds)`);
            await _ns.sleep(5000);
        }
        await _ns.sleep(delay + weakTime);
    }

    await Hacker.growServer(_ns, target, host);

    updateTimers();
    updateThreads();
    hackChance = _ns.hackChance(target.name);
}

function updateTimers() {
    hackTime = _ns.getHackTime(target.name) * 1000;
    growTime = _ns.getGrowTime(target.name) * 1000;
    weakTime = _ns.getWeakenTime(target.name) * 1000;
}

function updateThreads() {
    hackTakes = _ns.hackAnalyzePercent(target.name);
    hackThreads = Math.floor(taking * 100 / hackTakes);
    hackWeakenThreads = Math.ceil(hackThreads / 25 * 2);
    growThreads = Math.ceil(_ns.growthAnalyze(target.name, 1 / (1 - taking - 0.05)) * 2);
    growWeakenThreads = Math.ceil(growThreads / 12.5 * 2);
}

async function display() {
    const earns = taking * target.moneyMax * hackChance;
    const earned = statistics.completed * earns;
    const timespan = (Date.now() - statistics.startTime);
    statistics.maxActive = Math.max(statistics.maxActive, scheduler.cycles.length);

    _ns.clearLog();
    _ns.print(`Target: ${target.name}`);
    _ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio)})`);
    _ns.print(`Security: ${asFormat(target.securityExcess)}`);
    _ns.print(`Safety: ${executionSafety} ms`);
    _ns.print(`Taking: $${asFormat(taking * target.moneyMax)} (${asPercent(taking)}) per cycle`);
    _ns.print(`Hack chance: ${asPercent(hackChance)}`);
    _ns.print(`Active cycles: ${scheduler.cycles.length} (${statistics.maxActive} max)`);
    _ns.print(`Completed cycles: ${asFormat(statistics.completed)}`);
    if (timespan > 0 && statistics.startTime > 0 && statistics.completed > 0) {
        _ns.print(`Completion interval: ${Math.round(timespan / statistics.completed)} ms`);
        _ns.print(`Earning: $${asFormat(earned / timespan * 1000)} per second`);
    }
}

class Scheduler {
    /**
     * @param {number} distance
     */
    constructor(distance) {
        this._cycles = [];
        this._safety = 2.5 * distance;
    }

    /**
     * @returns {HackCycle[]}
     */
    get cycles() {
        return this._cycles;
    }

    /**
     * @param {number} time
     * @returns i, number of cycles cleaned up
     */
    cleanup(time = Date.now()) {
        let i = 0;
        for (; i < this.cycles.length; i++)
            if (this.cycles[i].end > time)
                break;
        this._cycles = this.cycles.slice(i);
        return i;
    }

    /**
     * @param {HackCycle} cycle
     * @returns {boolean}
     */
    tryAdd(cycle) {
        for (let old of this.cycles)
            if (!old.isSafe(cycle, this._safety))
                return false;

        this.cycles.push(cycle);
        return true;
    }
}

class HackCycle {
    /**
     * @param {number} end
     * @param {number[]} ends
     * @param {number[]} starts
     */
    constructor(end, ends, starts) {
        this.end = end;
        this.ends = ends;
        this.starts = starts;
    }

    /**
     * Ensure no execution overlapping
     * @param {HackCycle} other
     * @param {number} minimum
     * @returns {boolean}
     */
    isSafe(other, minimum) {
        const myMin = this.end - minimum;
        const myMax = this.end + minimum;
        const otherMin = other.end - minimum;
        const otherMax = other.end + minimum;

        if (otherMin <= myMin && myMin <= otherMax) return false;
        if (otherMin <= myMax && myMax <= otherMax) return false;
        if (myMin <= otherMin && otherMin <= myMax) return false;
        if (myMin <= otherMax && otherMax <= myMax) return false;

        for (let start of this.starts) if (otherMin <= start && start <= otherMax) return false;
        for (let start of other.starts) if (myMin <= start && start <= myMax) return false;

        return true;
    }
}