import {asFormat, asPercent} from "util-utils.js";

export class Runner {

    /*
     * @param {Ns} ns
     * @param {string|Server} target
     * @param {string|Server} host
     */
    constructor(ns, target, host) {
        this._ns = ns;
        this._host = typeof (host) === 'string' ? host : host.name;
        this._target = typeof (target) === 'string' ? target : target.name;
    }

    /**
     * @returns {Promise<void>}
     */
    async update() {
        await this._ns.exec('util-update.js', this._host, 1, this._target);
    }

    /**
     * @returns {Promise<void>}
     */
    async killAll() {
        await this._ns.exec('util-kill.js', this._host, 1, this._target);
    }

    /**
     * @param {number} threads
     * @param {number} startTime
     * @returns {Promise<void>}
     */
    async runHack(threads, startTime = undefined) {
        await this._ns.exec('util-script.js', this._host, threads, this._target, 'hack', startTime);
    }


    /**
     * @param {number} threads
     * @param {number} startTime
     * @returns {Promise<void>}
     */
    async runWeaken(threads, startTime = undefined) {
        await this._ns.exec('util-script.js', this._host, threads, this._target, 'weaken', startTime);
    }

    /**
     * @param {number} threads
     * @param {number} startTime
     * @returns {Promise<void>}
     */
    async runGrow(threads, startTime = undefined) {
        await this._ns.exec('util-script.js', this._host, threads, this._target, 'grow', startTime);
    }
}

export class HackRunner {
    /**
     * @param {Ns} ns
     * @param {Server} target
     * @param {Server} self
     * @returns {Promise<void>}
     */
    static growServer(ns, target, self) {
        return new HackRunner(ns, target, self).growServer();
    }

    /**
     * @param {Ns} ns
     * @param {Server} target
     * @param {Server} self
     * @returns {Promise<void>}
     */
    static weakenServer(ns, target, self) {
        return new HackRunner(ns, target, self).weakenServer();
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
        this._runner = new Runner(ns, target, self);
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
            if (weakenThreads > 0) await this._runner.runWeaken(weakenThreads, start);
            if (growThreads > 0) await this._runner.runGrow(growThreads, start);

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
            await this._runner.runWeaken(using, start);

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