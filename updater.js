let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';

export async function main(ns) {
    let files = [
        'utils.js',
        'Inject.js',
        'Server.js',
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