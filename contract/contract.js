import {getServers} from "helper.ns";
import {getPrimes} from 'primes.ns';

let primes = getPrimes();

function Contract(ns, server, contract) {
    this.ns = ns;
    this.server = server;
    this.contract = contract;
    this.type = ns.codingcontract.getContractType(contract, server);
    this.desc = ns.codingcontract.getDescription(contract, server);
    this.data = ns.codingcontract.getData(contract, server);
}

Contract.prototype.findAnswer = function () {
    switch (this.type) {
        case 'Spiralize Matrix':
            return spiralizeMatrix(this.data);
        case 'Total Ways to Sum':
            return totalWaysToSum(this.data);
        case 'Subarray with Maximum Sum':
            return subArrayWithBiggestSum(this.data);
        case 'Find Largest Prime Factor':
            return findLargestPrimeFactor(this.data);
        case 'Merge Overlapping Intervals':
            return mergeOverlappingIntervals(this.data);
        case 'Algorithmic Stock Trader I':
            return stockTrading1(this.data);
        case 'Algorithmic Stock Trader II':
            return stockTrading2(this.data);
        case 'Algorithmic Stock Trader III':
            return stockTrading3(this.data);
        case 'Array Jumping Game':
            return arrayJumpingGame(this.data);
        case 'Generate IP Addresses':
            return generateIpAddresses(this.data);
        default:
            this.ns.print(`Unknown type: ${this.type}`);
            this.ns.print(`Server: ${this.server}`);
            this.ns.print(`File: ${this.contract}`);
            this.ns.tprint(`Unknown type: ${this.type}, see logs for more details`);
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
    while (true) {
        let contracts = [];
        servers.forEach(server =>
            ns.ls(server.name, ".cct").forEach(name =>
                contracts.push(new Contract(ns, server.name, name))));
        contracts.forEach(contract => {
            let answer = contract.findAnswer();
            if (answer !== null && answer !== undefined)
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
    let curr = data;
    let limit = Math.sqrt(curr);
    let result = 0;
    for(let i = 0; i < primes.length && primes[i] <= limit; i++) {
        if (curr % primes[i] !== 0)
            continue;
        result = primes[i];
        while (curr % primes[i] === 0)
            curr /= primes[i];
        limit = Math.sqrt(curr);
    }
    if (curr > result)
        result = curr;
    return result;
}

/**
 * @param {number[]} state
 * @returns {number}
 */
function subArrayWithBiggestSum(state) {
    let shouldJoin = (a, b) => a === 0 || b === 0 || (a > 0) === (b > 0);
    for (let i = 0; i < state.length; i++) {
        while (i + 1 !== state.length && shouldJoin(state[i], state[i + 1])) {
            state[i] += state[i + 1];
            state.splice(i + 1, 1);
        }
    }

    for (let i = 0; i < state.length; i++) {
        if (state[i] < 0) continue;
        let middle = 0;
        let best = {i: -1, gain: state[i]};
        for (let j = i + 1; j < state.length; j++) {
            if (state[j] <= 0) {
                middle += state[j];
                continue;
            }
            let gain = state[i] + middle + state[j];
            if (gain > state[j] && gain > best.gain) {
                best.i = j;
                best.gain = gain;
            }
        }
        if (best.i !== -1) {
            for (let j = i + 1; j <= best.i; j++)
                state[i] += state[j];
            state.splice(i + 1, best.i - i);
        }
    }

    return Math.max(...state);
}


/**
 * Given as [[1, 2][3,5]]
 * Merge to least necessary intervals
 * @param {number[][]} data
 * @returns {string}
 */
function mergeOverlappingIntervals(data) {
    data.sort((a, b) => a[0] - b[0]);
    console.log(data.map(d => `[${d.join(', ')}]`).join(', '));
    let should = (a, b) => a[0] <= b[1] && a[1] >= b[0];
    let merge = (a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            if (should(data[i], data[j])) {
                data[i] = merge(data[i], data[j]);
                data.splice(j, 1);
                j--;
            }
        }
    }
    data.sort((a, b) => a[0] - b[0]);
    return `[${data.map(d => `[${d.join(', ')}]`).join(', ')}]`;
}

/**
 * buy and sell at most once
 * @param {number[]} data
 * @returns {?}
 */
function stockTrading1(data) {
    let profit = 0;
    let bestBuy = data[0];
    for (let i = 1; i < data.length; i++) {
        profit = Math.max(profit, data[i] - bestBuy);
        bestBuy = Math.min(bestBuy, data[i]);
    }
    return profit;
}

/**
 * buy and sell as much as your heart desires, just no overlap on transactions
 * @param {number[]} data
 * @returns {number}
 */
function stockTrading2(data) {
    let profit = 0;
    for (let i = 1; i < data.length; ++i)
        profit += Math.max(data[i] - data[i - 1], 0);
    return profit;
}

/**
 * sell and buy 2 twice, cannot overlap transaction intervals
 * @param {number[]} data
 * @returns {number}
 */
function stockTrading3(data) {
    let firstBuy = -999999,
        secondBuy = firstBuy,
        firstSell = 0,
        secondSell = 0;
    for (let i = 0; i < data.length; i++) {
        let price = data[i];
        secondSell = Math.max(secondSell,   secondBuy + price);
        secondBuy =  Math.max(secondBuy,    firstSell - price);
        firstSell =  Math.max(firstSell,    firstBuy + price);
        firstBuy =   Math.max(firstBuy,     -price);
    }
    return secondSell;
}

/**
 * Start on first index
 * Determine if you can you to the last index exactly
 * IDFK
 * Return 1 for true and 0 for false
 * @param {number[]} data
 * @returns {string}
 */
function arrayJumpingGame(data) {
    let i = 0;
    for (let j = 0; i < data.length && i <= j; i++)
        j = Math.max(i + data[i], j);
    return i === data.length ? '1' : '0';
}

/**
 * Given string of digit
 * Return different ways it can be split into legal IP addresses
 * @param {string} data
 * @returns {string}
 */
function generateIpAddresses(data) {
    let result = [];
    for(let a = 1; a <= 3; a++) {
        for(let b = 1; b <= 3; b++) {
            let ab = a + b;
            for(let c = 1; c <= 3; c++) {
                let abc = ab + c;
                for(let d = 1; d <= 3; d++) {
                    let abcd = abc + d;
                    let A = data.substring(0, a);
                    let B = data.substring(a, ab);
                    let C = data.substring(ab, abc);
                    let D = data.substring(abc, abcd);
                    let nums = [A, B, C, D].map(i => i - 0);
                    if (Math.max(...nums) > 255)
                        continue;
                    let ip = nums.join('.');
                    if (ip.length === data.length + 3)
                        result.push(ip);
                }
            }
        }
    }
    return result.join(',');
}

/**
 *
 * @param {number} data
 * @returns {number}
 */
function totalWaysToSum(data) {
    let lookup = [1];
    for(let i = 0; i < data; i++)
        lookup.push(0);
    for (let i = 1; i < data; i++)
        for (let j = i; j <= data; j++)
            lookup[j] += lookup[j - i];
    return lookup[data];
}

/**
 * fx:  [1,2,3]
 *       [4,5,6]
 *      [7,8,9]
 * should return 1, 2, 3, 6, 9, 8, 7, 4, 5
 * Matrix is shape: N x M not N x N
 * @param {String} data
 * @returns {string}
 */
function spiralizeMatrix(data) {
    let n = data.length;
    let m = data[0].length;

    let at = {x: 0, y : 0};
    let tiles = n * m - 1;
    let used = [];
    for (let i = 0; i < n; i++){
        let arr = [];
        arr.length = m;
        arr.fill(false);
        used.push(arr);
    }
    let dirs = [
        {x: 1, y: 0},
        {x: 0, y: 1},
        {x: -1, y: 0},
        {x: 0, y: -1}
    ];

    let canMoveTo = (x, y) => x >= 0 && y >= 0 && x < m && y < n && !used[y][x];

    let result = [data[at.y][at.x]];
    used[0][0] = true;
    let dir = 0;
    while(tiles > 0) {
        let curr = dirs[dir];
        while(canMoveTo(at.x + curr.x, at.y + curr.y)) {
            at.x += curr.x;
            at.y += curr.y;
            used[at.y][at.x] = true;
            result.push(data[at.y][at.x]);
            tiles--;
        }
        dir = (++dir) % dirs.length;
    }

    return result.join(', ');
}