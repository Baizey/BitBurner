let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}`;

const files = [
    'Inject.js',
    'Server.js',
    'grow.script',
    'hack.script',
    'weaken.script'
];

async function get(ns, path) {
    return await ns.wget(url(path), path.split('/').pop());
}

export async function main(ns) {
    for (let i in files)
        await get(ns, files[i]);
    ns.tprint('<span style="color:white">Done updating!</span>');
}