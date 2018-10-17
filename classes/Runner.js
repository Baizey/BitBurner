function secureScript(script) {
    return Array.isArray(script) ? script : [script];
}

export class Runner {
    constructor(ns, host = ns.getHostname(), target = '') {
        this.ns = ns;
        this.host = host;
        this.target = target;
    }

    availThreads(script) {
        let ram = this.ns.getServerRam(this.host);
        let need = Math.ceil(this.ns.getScriptRam(script));
        let threads = Math.floor((ram[0] - ram[1]) / need);
        this.ns.print(`${script} needs ${need} ram, with ${ram[0] - ram[1]} ram free we get ${threads} threads`);
        return threads;
    }

    async await(script, arg = this.target) {
        script = secureScript(script);
        for (let i in script) {
            this.ns.print(`Waiting for ${script[i]} (${arg}) to finish...`);
            while (this.ns.isRunning(script[i], this.host, arg))
                await this.ns.sleep(1000);
            this.ns.print(`${script[i]} (${arg}) finished...`);
        }
    }

    async start(script, threads = 1, arg = this.target) {
        let ns = this.ns;
        script = secureScript(script);
        threads = Math.min(threads, this.availThreads(script[0]));
        for (let i in script)
            while (!(await ns.run(script[i], threads, arg)))
                await ns.sleep(1000);
    }

    async finish(script, threads = 1, arg = this.target) {
        script = secureScript(script);
        await this.start(script, threads, arg);
        await this.await(script, arg);
    }

    async kill(script, arg = this.target) {
        script = secureScript(script);
        for (let i in script)
            await this.ns.kill(script[i], this.host, arg);
        await this.await(script, arg);
    }
}