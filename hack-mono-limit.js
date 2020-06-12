import {Server} from 'util-server.js'
import {asFormat, asPercent} from 'util-utils.js';
import {Runner, Hacker} from 'util-runner.js';

let _ns, _hackTime, _growTime, _weakTime, _executionSafety, _target, _self, _taking;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    ns.disableLog('ALL');
    _ns = ns;
    // Parameters
    _executionSafety = (ns.args[1] - 0) || 100;
    _taking = (ns.args[2] - 0) || .05 // percent;
    if (_taking >= 1) _taking /= 100;

    const targetName = ns.args[0];
    const target = Server.create(ns, targetName);
    _target = target;
    const self = Server.create(ns, ns.getHostname());
    _self = self;

    // Parameters
    _executionSafety = (ns.args[1] - 0) || 100;
    _taking = (ns.args[2] - 0) || .05 // percent;


    // Execution
    await Hacker.growServer(ns, target, self);

    const scheduler = new Scheduler(_executionSafety);
    updateTimers();

    // Overdo everything but hacking to auto-correct problems
    const hackTakes = ns.hackAnalyzePercent(target.name);
    const hackThreads = Math.floor(_taking * 100 / hackTakes);
    const hackWeakenThreads = Math.ceil(hackThreads / 25 * 2);
    const growThreads = Math.ceil(ns.growthAnalyze(target.name, 1 / (1 - _taking - 0.05)) * 2);
    const growWeakenThreads = Math.ceil(growThreads / 12.5 * 2);

    const hackChance = ns.hackChance(target.name);
    let maxActive = 0;
    let completed = 0;
    const earns = _taking * target.moneyMax * hackChance;
    let startTime = 0;

    while (true) {
        const now = Date.now();
        const delay = 5000;

        const endHack = now + _weakTime + delay;
        const endHackWeak = endHack + _executionSafety;
        const endGrow = endHack + 2 * _executionSafety;
        const endGrowWeak = endHack + 3 * _executionSafety;

        const startHack = endHack - _hackTime;
        const startHackWeak = endHackWeak - _weakTime;
        const startGrow = endGrow - _growTime;
        const startGrowWeak = endGrowWeak - _weakTime;

        const endMiddle = endGrow - _executionSafety / 2;
        const ends = [endHack, endHackWeak, endGrow, endGrowWeak];
        const starts = [startHack, startHackWeak, startGrow, startGrowWeak];
        const cycle = new HackCycle(endMiddle, ends, starts);

        if (hackThreads + hackWeakenThreads + growThreads + growWeakenThreads < self.availThreads) {
            if (scheduler.tryAdd(cycle)) {
                await Runner.runHack(ns, hackThreads, target.name, startHack, self.name);
                await Runner.runWeaken(ns, hackWeakenThreads, target.name, startHackWeak, self.name);
                await Runner.runGrow(ns, growThreads, target.name, startGrow, self.name);
                await Runner.runWeaken(ns, growWeakenThreads, target.name, startGrowWeak, self.name);
            }
        }

        await ns.sleep(10);
        ns.clearLog();
        const removed = scheduler.cleanup();
        if (removed && !completed)
            startTime = Date.now();
        completed += removed;

        ns.print(`Target: ${target.name}`);
        ns.print(`Money: ${asFormat(target.moneyAvail)} (${asPercent(target.moneyRatio)})`);
        ns.print(`Security: ${asFormat(target.securityExcess)}`);
        ns.print(`Safety: ${_executionSafety} ms`);
        ns.print(`Taking: $${asFormat(_taking * target.moneyMax)} (${asPercent(_taking)}) per cycle`);
        ns.print(`Hack chance: ${asPercent(hackChance)}`);
        maxActive = Math.max(maxActive, scheduler.cycles.length);
        ns.print(`Active cycles: ${scheduler.cycles.length} (${maxActive} max)`);
        ns.print(`Completed cycles: ${asFormat(completed)}`);

        const earned = completed * earns;
        const timespan = (Date.now() - startTime);
        if (timespan > 0 && startTime > 0 && completed > 0) {
            ns.print(`Completion interval: ${Math.round(timespan / completed)} ms`);
            ns.print(`Earning: $${asFormat(earned / timespan * 1000)} per second`);
        }
    }
}

function updateTimers() {
    _hackTime = _ns.getHackTime(_target.name) * 1000;
    _growTime = _ns.getGrowTime(_target.name) * 1000;
    _weakTime = _ns.getWeakenTime(_target.name) * 1000;
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