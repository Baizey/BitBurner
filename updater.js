let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}`;

async function get(ns, path) {
    return await ns.wget(url(path), path.split('/').pop());
}

const files = [
    'utils.js',
    'Inject.js',
    'Server.js',
    'Crack.js',
    'grow.script',
    'hack.script',
    'weaken.script'
];

export async function main(ns) {
    for (let i in files)
        await get(ns, files[i]);
    await get(ns, 'updater.js');
    ns.tprint('<span style="color:white">Done updating!</span>');
}