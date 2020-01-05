import {Server} from 'Server.js'

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const target = Server.create(ns, ns.args[0]);

    

}