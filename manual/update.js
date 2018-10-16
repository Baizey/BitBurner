let baseUrl = 'https://raw.githubusercontent.com/Baizey/BitBurner/master/';
let url = path => `${baseUrl}${path}`;

async function get(ns, path) {
    return await ns.wget(url(path), path.split('/').pop());
}

let files = [
    'manual/scan.js',       // Used instead of the games scan/scan-analyze functions (much better)
    'manual/overview.js',   // Used to get overview on stocks

    'utils/helper.js',      // General helper for other files
    'utils/primes.js',      // simply holds function to first 100.000 primes

    'classes/Stock.js',     // Stock class (and StockSettings)
    'classes/Contract.js',  // Contract class
    'classes/Runner.js',    // Runner class, used to start/stop/await other scripts

    'contract.js',          // Program to complete contracts
    'stock.js',             // Program to trade in stocks
    'crack.js',             // Program to crack ALL servers (will also attempt to buy cracking programs)

    'hack/autohack.js',     // Starts up hacking scripts for all servers
    'hack/hack.js',         // Runs hack/grow/weaken cycles from given calculated thread usage
    'hack/calculator.js',   // Calculates threads needed for hack/grow/weaken servers
    'hack/hack.script',     // Bare-bone hack(args[0])   script
    'hack/grow.script',     // Bare-bone grow(args[0])   script
    'hack/weaken.script',   // Bare-bone weaken(args[0]) script
];

export async function main(ns) {
    for (let i in files)
        await get(ns, files[i]);
    ns.tprint('<span style="color:white">Done updating!</span>');
}