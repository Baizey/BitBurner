import {cmd} from './util-inject'

let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/renewal/';
let _ns, _host, _verbose = false;


/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    _ns = ns;
    _host = ns.args.filter(e => e[0] !== '-')[0] || ns.getHostname();

    const args = ns.args.filter(e => e[0] === '-');
    if (args.indexOf('-v') >= 0)
        _verbose = true;

    if (args.indexOf('-r') >= 0)
        ns.ls(_host)
            .filter(e => e.endsWith('.js') || e.endsWith('.script'))
            .forEach(e => ns.rm(e, _host))

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