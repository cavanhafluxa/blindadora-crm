const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            // Ignore node_modules, .next, .git
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

let changed = 0;
const regex = /(?<![a-zA-Z0-9-])text-(?:xs|\[(?:8|9|10|11|12)px\])(?![a-zA-Z0-9-])/g;

walk('./src').forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(regex, 'text-[13px]');
    
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changed++;
        console.log('Updated', file);
    }
});
console.log('Changed', changed, 'files');
