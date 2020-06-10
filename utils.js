export class Runner {
    /**
     * @param {Ns} ns
     * @param {number} threads
     * @param {string} target
     * @param {number} time
     * @param {string} hostname
     * @returns {Promise<void>}
     */
    static runHack(ns, threads, target, time, hostname = ns.getHostname()) {
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
    static runGrow(ns, threads, target, time, hostname = ns.getHostname()) {
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
    static runWeaken(ns, threads, target, time, hostname = ns.getHostname()) {
        return ns.exec('script.js', hostname, threads, target, 'weaken', time);
    }
}

/**
 * Given percentage(s) in decimal format (i.e 1 => 100%)
 * @param {number|number[]} numbers
 * @param {number} decimals
 * @param {boolean} usePadding
 * @returns {string|string[]}
 */
export function asPercent(numbers, decimals = 1, usePadding = true) {
    let isArray = Array.isArray(numbers);
    if (!isArray) numbers = [numbers];
    let percents = numbers.map(n => (n * 100).toFixed(decimals) + '%');
    if (usePadding) {
        let max = Math.max(...(percents.map(n => n.length)));
        percents = percents.map(n => n.padStart(max, ' '));
    }
    return isArray ? percents : percents[0];
}

let units = [' ', 'k', 'm', 'b', 't', 'q', 'Q', 's', 'S'];

/**
 * Given big numbers convert to readable, defaults to 2 decimals
 * Fx 1.400.000 => 1.40m
 * If given array converts according to biggest number in array
 * Fx [10.000, 1.000.000] => [0.01m, 1.00m]
 * Handles up to Septillion (10^24)
 * @param {number|number[]} numbers
 * @param {number} decimals
 * @param {boolean} usePadding
 * @returns {string|string[]}
 */
export function asFormat(numbers, decimals = 2, usePadding = true) {
    let isArray = Array.isArray(numbers);
    if (!isArray) numbers = [numbers];
    let biggest = Math.max(...(numbers.map(Math.abs)));
    let unit = 0;
    for (; biggest >= 1000; unit++, biggest /= 1000) {
    }
    let div = Math.pow(10, Math.min(unit, units.length - 1) * 3);
    let formatted = numbers.map(n => (n / div).toFixed(decimals) + units[unit]);
    if (usePadding) {
        let longest = Math.max(...(formatted.map(n => n.length)));
        formatted = formatted.map(n => n.padStart(longest, ' '))
    }
    return isArray ? formatted : formatted[0];
}