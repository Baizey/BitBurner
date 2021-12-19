/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    const [last] = ns.args;

    switch (last) {
        case mode.startup:
            throw 'Not implemented'
        case mode.running:
            throw 'Not implemented'
        case mode.endless:
            throw 'Not implemented'
    }

}

export const mode = {
    // 8 GB on home
    startup: 'startup',

    // > 100 GB on home
    running: 'running',

    // > 1000 GB on home
    endless: 'endless',
}

/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...Object.values(mode)];
}