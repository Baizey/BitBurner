function secureScript(script) {
    return Array.isArray(script) ? script : [script];
}

export class Runner {
    constructor(ns, host = ns.getHostname(), defaultArgs = '') {
        this.ns = ns;
        this.host = host;
        this.defaultArgs = defaultArgs;
    }

    threads(script) {
        const ram = this.ns.getServerRam(this.host);
        const need = this.ns.getScriptRam(script) + .01;
        return Math.floor((ram[0] - ram[1]) / need);
    }

    isRunning(script, args = this.defaultArgs) {
        return this.ns.isRunning(script, this.host, args);
    }

    async await(scripts, args = this.defaultArgs) {
        scripts = secureScript(scripts);
        for (let i in scripts) {
            const script = scripts[i];
            this.ns.print(`Waiting for ${script} (${args}) to finish...`);
            while (this.ns.isRunning(script, this.host, args))
                await this.ns.sleep(1000);
            this.ns.print(`${script} (${args}) finished...`);
        }
    }

    async start(scripts, threads = 1, args = this.defaultArgs) {
        if (threads < 1) return;
        let ns = this.ns;
        scripts = secureScript(scripts);
        threads = Math.min(threads, this.threads(scripts[0]));
        for (let i in scripts)
            while (!(await ns.exec(scripts[i], this.host, threads, args)))
                await ns.sleep(1000);
    }

    async finish(scripts, threads = 1, args = this.defaultArgs) {
        scripts = secureScript(scripts);
        await this.start(scripts, threads, args);
        await this.await(scripts, args);
    }

    async kill(scripts, args = this.defaultArgs) {
        scripts = secureScript(scripts);
        for (let i in scripts)
            await this.ns.kill(scripts[i], this.host, args);
        await this.await(scripts, args);
    }
}