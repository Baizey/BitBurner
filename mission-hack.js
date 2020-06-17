let instance;

/**
 * @param {Ns} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
    ns.disableLog('ALL');
    const auto = ns.args[0] === 'auto';

    while (true) {
        // Await entering mission
        while (!document.getElementById('hack-mission-start-btn'))
            await ns.sleep(250);
        await ns.sleep(500);

        // Collect level layout
        const grid = [];
        for (let i = 0; i < 8; i++) grid.push([]);
        for (let y = 0; y < grid.length; y++)
            for (let x = 0; x < 8; x++)
                grid[y].push(new Node(x, y));

        const nodes = grid.flatMap(e => e);
        const lookup = {};
        nodes.forEach(e => lookup[e.id] = e);
        injectMiddleMan(lookup);

        await startGame(ns);
    }
}

export async function mainOld(ns) {
    ns.disableLog('ALL');

    const auto = ns.args[0] === 'auto';

    while (true) {
        await waitingToEnterGame(ns);
        await ns.sleep(500);

        ns.print('Getting information...');
        const buttons = getButtons();
        const grid = [];
        for (let i = 0; i < 8; i++) grid.push([]);
        for (let y = 0; y < grid.length; y++)
            for (let x = 0; x < 8; x++)
                grid[y].push(new Node(x, y));

        const nodes = grid.flatMap(e => e);
        const lookup = {};
        nodes.forEach(e => lookup[e.id] = e);
        injectMiddleMan(lookup);

        await startGame(ns);

        try {
            await completeMission(ns, grid, nodes, lookup, buttons);
        } catch (e) {
            console.error(e);
        }

        ns.print('Completed mission, starting next...');
        while (!document.getElementById('faction-hack-mission-div'))
            await ns.sleep(100);
        if (auto)
            document.getElementById('faction-hack-mission-div').firstChild.firstChild.click();
    }

}

function createPlan(home, lookup, myAttack, cpuCount, goalTypes) {
    const realAttack = myAttack + myAttack * (cpuCount / 64);
    const seen = {};
    let queue = [{
        from: null,
        to: home,
        distance: 0
    }];

    const enemyDefence = document.getElementById('hacking-mission-enemy-stats').innerText.split('\n').map(e => {
        const temp = e.split(' ');
        return Number(temp[temp.length - 1].replace(/,/g, ''));
    })[1];
    // If we outclass enemy by a lot, just win fast
    const focusOnWin = myAttack > 2 * enemyDefence;

    while (queue.length > 0) {
        const curr = queue.shift();
        if (seen[curr.to.id]) continue;
        seen[curr.to.id] = true;

        if (!curr.to.isMine) {
            if (goalTypes.indexOf(curr.to.type) >= 0) {
                if (focusOnWin && curr.to.type !== types.Database)
                    break;

                const result = [];
                let at = curr;
                while (at) {
                    result.push(at.to);
                    at = at.from;
                }
                result.reverse();

                if (!result.some(r => 100 + r.def > realAttack) && !result.some(r => r.isEnemy && realAttack < enemyDefence))
                    return result;
            }
        }

        [lookup[`hacking-mission-node-${curr.to.y}-${curr.to.x - 1}`],
            lookup[`hacking-mission-node-${curr.to.y}-${curr.to.x + 1}`],
            lookup[`hacking-mission-node-${curr.to.y - 1}-${curr.to.x}`],
            lookup[`hacking-mission-node-${curr.to.y + 1}-${curr.to.x}`]]
            .filter(n => n)
            .filter(n => !seen[n.id])
            .forEach(n => {
                queue.push({
                    from: curr.to.isMine ? null : curr,
                    to: n,
                    distance: curr.distance + n.weight + (n.isEnemy ? enemyDefence : 0)
                });
            });

        queue = queue.sort((a, b) => a.distance - b.distance);
    }
    return [];
}

async function completeMission(ns, grid, nodes, lookup) {
    const buttons = getButtons();
    let databases = nodes.filter(n => n.type === types.Database);
    const home = lookup[`hacking-mission-node-${0}-${0}`];
    let plan = [];
    while (databases.filter(db => !db.isMine).length > 0) {
        nodes.forEach(n => n.update());
        const cpus = nodes.filter(n => n.isMine).filter(n => n.type === types.CPU);

        const myAttack = document.getElementById('hacking-mission-player-stats').innerText.split('\n').map(e => {
            const temp = e.split(' ');
            return Number(temp[temp.length - 1].replace(/,/g, ''));
        })[0];
        const enemyDefence = document.getElementById('hacking-mission-enemy-stats').innerText.split('\n').map(e => {
            const temp = e.split(' ');
            return Number(temp[temp.length - 1].replace(/,/g, ''));
        })[1];

        const isIdle = !cpus.some(cpu => cpu.connection);

        if (plan.length === 0 && isIdle) {
            plan = createPlan(home, lookup, myAttack, cpus.length, [types.CPU, types.Database, types.Transfer]);
            if (plan.length === 0)
                plan = createPlan(home, lookup, myAttack, cpus.length, [types.Spam]);
            if (plan.length > 0) {
                console.log(plan.map(p => p.id));
                plan.forEach(e => document.getElementById(e.id).style.backgroundColor = 'green')
            }
        }

        if (plan.length > 0 && isIdle) {
            const target = plan.shift();
            console.log(target.id);
            console.log(`Defence: ${target.def}, Enemy: ${target.isEnemy}`);
            cpus.forEach(cpu => {
                cpu.connect(target);
                instance.connect({source: cpu.id, target: target.id});
            });
        }

        nodes.filter(n => n.isMine)
            .forEach(node => {
                    node.click();
                    switch (node.type) {
                        case types.CPU:
                            if (node.connection) {
                                if (node.connection.isEnemy || node.connection.type !== types.Transfer)
                                    if (node.connection.def > 10) buttons.scan(); else buttons.attack();
                                else if (node.connection.def > myAttack * 0.9)
                                    buttons.scan(); else buttons.attack();
                                break;
                            }
                        case types.Transfer:
                            if (node.def > 10) buttons.overflow(); else buttons.fortify();
                            break;
                        case types.Shield:
                        case types.Firewall:
                            buttons.fortify();
                            break;
                    }
                }
            );

        await ns.sleep(100);
    }
}

function injectMiddleMan(lookup) {
    instance = null;
    jsPlumb.factionHackerInstance = jsPlumb.factionHackerInstance ? jsPlumb.factionHackerInstance : jsPlumb.getInstance;
    jsPlumb.getInstance = function (options) {
        instance = jsPlumb.factionHackerInstance.call(this, options);
        const oldConnect = instance.connect;
        instance.connect = function (info) {
            const ids = {
                source: (typeof info.source === 'string') ? info.source : info.source.id,
                target: (typeof info.target === 'string') ? info.target : info.target.id,
            };
            if (lookup[ids.source]) {
                if (lookup[ids.source].isEnemy)
                    return null;
            }
            return oldConnect.call(this, info);
        };
        return instance;
    };
}

async function startGame(ns) {
    ns.print('Starting mission...');
    document.getElementById('hack-mission-start-btn').click();
    while (!instance) await ns.sleep(100);
}

/**
 * @returns {{drop: (function(): void), fortify: (function(): void), overflow: (function(): void), attack: (function(): void), scan: (function(): void), weaken: (function(): void)}}
 */
