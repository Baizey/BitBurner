class Sub {
    /**
     * @param {Number} element
     */
    constructor(element) {
        this.sum = element;
        this.array = [element];
        this.updateType();
    }

    updateType() {
        this.type = this.sum >= 0 ? '+' : '-';
    }

    /**
     * @param {Sub} other
     */
    merge(other) {
        const old = this.array;
        this.sum += other.sum;
        this.array = this.array.concat(other.array);
        this.updateType();
        console.log(`[${old.join(', ')}] ${other.toString()} = ${this.toString()} (${this.sum})`);
    }

    isSame(other) {
        return this.type === other.type
            || this.sum === 0 || other.sum === 0;
    }

    toString() {
        return `[${this.array.join(', ')}]`
    }
}

let max = arr => {
    let best = 0;
    for (let i = 1; i < arr.length; i++)
        if (arr[i].sum > arr[best].sum)
            best = i;
    return arr[best];
};

function subarray2(state) {
    let isSame = (a, b) => a === 0 || b === 0 || (a > 0) === (b > 0);
    for (let i = 0; i < state.length; i++) {
        while (i + 1 !== state.length && isSame(state[i], state[i + 1])) {
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

function subarray(test) {
    let state = test.map(i => new Sub(i));
    for (let i = 0; i < state.length; i++) {
        while (i + 1 !== state.length && state[i].isSame(state[i + 1])) {
            state[i].merge(state[i + 1]);
            state.splice(i + 1, 1);
        }
    }

    for (let i = 0; i < state.length; i++) {
        if (state[i].type === '-') continue;

        let left = state[i].sum;
        let negative = 0;
        let best = {
            index: -1,
            gain: state[i].sum
        };

        for (let j = i + 1; j < state.length; j++) {
            if (state[j].type === '-') {
                negative += state[j].sum;
                continue;
            }
            let right = state[j].sum;
            if (left + negative >= 0 && right + negative >= 0) {
                let gain = left + negative + right;
                if (gain > best.gain) {
                    best.gain = gain;
                    best.index = j;
                }
            }
        }

        if (best.index !== -1) {
            for (let j = i + 1; j <= best.index; j++)
                state[i].merge(state[j]);
            state.splice(i + 1, best.index - i);
        }
    }

    console.log(state.toString());
    console.log(max(state));
}

function mergeInterval(data) {
    data.sort((a, b) => a[0] - b[0]);
    console.log(data.map(d => `[${d.join(', ')}]`).join(', '));
    let should = (a, b) => a[0] <= b[1] && a[1] >= b[0];
    let merge = (a, b) => [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
    for(let i = 0; i < data.length; i++){
        for(let j = i + 1; j < data.length; j++){
            if (should(data[i], data[j])){
                data[i] = merge(data[i], data[j]);
                data.splice(j, 1);
                j--;
            }
        }
    }
    data.sort((a, b) => a[0] - b[0]);
    return `[${data.map(d => `[${d.join(', ')}]`).join(', ')}]`;
}

function stock1(data){
    let best = 0;
    let sellPrice = 0;
    for(let i = data.length - 1; i >= 0; i--) {
        sellPrice = Math.max(sellPrice, data[i]);
        for(let j = i - 1; j >= 0; j--)
            best = Math.max(best, sellPrice - data[j]);
    }
    return best;
}

function stock2(data){
    let profit = 0;
    for (let i = 1; i < data.length; ++i)
        profit += Math.max(data[i] - data[i - 1], 0);
    return profit;
}

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

[
    [   [1, 2],
        [4, 5],
        [7, 8]]
    // [152,36,125,145,34,124,27,168,99,62]
    // [[14,16],[8,12],[8,18],[15,21],[11,20],[9,19],[1,8],[5,8],[2,6],[2,10]]
    //[-10, -1, 4, 10, -5, -7, -4, -5, -10, -1, -9, -5, 6, -5, 2, 3, 3, -1, -7, -1, 9, 2, -7, 0],
].forEach(i => console.log(spiralizeMatrix(i)));