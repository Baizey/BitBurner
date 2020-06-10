export class Script {
    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static hack(ns, threads, target, time, hostname = ns.getHostname()) {
        return ns.exec('script.js', hostname, threads, target, 'hack', time);
    }

    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static grow(ns, threads, target, time, hostname = ns.getHostname()) {
        return ns.exec('script.js', hostname, threads, target, 'grow', time);
    }

    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static weaken(ns, threads, target, time, hostname = ns.getHostname()) {
        return ns.exec('script.js', hostname, threads, target, 'weaken', time);
    }
}

export async function main(ns) {
    const target = ns.args[0];
    const func = ns.args[1];
    const time = ns.args[2] - 0;
    if (time < Date.now())
        return;
    await ns.sleep(time - Date.now())
    await ns[func](target);
}