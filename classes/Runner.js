function availThreads(ns, self, script) {
    let ram = ns.getServerRam(self);
    let need = ns.getScriptRam();
    return Math.floor((ram[0] - ram[1]) / need);
}

function secureScript(script) {
    return Array.isArray(script) ? script : [script];
}

export class Runner {
    constructor(ns, host = ns.getHostname(), target = '') {
        this.ns = ns;
        this.host = host;
        this.target = target;
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
        threads = Math.min(threads, availThreads(this.ns, this.host, script[0]));
        for (let i in script)
            while(!(await ns.run(script[i], threads, arg)))
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