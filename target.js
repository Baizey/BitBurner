import {weakenProgress} from "./constants.js";

export class Target {

    /**
     * @param {import("Ns").NS } ns
     * @param {string} name
     * @param {string} host
     */
    constructor(ns,
                name,
                host = undefined) {
        this.ns = ns;
        this.name = name;
        this.host = host || ns.getHostname();
    }

    /**
     * @returns {boolean}
     */
    get isSecurityHigh() {
        return this.security > 0;
    }

    /**
     * @returns {boolean}
     */
    get isMoneyLow() {
        return this.ns.getServerMaxMoney(this.name) > this.ns.getServerMoneyAvailable(this.name)
    }

    /**
     * @returns {number}
     */
    get security() {
        return this.ns.getServerSecurityLevel(this.name) - this.ns.getServerMinSecurityLevel(this.name)
    }

    /**
     * @returns {number}
     */
    get ratio() {
        return this.ns.getServerMaxMoney(this.name) / this.ns.getServerMoneyAvailable(this.name) + 0.01;
    }

    /**
     * @param {number} security
     * @param {number} maxThreads
     * @returns {number}
     */
    calculateWeaken(security = undefined, maxThreads = undefined) {
        security ||= this.security;
        const threads = Math.ceil(security / weakenProgress);
        return Math.min(maxThreads || threads, threads)
    }

    /**
     * @param {number} ratio
     * @param maxThreads
     * @returns {{total: number, grow: number, growWeak: number}}
     */
    calculateGrowth(ratio = undefined, maxThreads = undefined) {
        ratio ||= this.ratio;

        const growThreads = Math.ceil(this.ns.growthAnalyze(this.name, ratio));
        const security = this.ns.growthAnalyzeSecurity(growThreads)
        const growWeakThreads = this.calculateWeaken(security)

        let threads = {
            grow: growThreads,
            growWeak: growWeakThreads,
            total: growThreads + growWeakThreads
        }

        while (maxThreads && threads.total > maxThreads) {
            ratio -= 0.01;
            threads.grow = Math.ceil(this.ns.growthAnalyze(this.name, ratio));
            const security = this.ns.growthAnalyzeSecurity(growThreads)
            threads.growWeak = this.calculateWeaken(security)
            threads.total = threads.grow + threads.growWeak;
        }

        return threads;
    }

    /**
     * @param {number} taking
     * @param {number} maxThreads
     * @returns {{hack: number, grow: number, growWeak: number, hackWeak: number, total: number}}
     */
    calculateHack(taking, maxThreads = undefined) {
        const maxCash = this.ns.getServerMaxMoney(this.name);
        const hackThreads = Math.floor(this.ns.hackAnalyzeThreads(this.name, taking * maxCash))

        const security = this.ns.hackAnalyzeSecurity(hackThreads)
        const hackWeakThreads = this.calculateWeaken(security)

        const ratio = 1 / (1 - taking) + 0.01;
        const growth = this.calculateGrowth(ratio);

        const threads = {
            hack: hackThreads,
            hackWeak: hackWeakThreads,
            grow: growth.grow,
            growWeak: growth.growWeak,
            total: hackThreads + hackWeakThreads + growth.total
        }

        if (maxThreads) {
            while (threads.total > maxThreads) {
                taking -= 0.01;
                threads.hack = Math.floor(this.ns.hackAnalyzeThreads(this.name, taking * maxCash))

                const security = this.ns.hackAnalyzeSecurity(hackThreads)
                threads.hackWeak = this.calculateWeaken(security)

                const ratio = 1 / (1 - taking) + 0.01;
                const growth = this.calculateGrowth(ratio);
                threads.grow = growth.grow;
                threads.growWeak = growth.growWeak;
                threads.total = threads.hack + threads.hackWeak + growth.total
            }
        }

        return threads;
    }

    /**
     * @param {number} threads
     * @param {number} start
     * @returns {function(): boolean}
     */
    hack(threads, start = undefined) {
        return this.execute('hack', threads, start);
    }

    /**
     * @param {number} threads
     * @param {number} start
     * @returns {function(): boolean}
     */
    weaken(threads, start = undefined) {
        return this.execute('weaken', threads, start);
    }

    /**
     * @param {number} threads
     * @param {number} start
     * @returns {function(): boolean}
     */
    grow(threads, start = undefined) {
        return this.execute('grow', threads, start);
    }

    /**
     * @param {string} cmd
     * @param {number} threads
     * @param {number} start
     * @returns {function(): boolean}
     * @private
     */
    execute(cmd, threads, start = undefined) {
        start ||= Date.now();
        const ns = this.ns;
        ns.exec('worker.js', this.host, threads, this.name, cmd, start);
        return () => ns.isRunning('worker.js', this.host, this.name, cmd, start);
    }

}