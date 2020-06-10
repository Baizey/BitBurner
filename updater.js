let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/renewal/';

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const host = ns.args[0] || ns.getHostname();
    ns.tprint(`<span style="color:lightgrey">Updating ${host}</span>`);

    let files = [
        'purchaser.js',
        'script.js',
        'cheapgrow.js',
        'cheaphack.js',
        'crack.js',
        'utils.js',
        'inject.js',
        'server.js',
        'grow.script',
        'hack.script',
        'weaken.script'
    ];
    for (let file of files) {
        await ns.wget(`${baseUrl}${file}`, file, host);
        ns.tprint(`<span style="color:grey">Updated ${file}</span>`);
    }
    await ns.wget(`${baseUrl}updater.js`, 'updater.js', host);
    ns.tprint('<span style="color:white">Done updating!</span>');
}