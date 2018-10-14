export function main(ns) {
};

export function inject(ns, code) {
    let id = '' + Math.random() + Math.random();
    let output = `<div id="${id}" style="position:absolute; width: 100%; height:100%"`;
    output += ` onmouseover="${code} document.getElementById('${id}').remove();"></div>`
    ns.tprint(output);
}

export function availThreads(ns, self) {
    let ram = ns.getServerRam(self);
    return Math.floor((ram[0] - ram[1]) / 2);
}

export function cmd(ns, cmd) {
    let code = `document.getElementById('terminal-input-text-box').value = '${cmd}'; document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13 }));`
    inject(ns, code);
}


export function asPercent(num) {
    return (Math.round(num * 100) + '%').padStart(4, '.');
}

export function display(number) {
    const neg = number < 0 ? '-' : '';
    number = Math.abs(number);
    let units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    let i = 0;
    for (; i < units.length && number >= 1000; i++)
        number /= 1000;
    i = Math.min(i, units.length - 1);
    return neg.padStart(1, '.') + ('' + Math.round(number)).padStart(3, '.') + units[i].padEnd(2, '.');
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