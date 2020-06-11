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