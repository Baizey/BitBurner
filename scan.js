let facServers = {
    "CSEC": "yellow",
    "avmnite-02h": "yellow",
    "I.I.I.I": "yellow",
    "run4theh111z": "yellow",
    "The-Cave": "orange",
    "w0r1d_d43m0n": "red"
};

let svObj = (name = 'home', depth = 0) => ({name: name, depth: depth});

/** @param {import("Ns").NS } ns */
export function getServers(ns) {
    let result = [];
    let visited = {'home': 0};
    let queue = Object.keys(visited);
    let name;
    while ((name = queue.pop())) {
        let depth = visited[name];
        result.push(svObj(name, depth));
        let scanRes = ns.scan(name);
        for (let i = scanRes.length; i >= 0; i--) {
            if (visited[scanRes[i]] === undefined) {
                queue.push(scanRes[i]);
                visited[scanRes[i]] = depth + 1;
            }
        }
    }
    return result;
}

/** @param {import("Ns").NS } ns */
export async function main(ns) {
    let output = "Network:";

    getServers(ns).forEach(server => {
        let name = server.name;
        let hackColor = ns.hasRootAccess(name) ? "lime" : "red";
        let nameColor = facServers[name] ? facServers[name] : "white";

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

        output += ["<br>", "---".repeat(server.depth),
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