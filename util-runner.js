import {asFormat, asPercent} from "util-utils.js";

export class Runner {
    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static runHack(ns, threads, target, time = Date.now() + 100, hostname = ns.getHostname()) {
        return ns.exec('util-script.js', hostname, threads, target, 'hack', time);
    }

    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static runGrow(ns, threads, target, time = Date.now() + 100, hostname = ns.getHostname()) {
        return ns.exec('util-script.js', hostname, threads, target, 'grow', time);
    }

    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static runWeaken(ns, threads, target, time = Date.now() + 100, hostname = ns.getHostname()) {
        return ns.exec('util-script.js', hostname, threads, target, 'weaken', time);
    }
}

export class Hacker {
    /**
     * @param {Ns} ns
     * @param {Server} target
     * @param {Server} self
     * @returns {Promise<void>}
     */
    static growServer(ns, target, self) {
        return new Hacker(ns, target, self).growServer();
    }

    /**
     * @param {Ns} ns
     * @param {Server} target
     * @param {Server} self
     * @returns {Promise<void>}
     */
    static weakenServer(ns, target, self) {
        return new Hacker(ns, target, self).weakenServer();
    }

    /**
     * @param {Ns} ns
     * @param {Server} target
     * @param {Server} self
     */
    constructor(ns, target, self) {
        this._ns = ns;
        this._target = target;
        this._self = self;
    }

    /**
     * @returns {Promise<void>}
     */
    async growServer() {
        const ns = this._ns;
        const target = this._target;
        const self = this._self;

        const maxThreads = self.availThreads;
        const time = ns.getWeakenTime(target.name) * 1000;
        while (!target.hasMaxMoney || !target.hasMinSecurity) {
            const neededGrowThreads = Math.ceil(ns.growthAnalyze(target.name, 1 / target.moneyRatio))

            // We need 1 weaken thread for each 12.5 grow thread
            const weakenThreads = Math.ceil(1.1 / 13.5 * maxThreads) + Math.ceil(0.05 * target.securityExcess + 1);
            const growThreads = Math.min(neededGrowThreads, maxThreads - weakenThreads);

            // Run threads
            const start = Date.now() + 500;
            if (weakenThreads > 0) await Runner.runWeaken(ns, weakenThreads, target.name, start, self.name);
            if (growThreads > 0) await Runner.runGrow(ns, growThreads, target.name, start, self.name);

            const end = start + time + 500;
            await this.display({
                stage: 'Grow',
                endtime: end,
                threads: {grow: growThreads, growWeaken: weakenThreads}
            });
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async weakenServer() {
        const ns = this._ns;
        const target = this._target;
        const self = this._self;

        const maxThreads = self.availThreads;
        while (!target.hasMinSecurity) {
            const time = ns.getWeakenTime(target.name) * 1000;

            // Figure optimal thread usage
            const neededThreads = Math.ceil(target.securityExcess / 0.05);
            const using = Math.min(maxThreads, neededThreads);

            // Run threads
            const start = Date.now() + 500;
            await Runner.runWeaken(ns, using, target.name, start, self.name);

            const end = start + time + 500;
            const result = Math.max(0, target.securityExcess - using * 0.05);
            await this.display({
                stage: 'Weaken',
                result: `${result.toFixed(2)} security excess`,
                endtime: end,
                threads: {weaken: using}
            });
        }
    }

    async display(data) {
        const _ns = this._ns;
        const target = this._target;
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
}