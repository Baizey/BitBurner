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

    while(true) {
        let contracts = [];
        getServers(ns).forEach(server =>
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

function findLargestPrimeFactor(number) {
    return null;
}

function subArrayWithBiggestSum(array) {
    return null;
}

function mergeOverlappingIntervals(array) {
    return null;
}

function stockTrading2(array) {
    return null;
}

function arrayJumpingGame(array) {
    return null;
}

function generateIpAddresses(string) {
    return null;
}