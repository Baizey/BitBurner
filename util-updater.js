let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/renewal/';
let _ns, _host, _verbose;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;
    _host = ns.args[0] || ns.getHostname();
    _verbose = ns.args[1] || false;

    ns.tprint(`<span style="color:lightgrey">Updating ${_host}</span>`);

    await update('Utils', [
        'util-runner.js',
        'util-updater.js',
        'utils.js',
        'util-inject.js',
        'util-crack.js',
        'util-purchaser.js',
        'util-server.js',
        'util-script.js',
    ])

    await update('Hacks', [
        'hack-mono.js',
        'hack-distributed.js'
    ])

    ns.tprint('<span style="color:white">Done updating!</span>');
}

async function update(name, files) {
    _ns.tprint(`<span style="color:lightgrey">Updating ${name}</span>`);
    for (let file of files) {
        await _ns.wget(`${baseUrl}${file}`, file, _host);
        if (_verbose) _ns.tprint(`<span style="color:grey">\> ${file}</span>`);
    }
}