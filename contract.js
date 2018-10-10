import {getServers} from "helper.ns";

function Contract(ns, server, contract) {
    this.ns = ns;
    this.server = server;
    this.contract = contract;
    this.type = ns.codingcontract.getContractType(contract, server);
    this.desc = ns.codingcontract.getDescription(contract, server);
    this.data = ns.codingcontract.getData(contract, server);
}

Contract.prototype.findAnswer = async function () {
    switch(this.type){
        case 'Subarray with Maximum Sum': return subArrayWithBiggestSum(this.data);
        case 'Find Largest Prime Factor': return findLargestPrimeFactor(this.data);
        case 'Merge Overlapping Intervals': return mergeOverlappingIntervals(this.data);
        case 'Algorithmic Stock Trader II': return stockTrading2(this.data);
        case 'Array Jumping Game': return arrayJumpingGame(this.data);
        case 'Generate IP Addresses': return generateIpAddresses(this.data);
        default:
            this.ns.print(`Unknown type: ${this.type}`);
            this.ns.print(`Server: ${this.server}`);
            this.ns.print(`File: ${this.contract}`);
            this.ns.tprint(`Unknown type: ${this.type}, see logs for more details`);
            await this.ns.prompt('Continue');
            return null;
    }
};

Contract.prototype.answer = function (answer) {
    return this.ns.codingcontract.attempt(answer, this.contract, this.server);
};

Contract.prototype.toString = function () {
    return `${this.type}`;
};

export async function main(ns) {
    let servers = getServers(ns);
    while(true) {
        let contracts = [];
        servers.forEach(server =>
            ns.ls(server.name, ".cct").forEach(name =>
                contracts.push(new Contract(ns, server.name, name))));
        contracts.forEach(contract => {
            let answer = contract.findAnswer();
            ns.print(`${contract.type}:`);
            ns.print(`${contract.data}:`);
            ns.print(answer);
            if (answer !== null)
                contract.answer(answer);
        });
        await ns.sleep(60000);
    }
}

/**
 * @param {number} data
 * @returns {number}
 */
function findLargestPrimeFactor(data) {
    return null;
}

/**
 * @param {number[]} data
 * @returns {number[]}
 */
function subArrayWithBiggestSum(data) {
    return null;
}

/**
 * Given as [[1, 2][3,5]]
 * Merge to least necessary intervals
 * @param {number[][]} data
 * @returns {number[][]}
 */
function mergeOverlappingIntervals(data) {
    return null;
}

/**
 * Each index is the i'th day
 * Determine max profit
 * You can only hold 1 stock at a time
 * @param {number[]} data
 * @returns {number}
 */
function stockTrading2(data) {
    return null;
}

/**
 * Start on first index
 * Determine if you can you to the last index exactly
 * IDFK
 * Return 1 for true and 0 for false
 * @param {number[]} data
 * @returns {number}
 */
function arrayJumpingGame(data) {
    return null;
}

/**
 * Given string of digit
 * Return different ways it can be split into legal IP addresses
 * @param {string} data
 * @returns {string[]}
 */
function generateIpAddresses(data) {
    return null;
}