const facServers = {
    "CSEC": "yellow",
    "avmnite-02h": "yellow",
    "I.I.I.I": "yellow",
    "run4theh111z": "yellow",
    "The-Cave": "orange",
    "w0r1d_d43m0n": "red"
};

const ServerType = {
    home: 'home',
    own: 'own',
    foreign: 'foreign'
}

class Server {
    /**
     * @param {string} name
     * @param {number} depth
     */
    constructor(name, depth) {
        this.name = name;
        this.depth = depth;
    }

    /**
     * @returns {boolean}
     */
    isHome() {
        return this.name === 'home';
    }
}

/**
 * @param {import("Ns").NS } ns
 * @returns {Server[]} depth is 1-indexed
 */
export function getServers(ns) {
    const result = [];
    const visited = {'home': 1};
    const queue = Object.keys(visited);
    while (queue.length > 0) {
        const current = queue.pop();
        result.push(new Server(current, depth))
        result.push({name: current, depth: visited[current]});
        ns.scan(current)
            .reverse()
            .filter(e => !visited[e])
            .forEach(server => {
                queue.push(server);
                visited[server] = visited[current] + 1;
            })
    }
    return result;
}

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    let output = "Network:";

    getServers(ns).forEach(server => {
        const name = server.name;
        const hackColor = ns.hasRootAccess(name) ? "lime" : "red";
        const nameColor = facServers[name] || "white";

        let hoverText = ["Req Level: ", ns.getServerRequiredHackingLevel(name),
            "&#10;Req Ports: ", ns.getServerNumPortsRequired(name),
            "&#10;Memory: ", ns.getServerMaxRam(name), "GB",
            "&#10;Security: ", ns.getServerSecurityLevel(name),
            "/", ns.getServerMinSecurityLevel(name),
            "&#10;Money: ", Math.round(ns.getServerMoneyAvailable(name)).toLocaleString(), " (",
            Math.round(100 * ns.getServerMoneyAvailable(name) / ns.getServerMaxMoney(name)), "%)"
        ].join("");

        let ctText = "";
        ns.ls(name, ".cct").forEach(ctName => {
            ctText += ["<a title='", ctName,
                //Comment out the next line to reduce footprint by 5 GB
                "&#10;", ns.codingcontract.getContractType(ctName, name),
                "'>©</a>"].join("");
        });

        output += ["<br>", "---".repeat(server.depth - 1),
            `<font color=${hackColor}>■ </font>`,
            `<a class='scan-analyze-link' title='${hoverText}''

            onClick="(function()
            {
                const terminalInput = document.getElementById('terminal-input');
                terminalInput.value='home; run connect.js ${name}';
                const handler = Object.keys(terminalInput)[1];
                terminalInput[handler].onChange({target:terminalInput});
                terminalInput[handler].onKeyDown({keyCode:13,preventDefault:()=>null});
            })();"

            style='color:${nameColor}'>${name}</a> `,
            `<font color='fuchisa'>${ctText}</font>`,
        ].join("");
    });

    const list = document.getElementById("terminal");
    list.insertAdjacentHTML('beforeend', output);
}