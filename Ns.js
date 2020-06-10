class Ns {
    Ns() {
        this.args = ['args'];
    }

    /**
     * Raises security by 0.002 per thread on success
     * @param {string} hostname
     * @param {{threads:number, stock:boolean}} options
     */
    async hack(hostname, options = {});

    /**
     * Raises security by 0.004 per thread on success
     * @param {string} hostname
     * @param {{threads:number, stock:boolean}} options
     */
    async grow(hostname, options = {});

    /**
     * Lowers security by 0.05 per thread on success
     * @param {string} hostname
     * @param {{threads:number}} options
     */
    async weaken(hostname, options = {});

    /**
     * @param {string} hostname
     * @param {number} amount of money to take
     * @returns {number} number of threads needed
     */
    hackAnalyzeThreads(hostname, amount);

    /**
     * @param {string} hostname
     * @returns {number} percent of money a single thread can hack
     */
    hackAnalyzePercent(hostname);

    hackChance(hostname);

    /**
     * @param {string} hostname
     * @param {number} factor
     * @returns {number} number of threads needed
     */
    growthAnalyze(hostname, factor);

    /**
     * @param {number} milliseconds
     */
    async sleep(milliseconds);

    print();

    tprint();

    clearLog();

    disableLog();

    enableLog();

    isLogEnabled();

    getScriptLogs();

    tail();

    scan();

    nuke(hostname);

    brutessh(hostname);

    ftpcrack(hostname);

    relaysmtp(hostname);

    httpworm(hostname);

    sqlinject(hostname);

    async run(scriptName, threads = 1, ...args);

    async exec(scriptName, hostname, threads = 1, ...args);

    async spawn();

    async kill();

    async killall();

    exit();

    scp();

    ls();

    ps();

    hasRootAccess(hostname);

    getHostname();

    getHackingLevel();

    getHackingMultipliers();

    getHacknetMultipliers();

    getServerMoneyAvailable(hostname);

    getServerMaxMoney(hostname);

    getServerGrowth(hostname);

    getServerSecurityLevel(hostname);

    getServerBaseSecurityLevel(hostname);

    getServerMinSecurityLevel(hostname);

    getServerRequiredHackingLevel(hostname);

    getServerNumPortsRequired(hostname);

    getServerRam(hostname);

    serverExists(hostname);

    fileExists(filename, hostname = '');

    isRunning(script, host, ...args);

    getPurchasedServerCost();

    purchaseServer(hostname, ram);

    deleteServer();

    /**
     * @returns {string[]}
     */
    getPurchasedServers();

    getPurchasedServerLimit();

    getPurchasedServerMaxRam();

    write();

    tryWrite();

    read();

    peek();

    clear();

    getPortHandle();

    rm(filename, hostname = '');

    scriptRunning(scriptName, hostname);

    scriptKill(scriptName, hostname);

    getScriptName();

    getScriptRam();

    /**
     * @param hostname
     * @param hacklevel
     * @param intLevel
     * @returns number, time in seconds
     */
    getHackTime(hostname, hacklevel = 0, intLevel = 0);

    /**
     * @param hostname
     * @param hacklevel
     * @param intLevel
     * @returns number, time in seconds
     */
    getGrowTime(hostname, hacklevel = 0, intLevel = 0);

    /**
     * @param hostname
     * @param hacklevel
     * @param intLevel
     * @returns number, time in seconds
     */
    getWeakenTime(hostname, hacklevel = 0, intLevel = 0);

    getScriptIncome();

    getScriptExpGain();

    getTimeSinceLastAug();

    sprintf();

    vsprintf();

    nFormat();

    prompt(question);

    async wget(url, filename, toHost = '');

    getFavorToDonate();

    getFavorToDonate();

    getFavorToDonate();

    getFavorToDonate();

    /**
     * @returns {{HackExpGain: number, ServerMaxMoney: number}}
     */
    getBitNodeMultipliers();
}