function getButtons() {
    const elements = document.getElementsByClassName('a-link-button-inactive tooltip hack-mission-header-element');
    return {
        attack: () => elements[0].click(),
        scan: () => elements[1].click(),
        weaken: () => elements[2].click(),
        fortify: () => elements[3].click(),
        overflow: () => elements[4].click(),
        drop: () => elements[5].click()
    };
}

const types = {
    'CPU': 'CPU',
    'Shield': 'Shield',
    'Transfer': 'Transfer',
    'Firewall': 'Firewall',
    'Spam': 'Spam',
    'Database': 'Database'
};

class Node {

    constructor(x, y) {
        this.id = `hacking-mission-node-${y}-${x}`;
        this.x = x;
        this.y = y;

        this.type = types[this.text.trim().split(/\s/, 1)[0]];
        this.connection = null;

        this.update();
    }

    click() {
        this.element.click();
    }

    get element() {
        return document.getElementById(this.id);
    }

    get text() {
        return document.getElementById(this.id + '-txt').innerText;
    }

    disconnect() {
        if (this.connection)
            this.connection.element.style.backgroundColor = '';
        this.connection = null;
    }

    connect(other) {
        this.connection = other;
    }

    update() {
        const element = this.element;
        this.isMine = element.classList.contains('hack-mission-player-node');
        this.isEnemy = element.classList.contains('hack-mission-enemy-node');
        if (this.connection && this.connection.isMine)
            this.disconnect();

        const text = this.text.split('\n').map(e => e.trim());
        this.type = text[0].split(' ', 1)[0];
        this.hp = Number(text[1].split(' ', 2)[1].replace(/,/g, ''));
        this.atk = Number(text[2].split(' ', 2)[1].replace(/,/g, ''));
        this.def = Number(text[3].split(' ', 2)[1].replace(/,/g, ''));
        this.weight = this.isMine ? 0 : this.def + this.hp;
    }
}