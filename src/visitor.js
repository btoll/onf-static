'use strict';

// NOTE:
// We wrap the node in a context object so we can specify our own custom node types like
// 'TooManyReturns', etc.  It's better to do this than to modify objects we don't own,
// which is no bueno on its own merits, and also because it can lead to headaches since
// we're collecting references NOT copies.
//
//        results.push({
//            node,
//            type: 'TooManyReturns'
//        });
//

module.exports = {
    ArrowFunctionExpression(node, parent, results) {
        const bodies = node.body.body;

        if (bodies && Array.isArray(bodies)) {
            bodies.forEach(body => this.visit(body, node, results));
        }
    },

    AssignmentExpression(node, parent, results) {
        this.visit(node.left, node, results);
        this.visit(node.right, node, results);
    },

    // TODO: DRY!
    BinaryExpression(node, parent, results) {
        this.visit(node.left, node, results);
        this.visit(node.right, node, results);
    },

    // TODO: DRY!
    LogicalExpression(node, parent, results) {
        this.visit(node.left, node, results);
        this.visit(node.right, node, results);
    },

    CallExpression(node, parent, results) {
        const callArgs = node.arguments;
        const callee = node.callee;

        if (callArgs.length) {
            callArgs.forEach(node => this.visit(node, node, results));
        }

        if (callee) {
            this.visit(callee, node, results);
        }
    },

    ExpressionStatement(node, parent, results) {
        this.visit(node.expression, parent, results);
    },

    // TODO
    ForStatement: () => {},
    ForInStatement: () => {},
    ForOfStatement: () => {},
    DoWhileStatement: () => {},
    WhileStatement: () => {},

    FunctionExpression(node, parent, results) {
        // TODO
        node.body.body.forEach(body => this.visit(body, node, results));
    },

    MemberExpression(node, parent, results) {
        this.visit(node.object, parent, results);
    },

    ObjectExpression(node, parent, results) {
        node.properties.forEach(node => this.visit(node, parent, results));
    },

    Program(node, parent, results) {
        node.body.forEach(body => this.visit(body, node, results));
        return results;
    },

    Property(node, parent, results) {
        this.visit(node.value, parent, results);
    },

    ReturnStatement(node, parent, results) {
        const returnArgs = node.argument.arguments;

        if (returnArgs) {
            returnArgs.forEach(node => this.visit(node, parent, results));
        }

        this.visit(node.argument, node, results);
    },

    VariableDeclarator(node, parent, results) {
        this.visit(node.id, parent, results);

        if (node.init) {
            this.visit(node.init, parent, results);
        }
    },

    VariableDeclaration(node, parent, results) {
        node.declarations.forEach(declaration => this.visit(declaration, /* parent */ node, results));
    },

    visit(node, parent, results) {
        return this[node.type] && this[node.type](node, parent, results);
    }
};

