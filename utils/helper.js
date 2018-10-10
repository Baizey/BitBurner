export function main(ns) {
};

export function inject(ns, code) {
    let id = '' + Math.random() + Math.random();
    let output = `<div id="${id}" style="position:absolute; width: 100%; height:100%"`;
    output += ` onmouseover="${code} document.getElementById('${id}').remove();"></div>`
    ns.tprint(output);
}

export function cmd(ns, cmd) {
    let code = `document.getElementById('terminal-input-text-box').value = '${cmd}'; document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13 }));`
    inject(ns, code);
}

export function availThreads(ns, self) {
    let ram = ns.getServerRam(self);
    return Math.floor((ram[0] - ram[1]) / 2);
}

export function getCracks() {
    return ['brutessh.exe', 'ftpcrack.exe', 'relaysmtp.exe', 'httpworm.exe', 'sqlinject.exe'];
}

export function display(number) {
    const isNeg = number < 0;
    number = Math.abs(number);

    let i = 0;
    for (; number >= 1000; i += 3)
        number /= 1000;

    const unit = 'e' + i.toString().padStart(3, '_');
    number = (isNeg ? '-' : '') + Math.floor(number);
    return number.padStart(4, ' ') + unit;
}

let asObj = (name = 'home', depth = 0) => ({
    name: name,
    depth: depth
});

export function getServers(ns) {
    let result = [asObj()];
    let visited = {
        'home': 0
    };
    let servers = Object.keys(visited);
    let name;
    while ((name = servers.pop())) {
        let depth = visited[name] + 1;
        ns.scan(name).forEach(res => {
            if (!visited[res]) {
                servers.push(res);
                visited[res] = depth;
                result.push(asObj(res, depth));
            }
        });
    }
    return result;
}