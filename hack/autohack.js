import {Server} from 'helper.js'
let ServerType = Server.types();

export async function main(ns) {
    let take = ns.args[0] || 1000;
    /*
    let targets = [
        // "foodnstuff",
        "sigma-cosmetics",
        "joesguns",
        "nectar-net",
        "hong-fang-tea",
        "harakiri-sushi",
        "neo-net",
        "zer0",
        "max-hardware",
        "iron-gym",
        "phantasy",
        "silver-helix",
        "omega-net",
        "crush-fitness",
        "johnson-ortho",
        "the-hub",
        "comptek",
        "netlink",
        "rothman-uni",
        "catalyst",
        "summit-uni",
        "rho-construction",
        "millenium-fitness",
        "aevum-police",
        "alpha-ent",
        "syscore",
        "lexo-corp",
        "snap-fitness",
        "global-pharm",
        "applied-energetics",
        "unitalife",
        "univ-energy",
        "nova-med",
        "zb-def",
        "zb-institute",
        "vitalife",
        "titan-labs",
        "solaris",
        "microdyne",
        "helios",
        "deltaone",
        "icarus",
        "omnia",
        "defcomm",
        "galactic-cyber",
        "infocomm",
        "taiyang-digital",
        "stormtech",
        "aerocorp",
        "clarkinc",
        "omnitek",
        "nwo",
        "4sigma",
        "blade",
        "b-and-a",
        "ecorp",
        "fulcrumtech",
        "megacorp",
        "kuai-gong",
        // "fulcrumassets",
        "powerhouse-fitness"
    ];
    */
    let targets = Server.get(ns)
        // Ignore servers that can't be hacked
        .filter(s => s.type === ServerType.MoneyFarm)
        // Ignore servers we don't have root for yet
        .filter(s => s.hasRoot)
        // Ignore servers that has out of control security
        .filter(s => s.securityCurr <= 100)
        // Filter from blacklisted servers (never worth using)
        .filter(s => 'fulcrumassets' !== s.name)
        // Take X first servers (default is all)
        .slice(0, take);

    let taking = ns.args.length > 0 ? ns.args[0] : '';
    for(let i = 0; i < targets.length; i++)
        await ns.run('calculator.js', 1, targets[i] + (taking ? `;${taking}` : ''));
}