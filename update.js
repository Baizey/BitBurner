let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}.js`;

async function get(ns, path) {
    return await ns.wget(url(path), path.split('/').pop() + '.js');
}

let files = [
    'auto',

    'contract',
    'stock',
    'crack',
    'utils/helper',
    'utils/helper',
    'utils/helper',
];

export async function main(ns) {

}