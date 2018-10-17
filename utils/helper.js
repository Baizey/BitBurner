export function inject(ns, code) {
    let id = ("" + Math.random() + Math.random()).replace(/\./g, '');
    let output = `<div id='${id}' style="position:absolute; width: 100%; height:100%" onmouseenter="if (typeof inject_${id} !== 'undefined') return;inject_${id} = true;document.getElementById('${id}').remove();${code}"></div>`;
    ns.tprint(output);
}

export function cmd(ns, cmd) {
    let code = `
        document.getElementById('terminal-input-text-box').value = '${cmd}';
        document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, keyCode: 13 }));
    `;
    inject(ns, code);
}


export function asPercent(num, usePadding = true) {



    return (Math.round(num * 100) + '%').padStart(usePadding ? 4 : 0, ' ');
}

export function display(numbers, usePadding = true) {
    let units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
    let input = numbers;
    numbers = Array.isArray(numbers) ? numbers : [numbers];
    let max = Math.max(...(numbers.map(Math.abs)));
    let unit = 0;
    for (; max >= 1000; unit++)
        max /= 1000;
    let div = Math.pow(10, unit * 3);

    let res = numbers.map(n => ('' + Math.round(n / div)).padStart(usePadding ? 4 : 0, ' ') + units[unit].padEnd(usePadding ? 2 : 0, ' '));

    return Array.isArray(input) ? res : res[0];
}

let asObj = (name = 'home', depth = 0) => ({
    name: name,
    depth: depth
});

export function getServerNames(ns) {
    return getServers(ns).map(s => s.name);
}

export function getServers(ns) {
    let result = [asObj()];
    let visited = {
        'home': 0
    };
    let queue = Object.keys(visited);
    let name;
    while ((name = queue.pop())) {
        let depth = visited[name] + 1;
        ns.scan(name).forEach(res => {
            if (visited[res] === undefined) {
                queue.push(res);
                visited[res] = depth;
                result.push(asObj(res, depth));
            }
        });
    }
    return result;
}