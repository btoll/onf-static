'use strict';

module.exports = {
    print: results =>
        // A Promise isn't strictly necessary here.
        new Promise((resolve) => {
            const rows = [];

            for (const entry of results) {
                const desc = entry.desc;
                const loc = entry.node.loc;

                rows.push(
                    // NOTE: It looks odd to wrap the strings in an array only to join
                    // them back together into a string, but it's to control the spacing.
                    `Type ${entry.type}`,
                    `Lines ${loc.start.line}-${loc.end.line}`,
                    desc ?
                        `${desc}\n` :
                        ''
                );
            }

            resolve(rows.join('\n'));
        })
};

