'use strict';

const chalk = require('chalk');
const jsBeautify = require('js-beautify').js_beautify;
const transformer = require('../transformer');

module.exports = {
    print: function (results) {
        // A Promise isn't strictly necessary here.
        return new Promise((resolve) => {
            const rows = [];

            for (const entry of results) {
                const desc = entry.desc;
                const loc = entry.node.loc;

                rows.push(
                    // NOTE: It looks odd to wrap the strings in an array only to join
                    // them back together into a string, but it's to control the spacing.
                    chalk.bgWhite.blue([
                        `// Type ${entry.type}`,
                        `// Lines ${loc.start.line} - ${loc.end.line}:`,
                        desc ? `// ${desc}\n` : ''
                    ].join('\n')),
                    `${jsBeautify(transformer.getNodeValue(entry))}\n`
                );
            }

            resolve(rows.join('\n'));
        });
    }
};
