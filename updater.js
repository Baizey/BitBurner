let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}`;

async function get(ns, url, name) {
    return await ns.wget(url, name);
}

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
        await ns.wget(`${baseUrl}${files[i]}`, files[i]);
    await ns.wget(`${baseUrl}updater.js`, 'updater.js');
    ns.tprint('<span style="color:white">Done updating!</span>');
}