'use strict';

const jsBeautify = require('js-beautify').js_beautify;
const transformer = require('../transformer');

module.exports = {
    print: (results, verbosity) =>
        // A Promise isn't strictly necessary here.
        new Promise((resolve) => {
            const rows = [];

            for (const entry of results) {
                const desc = entry.desc;
                const loc = entry.node.loc;

                if (verbosity < 1) {
                    rows.push(
                        `Type ${entry.type}, Lines ${loc.start.line}-${loc.end.line}`
                    );
                }

                if (verbosity >= 1) {
                    rows.push(
                        // NOTE: It looks odd to wrap the strings in an array only to join
                        // them back together into a string, but it's to control the spacing.
                        [
                            `// Type ${entry.type}`,
                            `// Lines ${loc.start.line}-${loc.end.line}`,
                            desc ?
                                `// ${desc}\n` :
                                ''
                        ].join('\n')
                    );

                    // If maximum verbosity, push on the code snippet.
                    if (verbosity > 1) {
                        rows.push(`${jsBeautify(transformer.getNodeValue(entry))}\n`);
                    }
                }
            }

            resolve(rows.join('\n'));
        })
};

