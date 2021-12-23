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

        this.ns.print(`Host: ${this.host}, Target: ${this.name}`);
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
        return this.ns.getServerMaxMoney(this.name) > this.ns.getServerMoneyAvailable(this.name);
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
     * @returns {{total: number, grow: number, growWeak: number, ratio: number}}
     */
    calculateGrowth(ratio = undefined, maxThreads = undefined) {
        ratio ||= this.ratio;

        const growThreads = Math.ceil(this.ns.growthAnalyze(this.name, ratio));
        const security = this.ns.growthAnalyzeSecurity(growThreads)
        const growWeakThreads = this.calculateWeaken(security)

        const threads = {
            grow: growThreads,
            growWeak: growWeakThreads,
            total: growThreads + growWeakThreads,
            ratio: ratio
        }

        while (maxThreads && threads.total > maxThreads && threads.ratio > 1.01) {
            threads.ratio -= 0.01;
            threads.grow = Math.ceil(this.ns.growthAnalyze(this.name, threads.ratio));
            const security = this.ns.growthAnalyzeSecurity(growThreads)
            threads.growWeak = this.calculateWeaken(security)
            threads.total = threads.grow + threads.growWeak;
        }

        return threads;
    }

    /**
     * @param {number} taking
     * @param {number} maxThreads
     * @returns {{hack: number, grow: number, growWeak: number, hackWeak: number, total: number, taking: number, ratio: number}}
     */
    calculateCycleThreads(taking, maxThreads = undefined) {
        const maxCash = this.ns.getServerMaxMoney(this.name);
        const hackThreads = Math.floor(this.ns.hackAnalyzeThreads(this.name, taking * maxCash))

        const security = this.ns.hackAnalyzeSecurity(hackThreads)
        const hackWeakThreads = this.calculateWeaken(security)

        const ratio = 1 / (1 - taking) + 0.01;
        const growth = this.calculateGrowth(ratio);

        let threads = {
            hack: hackThreads,
            hackWeak: hackWeakThreads,
            grow: growth.grow,
            growWeak: growth.growWeak,
            total: hackThreads + hackWeakThreads + growth.total,
            taking: taking,
            ratio: ratio
        }

        if (maxThreads) {
            while (threads.total > maxThreads && threads.taking > 0.01) {
                threads.taking -= 0.01;
                threads.hack = Math.floor(this.ns.hackAnalyzeThreads(this.name, threads.taking * maxCash))

                const security = this.ns.hackAnalyzeSecurity(hackThreads)
                threads.hackWeak = this.calculateWeaken(security)

                threads.ratio = 1 / (1 - taking) + 0.01;
                const growth = this.calculateGrowth(threads.ratio);
                threads.grow = growth.grow;
                threads.growWeak = growth.growWeak;
                threads.total = threads.hack + threads.hackWeak + growth.total
            }
        }

        return threads;
    }

    /**
     * @param {{now: number, gap: number}} options
     * @returns {{growWeakEnd: number, hackWeakEnd: number, growWeakStart: number, growStart: number, growEnd: number, hackStart: number, hackEnd: *, hackWeakStart: number}}
     */
    calculateCycleTimes(options = {now: Date.now(), gap: 500}) {
        const now = options.now || Date.now();
        const gap = options.gap || 500;
        const timestamp = now + 5000;
        const growTime = this.ns.getGrowTime(this.name);
        const hackTime = this.ns.getHackTime(this.name);
        const weakTime = this.ns.getWeakenTime(this.name);

        return {
            hackStart: timestamp + weakTime - hackTime,
            hackWeakStart: timestamp + weakTime + 1 * gap - weakTime,
            growStart: timestamp + weakTime + 2 * gap - growTime,
            growWeakStart: timestamp + weakTime + 3 * gap - weakTime,
            hackEnd: timestamp + weakTime,
            hackWeakEnd: timestamp + weakTime + 1 * gap,
            growEnd: timestamp + weakTime + 2 * gap,
            growWeakEnd: timestamp + weakTime + 3 * gap
        }
    }

    /**
     * @param {{
     *      threads?: {hack: number, grow: number, growWeak: number, hackWeak: number, total: number, taking: number, ratio: number},
     *      times?: {growWeakEnd: number, hackWeakEnd: number, growWeakStart: number, growStart: number, growEnd: number, hackStart: number, hackEnd: *, hackWeakStart: number},
     *      await?: boolean
     *      }} options
     * @returns {Promise<void>}
     */
    async startCycle(options = {}) {
        const times = options.times || this.calculateCycleTimes();
        const threads = options.threads || this.calculateCycleThreads(0.99);

        await this.hack(threads.hack, {start: times.hackStart});
        await this.weaken(threads.hackWeak, {start: times.hackWeakStart});
        await this.grow(threads.grow, {start: times.growStart});
        await this.weaken(threads.growWeak, {start: times.growWeakStart, await: options.await});
    }

    /**
     * @returns {Promise<void>}
     */
    async prepare() {
        const maxRam = this.ns.getServerMaxRam(this.host);
        const threadCost = this.ns.getScriptRam('worker.js');
        const maxThreads = Math.floor(maxRam / threadCost);

        const isPrepared = this.isSecurityHigh || this.isMoneyLow;
        this.ns.print(`Prepared? ${isPrepared}`);

        while (this.isSecurityHigh) {
            const threads = this.calculateWeaken(this.security, maxThreads);
            await this.weaken(threads, {await: true})
        }

        while (this.isMoneyLow) {
            const threads = this.calculateGrowth(this.ratio, maxThreads)
            await this.grow(threads.grow)
            await this.weaken(threads.growWeak, {await: true})
        }

        while (this.isSecurityHigh) {
            const threads = this.calculateWeaken(this.security, maxThreads);
            await this.weaken(threads, {await: true})
        }
    }

    /**
     * @param {number} threads
     * @param {{start?: number, await?: boolean}} options
     * @returns {Promise<void>}
     * @private
     */
    hack(threads, options = {}) {
        return this.execute('hack', threads, {
            ...options,
            await: options.await && this.ns.getHackTime(this.name)
        });
    }

    /**
     * @param {number} threads
     * @param {{start?: number, await?: boolean}} options
     * @returns {Promise<void>}
     * @private
     */
    weaken(threads, options = {}) {
        return this.execute('weaken', threads, {
            ...options,
            await: options.await && this.ns.getWeakenTime(this.name)
        });
    }

    /**
     * @param {number} threads
     * @param {{start?: number, await?: boolean}} options
     * @returns {Promise<void>}
     * @private
     */
    grow(threads, options = {}) {
        return this.execute('grow', threads, {
            ...options,
            await: options.await && this.ns.getGrowTime(this.name)
        });
    }

    /**
     * @param {string} cmd
     * @param {number} threads
     * @param {{start?: number, await?: number}} options
     * @returns {Promise<void>}
     * @private
     */
    execute(cmd, threads, options = {}) {
        const start = options.start || Date.now();
        this.ns.exec('worker.js', this.host, threads, this.name, cmd, start);
        if (!options.await) return Promise.resolve();

        this.ns.print(`Starting worker`);
        const end = new Date(start + options.await);

        return new Promise(async resolve => {
            while (this.ns.isRunning('worker.js', this.host, this.name, cmd, start)) {

                const now = new Date(end.getTime() - Date.now())
                this.ns.print(`Worker done in ${now.toUTCString().substr(17, 8)}`)

                if (now.getUTCHours()) await this.ns.sleep(1000 * 60 * 60)
                else if (now.getUTCMinutes() > 10) await this.ns.sleep(1000 * 60 * 10)
                else if (now.getUTCMinutes()) await this.ns.sleep(1000 * 60)
                else if (now.getUTCSeconds() > 10) await this.ns.sleep(1000 * 10)
                else await this.ns.sleep(1000)
            }
            this.ns.print(`Worker is done`)
            resolve();
        })
    }

}