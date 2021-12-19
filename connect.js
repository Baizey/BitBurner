/**
 * @param {{servers: any[]}} data
 * @param {any[]} args
 * @returns {*[]}
 */
export function autocomplete(data, args) {
    return [...data.servers];
}

/**
 * @param {import("Ns").NS } ns
 * @returns {void}
 */
export async function main(ns) {
    const [target] = ns.args[0];
    const paths = {'home': []};
    const queue = Object.keys(paths);
    
    while (queue.length > 0) {
        const current = queue.shift();
        ns.scan(current)
            .filter(e => !paths[e])
            .forEach(server => {
                queue.push(server);
                paths[server] = paths[current].concat([server])
            })
    }

    if (!paths[target]) {
        ns.tprint(`No path found to node ${target}`);
        return;
    }

    const terminalCommand = `home; ${paths[target].map(e => `connect ${e}`).join(';')}`

    const terminalInput = document.getElementById("terminal-input");
    terminalInput.value = terminalCommand;
    const handler = Object.keys(terminalInput)[1];

    // noinspection JSUnresolvedFunction
    terminalInput[handler].onChange({target: terminalInput});
    // noinspection JSUnresolvedFunction
    terminalInput[handler].onKeyDown({keyCode: 13, preventDefault: () => null});
}