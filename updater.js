let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/renewal/';

export async function main(ns) {
    let files = [
        'crack.js',
        'utils.js',
        'inject.js',
        'server.js',
        'grow.script',
        'hack.script',
        'weaken.script'
    ];
    for (let file of files) {
        await ns.wget(`${baseUrl}${file}`, file);
        ns.tprint(`<span style="color:grey">Updated ${file}</span>`);
    }
    await ns.wget(`${baseUrl}updater.js`, 'updater.js');
    ns.tprint('<span style="color:white">Done updating!</span>');
}