function availThreads(ns, self) {
    let ram = ns.getServerRam(self);
    return Math.floor((ram[0] - ram[1]) / 2);
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
            while (this.ns.isRunning(script[i], this.serverHost, arg))
                await this.ns.sleep(1000);
            this.ns.print(`${script[i]} (${arg}) finished...`);
        }
    }

    async start(script, threads = 1, arg = this.target) {
        script = secureScript(script);
        threads = Math.min(threads, availThreads(this.ns, this.host));
        for (let i in script)
            await this.ns.run(script[i], threads, arg);
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