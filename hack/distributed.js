import {Runner} from "Runner.js";
import {getArgs, Server, asPercent} from "helper.js";
import {Log} from "Log.js";

let defaultTaking = 0.5;
let TicketId = 0;

const Priority = {
    hack: 0,
    grow: 1,
    weaken: 2,
    other: 3
};

const Status = {
    Created: 'Created',
    Initiating: 'Initiating',
    Running: 'Running',
    Done: 'Done'
};

class WorkTicket {
    /**
     * @param {Server} target
     * @param {number} threads
     * @param {String} script
     * @param {number} priority
     */
    constructor(target, threads, script, priority = undefined) {
        this.target = target;
        this.threads = threads;
        this.progress = 0;
        this.script = script;
        this.status = Status.Created;
        this.id = TicketId++;

        if (priority)
            this.priority = priority;
        else
            switch (script) {
                case 'hack.script':
                    this.priority = Priority.hack;
                    break;
                case 'grow.script':
                    this.priority = Priority.grow;
                    break;
                case 'weaken.script':
                    this.priority = Priority.weaken;
                    break;
                default:
                    this.priority = Priority.other;
            }
    }

    setStatus(status) {
        this.status = status;
    }

    isNew() {
        return this.status === Status.Created;
    }

    isDone() {
        return this.status === Status.Done;
    }
}

class Scheduler {

    constructor(ns, masters, workerTypes) {
        this.ns = ns;
        this.workerTypes = workerTypes;
        this.masters = masters;
        this.queue = [];
        this.waiting = [];
        this.runners = {};
        this.scripts = {};
    }

    pollWork() {
        this.masters.forEach(master => {
            master.queue
                .filter(work => work.isNew())
                .forEach(work => {
                    work.setStatus(Status.Initiating);
                    this.queue.push(work);
                });
        });
        this.queue.sort((a, b) => {
            const priority = a.priority - b.priority;
            return priority === 0 ? a.threads - b.threads : priority;
        })
    }


    /**
     * @param {WorkTicket} ticket
     * @param {number} threads
     * @param server
     */
    saveScript(ticket, server, threads) {
        if (!this.scripts[ticket.id])
            this.scripts[ticket.id] = {};
        this.scripts[ticket.id][server] = threads;
    }

    /**
     * @param {WorkTicket} ticket
     * @returns {number}
     */
    getScript(ticket) {
        return this.scripts[ticket.id];
    }

    /**
     * @param {WorkTicket} ticket
     * @param server
     */
    removeScript(ticket, server) {
        delete this.scripts[ticket.id][server];
    }

    runner(server, target) {
        if (!this.runners[`${server}|${target}`])
            this.runners[`${server}|${target}`] = new Runner(this.ns, server, target);
        return this.runners[`${server}|${target}`];
    }

    findServers() {
        return Server.get(this.ns)
            .filter(server => {
                switch (this.workerTypes) {
                    case 'all':
                        return true;
                    case 'own':
                        return server.type === Server.types().Own;
                    default:
                    case 'nothome':
                        return server.name !== 'home';
                }
            })
            .filter(server => server.hasRoot)
            .map(server => {
                this.ns.scp(['hack.script', 'grow.script', 'weaken.script'], this.ns.getHostname(), server.name);
                return server;
            })
    }

    async cleanup() {
        const servers = this.findServers();
        const promises = [];
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            for (let j = 0; j < this.masters.length; j++) {
                const master = this.masters[j];
                const runner = this.runner(server.name, master.target.name);
                promises.push(runner.kill(['hack.script', 'grow.script', 'weaken.script']));
            }
        }
        for (let i = 0; i < promises.length; i++)
            await promises[i];
    }

    async startWork() {
        const servers = this.findServers();
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];

            for (let j = 0; j < this.queue.length; j++) {
                const work = this.queue[j];
                if (work.status !== Status.Initiating)
                    continue;

                const runner = this.runner(server.name, work.target.name);

                const maxThreads = runner.threads(work.script);
                if (maxThreads < 1) break;

                if (runner.isRunning(work.script)) continue;

                const threads = Math.min(work.threads - work.progress, maxThreads);
                await runner.start(work.script, threads);
                this.saveScript(work, server.name, threads);
                work.progress += threads;

                if (work.progress >= work.threads) {
                    work.setStatus(Status.Running);
                    this.waiting.push(work);
                }
            }
        }

        this.queue = this.queue.filter(work => work.progress < work.threads);
    }

    pushWork() {
        this.waiting.forEach(work => {
            this.findServers().forEach(server => {
                if (!this.runner(server.name, work.target.name).isRunning(work.script))
                    this.removeScript(work, server.name);
            })
        });
        this.waiting.filter(work => {
            const servers = this.findServers();
            if (servers.length === 0) return true;
            return servers.every(server => !this.runner(server.name, work.target.name).isRunning(work.script));
        }).forEach(work => {
            work.setStatus(Status.Done);
        });

        this.waiting = this.waiting.filter(work => !work.isDone());
    }

    getTicketProgress(ticket) {
        const tickets = this.getScript(ticket);
        if (!tickets) return ticket.threads;
        return Object.keys(tickets).map(k => tickets[k]).reduce((a, b) => a + b, 0);
    }

    async run() {
        this.pollWork();
        await this.startWork();
        this.pushWork();
    }

}

