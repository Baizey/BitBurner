let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';

export async function main(ns) {
    let files = [
        'utils.js',
        'Inject.js',
        'Server.js',
        'Crack.js',
        'grow.script',
        'hack.script',
        'weaken.script'
    ];
    for (let i in files)
        await ns.wget(`${baseUrl}${files[i]}`);
    await ns.wget(`${baseUrl}updater.js`);
    ns.tprint('<span style="color:white">Done updating!</span>');
}