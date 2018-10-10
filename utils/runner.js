import {availThreads} from "helper.ns";

function Runner(nsObject, serverHost, target = '') {
    this.nsObject = nsObject;
    this.serverHost = serverHost;
    this.target = target;
}

Runner.prototype.await = async function (script, arg = this.target) {
    let n = this.nsObject;
    if (!Array.isArray(script)) script = [script];
    for (let i in script) {
        n.print(`Waiting for ${script[i]} to finish...`);
        n.disableLog('ALL');
        while (n.isRunning(script[i], this.serverHost, arg))
            await n.sleep(1000);
        n.enableLog('ALL');
        n.print(`${script[i]} finished`);
    }
}

Runner.prototype.finish = async function (script, threads = 1, arg = this.target) {
    if (!Array.isArray(script)) script = [script];
    await this.start(script, threads, arg);
    await this.await(script, arg);
}

Runner.prototype.start = async function (script, threads = 1, arg = this.target) {
    let n = this.nsObject;
    if (!Array.isArray(script)) script = [script];
    threads = Math.min(availThreads(n, this.serverHost), threads);
    for (let i in script)
        await n.run(script[i], threads, arg);
}

Runner.prototype.kill = async function (script, arg = this.target) {
    let n = this.nsObject;
    if (!Array.isArray(script)) script = [script];
    for (let i in script)
        await n.kill(script[i], this.serverHost, arg);
    await this.await(script, arg);
}

export function getRunner(ns, host, target) {
    return new Runner(ns, host, target);
}