class Master {

    constructor(ns, target, taking = .5) {
        this.ns = ns;
        this.target = Server.create(ns, target);
        this.taking = isNaN(taking) ? .5 : Math.min(.9, Math.max(0, taking));
        this.status = Status.Created;
        this.queue = [];
    }

    addWork(script, threads, priority = undefined) {
        if (threads < 1) return;
        this.queue.push(new WorkTicket(this.target, threads, script, priority));
    }

    waitingForQueue() {
        if (this.queue.length === 0)
            return false;

        const result = !this.queue.every(work => work.isDone());
        if (!result) this.queue = [];

        return result;
    }

    async run() {
        if (this.waitingForQueue())
            return;

        const target = this.target;
        const taking = this.taking;
        let threads;

        switch (this.status) {
            default:
                this.status = Status.Initiating;
                break;
            case Status.Initiating:
                this.status = Status.Running;
                break;
        }

        switch (this.status) {
            default:
            case Status.Initiating:
                threads = analyzeTarget(target, 1 - (target.moneyAvail / target.moneyMax));
                const diff = Math.round((target.securityCurr - target.securityMin) / .05);
                if (threads.grow > 0 || diff > 0) {
                    this.addWork('weaken.script', diff, Priority.grow);
                    this.addWork('grow.script', threads.grow);
                    this.addWork('weaken.script', threads.weaken);
                }
                break;

            case Status.Running:
                threads = analyzeTarget(target, taking);
                this.addWork('hack.script', threads.hack);
                this.addWork('grow.script', threads.grow);
                this.addWork('weaken.script', threads.weaken);
                break;
        }
    }

}

/**
 * @param {Server} target
 * @param {number} taking
 * @returns {{hack: number, grow: number, weaken: number}}
 */
function analyzeTarget(target, taking) {
    let hack = Math.floor(target.ns.hackAnalyzeThreads(target.name, target.moneyMax * taking));
    let grow = Math.ceil(target.ns.growthAnalyze(target.name, 1 / (1 - taking)));
    return {
        hack: hack,
        grow: grow,
        weaken: Math.ceil((.004 * grow + .002 * hack) / .05) + 5,
    }
}


/**
 * @param {Ns} ns
 */
export async function main(ns) {
    ns.disableLog('ALL');
    let args = getArgs(ns);

    let targets = args[0]
        ? args[0].split(',')
        : Server.get(ns)
            .filter(server => server.hasRoot)
            .filter(server => server.type === Server.types().MoneyFarm)
            .map(server => server.name);

    let taking = (args[1] || defaultTaking) - 0;
    let workerTypes = args[2] || 'nothome';

    const log = new Log(ns);
    const masters = targets.map(target => new Master(ns, target, taking));
    const scheduler = new Scheduler(ns, masters, workerTypes);

    await scheduler.cleanup();

    while (true) {
        for (let i = 0; i < masters.length; i++)
            await masters[i].run();
        await ns.sleep(500);
        await scheduler.run();
        await ns.sleep(500);

        const threadsWaiting = scheduler.queue.map(work => work.progress).reduce((a, b) => a + b, 0);
        const totalThreads = scheduler.queue.map(work => work.threads).reduce((a, b) => a + b, 0);
        log.set(0, `Tickets total: ${scheduler.queue.length + scheduler.waiting.length}`)
            .set(1, `Tickets ${Status.Initiating}: ${scheduler.queue.length}`)
            .set(2, `Threads waiting: ${threadsWaiting} (${asPercent(threadsWaiting / totalThreads)})`)
            .set(3, `Tickets ${Status.Running}: ${scheduler.waiting.length}`);

        for (let i = 5, j = 0; j < masters.length; j++, i += 2) {
            const master = masters[j];
            log.set(i, `${master.target.name} (${master.status}): ${master.queue.map(work => `${work.script.split('.')[0]}: ${work.status} (Progress: ${asPercent(work.status === Status.Initiating ? work.progress / work.threads : (1 - scheduler.getTicketProgress(work) / work.threads))})`).join(', ')}`);
        }

        log.display();
    }
}