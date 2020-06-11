let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/renewal/';
let _ns, _host, _verbose;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;

    if (ns.args[0] !== '-v') {
        _host = ns.args[0] || ns.getHostname();
        _verbose = ns.args[1] === '-v';
    } else {
        _host = ns.args[1] || ns.getHostname();
        _verbose = true;
    }

    ns.tprint(`<span style="color:lightgrey">Updating ${_host}</span>`);

    await update('Utils', [
        'runner',
        'utils',
        'updater',
        'inject',
        'crack',
        'purchaser',
        'server',
        'script',
    ].map(e => `util-${e}.js`))

    await update('Hacks', [
        'greedy',
        'mono',
        'distributed'
    ].map(e => `hack-${e}.js`))

    ns.tprint('<span style="color:white">Done updating!</span>');
}

async function update(name, files) {
    _ns.tprint(`<span style="color:lightgrey">Updating ${name}</span>`);
    for (let file of files) {
        await _ns.wget(`${baseUrl}${file}`, file, _host);
        if (_verbose) _ns.tprint(`<span style="color:grey">\> ${file}</span>`);
    }
}