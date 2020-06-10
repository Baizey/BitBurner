import {asFormat, asPercent} from "utils.js";
import {cmd} from 'inject.js'

let getColor = type => {
    const Types = Server.types;
    switch (type) {
        case Types.Own:
            return 'green';
        case Types.Faction:
            return 'yellow';
        case Types.Target:
            return 'red';
        case Types.Shop:
            return 'lightblue';
        case Types.MoneyFarm:
            return 'white';
        default:
            return 'white';
    }
};

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    const servers = Server.get(ns);
    let output = 'Network:';
    Server.get(ns).forEach(server => {
        let name = server.name;
        let hackColor = server.hasRoot ? 'lime' : 'red';
        let nameColor = getColor(server.type);

        let moneyCurr = server.moneyAvail;
        let moneyMax = server.moneyMax;
        let ramMax = ns.getServerRam(name)[0];
        let ramUsed = ns.getServerRam(name)[1];
        let hoverText = [
            `Req level: ${server.levelNeeded}`,
            `Req port: ${ns.getServerNumPortsRequired(name)}`,
            `Memory: ${asFormat(ramMax)} GB (${asPercent(ramUsed / ramMax)} used)`,
            `Security: ${server.securityCurr} / ${server.securityMin}`,
            `Money: ${asFormat(moneyCurr)} (${asPercent(moneyCurr / moneyMax)})`,
        ].join('\n');

        output += ['<br>', ' '.repeat(server.depth),
            `<span style='color:${hackColor}'>■ </span>`,
            `<a class='scan-analyze-link' title='${hoverText}'' style='color:${nameColor}'>${name}</a> `,
        ].join('');
    });
    ns.tprint(output);
    cmd(ns, 'scan-analyze 0');
}

let ServerType = {
    'Own': 'Own',
    'Shop': 'Shop',
    'Faction': 'Faction',
    'MoneyFarm': 'MoneyFarm',
    'Target': 'Target'
};
let getServerType = (ns, name) => {
    // Assumes all owned servers are called 'home...'
    if (name.startsWith('home'))
        return ServerType.Own;
    switch (name) {
        case 'darkweb':
            return ServerType.Shop;
        case 'CSEC':
        case 'avmnite-02h':
        case 'I.I.I.I':
        case 'run4theh111z':
            return ServerType.Faction;
        case 'The-Cave':
        case 'w0r1d_d43m0n':
            return ServerType.Target;
        default:
            return ServerType.MoneyFarm;
    }
};

export class Server {
    /**
     * @param {Ns} ns
     * @param {function(Server):boolean} filter
     * @param {boolean} log
     * @returns {Server[]}
     */
    static get(ns, filter = () => true, log = false) {
        if (!log) {
            ns.disableLog('scan');
            ns.disableLog('getServerRequiredHackingLevel');
            ns.disableLog('getServerMoneyAvailable');
            ns.disableLog('getServerMaxMoney');
            ns.disableLog('getServerMinSecurityLevel');
            ns.disableLog('getServerSecurityLevel');
            ns.disableLog('getServerRequiredHackingLevel');
            ns.disableLog('getServerRam');
            ns.disableLog('getServerNumPortsRequired');
            ns.disableLog('getHackingLevel');
        }
        let visited = {'home': true};
        let servers = [];
        let queue = [new Server(ns, 'home')];
        while (queue.length > 0) {
            let curr = queue.pop();
            servers.push(curr);
            let depth = curr.depth + 1;
            ns.scan(curr.name).forEach(name => {
                if (!visited[name]) {
                    let server = new Server(ns, name, depth);
                    queue.push(server);
                    visited[name] = true;
                }
            });
        }
        return servers.filter(filter);
    }

    /**
     * @param {Ns} ns
     * @param {string} name
     * @returns {Server}
     */
    static create(ns, name) {
        return new Server(ns, name);
    }

    static get types() {
        return ServerType;
    }

    /**
     * @param {Ns} ns
     * @param {string} name
     * @param {number} depth
     */
    constructor(ns, name, depth = 0) {
        this.type = getServerType(ns, name);
        this.ns = ns;
        this.name = name;
        this.depth = depth
    }

    /**
     * @returns {number}
     */
    get moneyAvail() {
        return this.ns.getServerMoneyAvailable(this.name);
    }

    /**
     * @returns {number}
     */
    get moneyMax() {
        return this.ns.getServerMaxMoney(this.name);
    }

    /**
     * @returns {boolean}
     */
    get hasMaxMoney() {
        return this.moneyAvail === this.moneyMax;
    }

    /**
     * @returns {number}
     */
    get securityMin() {
        return this.ns.getServerMinSecurityLevel(this.name);
    }

    /**
     * @returns {number}
     */
    get securityCurr() {
        return this.ns.getServerSecurityLevel(this.name);
    }

    /**
     * @returns {boolean}
     */
    get hasMinSecurity() {
        return this.securityCurr === this.securityMin;
    }

    /**
     * @returns {boolean}
     */
    get hasRoot() {
        return this.ns.hasRootAccess(this.name);
    }

    get levelNeeded() {
        return this.ns.getServerRequiredHackingLevel(this.name);
    }

    /**
     * @returns {number}
     */
    get totalRam() {
        const ram = this.ns.getServerRam(this.name);
        return ram[0];
    }

    /**
     * @returns {number}
     */
    get usedRam() {
        const ram = this.ns.getServerRam(this.name);
        return ram[1];
    }

    get availThreads() {
        return Math.floor(this.freeRam / 1.75);
    }

    /**
     * @returns {number}
     */
    get freeRam() {
        return (this.totalRam - this.usedRam).toFixed(2) - 0;
    }

    /**
     * @param {number} crackingScripts
     * @returns {boolean}
     */
    canCrack(crackingScripts) {
        if (this.hasRoot)
            return false;

        let ports = this.ns.getServerNumPortsRequired(this.name);

        if (ports > crackingScripts)
            return false;

        return this.levelNeeded <= this.ns.getHackingLevel();
    }

    /**
     * @param {string[]} availableCrackingScripts
     * @returns {boolean} success of cracking
     */
    crack(availableCrackingScripts) {
        if (this.hasRoot)
            return true;
        if (!this.canCrack(availableCrackingScripts.length))
            return false;
        availableCrackingScripts.forEach(script => {
            switch (script) {
                case 'httpworm':
                case 'httpworm.exe':
                    this.ns.httpworm(this.name);
                    break;
                case 'sqlinject':
                case 'sqlinject.exe':
                    this.ns.sqlinject(this.name);
                    break;
                case 'ftpcrack':
                case 'ftpcrack.exe':
                    this.ns.ftpcrack(this.name);
                    break;
                case 'relaysmtp':
                case 'relaysmtp.exe':
                    this.ns.relaysmtp(this.name);
                    break;
                case 'brutessh':
                case 'brutessh.exe':
                    this.ns.brutessh(this.name);
                    break;
            }
        });
        this.ns.nuke(this.name);
        return true;
    }
}