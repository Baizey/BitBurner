import {Server} from 'util-server.js'
import {asFormat, asPercent} from 'util-utils.js';
import {Runner, HackRunner} from 'util-runner.js';

let _ns, hackTime, growTime, weakTime, executionSafety, target, host, taking, limit;
let hackThreads, growThreads, hackWeakenThreads, growWeakenThreads;
let hackTakes, hackChance, hackingLevel;
let scheduler, runner;
const startTime = Date.now();
const delay = 5000;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    await init(ns);
    while (true) {

        await update();

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
                    await runner.runHack(hackThreads, startHack);
                    await runner.runWeaken(hackWeakenThreads, startHackWeak);
                    await runner.runGrow(growThreads, startGrow);
                    await runner.runWeaken(growWeakenThreads, startGrowWeak);
                }
            }

            await ns.sleep(10);
            scheduler.cleanup();
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
    taking = (_ns.args[3] - 0) || .9;
    limit = (_ns.args[4] - 0) || 20;
    if (taking >= 1) taking /= 100;
    scheduler = new Scheduler(executionSafety);
    runner = new Runner(_ns, target, host);
}

async function cleanup() {
    await runner.killAll();

    if (target.usedRam === 0)
        scheduler._cycles = [];

    if (scheduler.active === 0)
        return;

    while (scheduler.active > 0) {
        _ns.clearLog();
        _ns.print(`Waiting for ${scheduler.active} cycles to end (${((scheduler.cycles[scheduler.active - 1].end - Date.now()) / 1000).toFixed(2)} seconds)`);
        await _ns.sleep(1000);
        scheduler.cleanup();
    }

    _ns.clearLog();
    _ns.print(`Done cleaning up... rebooting`);
    await _ns.sleep(delay);
}

async function update() {
    await cleanup();
    await HackRunner.growServer(_ns, target, host);

    hackingLevel = _ns.getHackingLevel();
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
    const earned = scheduler.completed * earns;
    const timespan = (Date.now() - startTime);

    _ns.clearLog();
    if (scheduler.active > 0)
        _ns.print(`Next cycle ends in: ${((scheduler.cycles[0].end - Date.now()) / 1000).toFixed(2)} seconds`);
    _ns.print(`Host: ${host.name}`);
    _ns.print(`Target: ${target.name}`);
    _ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio)})`);
    _ns.print(`Security: ${asFormat(target.securityExcess)}`);
    _ns.print(`Safety: ${executionSafety} ms`);
    _ns.print(`Taking: $${asFormat(taking * target.moneyMax)} (${asPercent(taking)}) per cycle`);
    _ns.print(`Hack chance: ${asPercent(hackChance)}`);
    _ns.print(`Active cycles: ${scheduler.active} (${scheduler.maxActive} max)`);
    _ns.print(`Completed cycles: ${asFormat(scheduler.completed)}`);
    if (timespan > 0 && startTime > 0 && scheduler.completed > 0) {
        _ns.print(`Completion interval: ${Math.round(timespan / scheduler.completed)} ms`);
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
        this._completed = 0;
        this._maxActive = 0;
    }

    /**
     * @returns {number}
     */
    get active() {
        return this._cycles.length;
    }

    /**
     * @returns {number}
     */
    get maxActive() {
        return this._maxActive;
    }

    /**
     * @returns {number}
     */
    get completed() {
        return this._completed;
    }

    /**
     * @returns {HackCycle[]}
     */
    get cycles() {
        return this._cycles;
    }

    /**
     * @param {number} time
     */
    cleanup(time = Date.now()) {
        let i = 0;
        for (; i < this.cycles.length; i++)
            if (this.cycles[i].end > time)
                break;
        this._cycles = this.cycles.slice(i);
        this._completed += i;
    }

    /**
     * @param {HackCycle} cycle
     * @returns {boolean}
     */
    tryAdd(cycle) {
        if (this.cycles.length > limit) return false;
        for (let old of this.cycles)
            if (!old.isSafe(cycle, this._safety))
                return false;

        this.cycles.push(cycle);
        this._maxActive = Math.max(this._maxActive, this.cycles.length);
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