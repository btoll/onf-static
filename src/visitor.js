'use strict';

const binaryExpression = function (node, parent, results) {
    this.visit(node.left, node, results);
    this.visit(node.right, node, results);
};

const logicalExpression = binaryExpression;

const returnStatement = function (node, parent, results) {
    const nodeArgument = node.argument;

    if (nodeArgument) {
        const returnArgs = nodeArgument.arguments;

        if (returnArgs) {
            returnArgs.forEach(node => this.visit(node, parent, results));
        }

        this.visit(nodeArgument, node, results);
    }
};

const unaryExpression = returnStatement;

module.exports = {
    ArrayExpression(node, parent, results) {
        node.elements.forEach(element => this.visit(element, node, results));
    },

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

    BinaryExpression(node, parent, results) {
        binaryExpression.call(this, node, parent, results);
    },

    LogicalExpression(node, parent, results) {
        logicalExpression.call(this, node, parent, results);
    },

    BlockStatement(node, parent, results) {
        node.body.forEach(body => this.visit(body, parent, results));
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

    IfStatement(node, parent, results) {
        const alternate = node.alternate;

        this.visit(node.test, node, results);
        this.visit(node.consequent, node, results);

        if (alternate) {
            this.visit(alternate, node, results);
        }
    },

    MemberExpression(node, parent, results) {
        this.visit(node.object, parent, results);
    },

    NewExpression(node, parent, results) {
        node.arguments.forEach(argument => this.visit(argument, parent, results));
//        this.visit(node.arguments[0], node, results);
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
        returnStatement.call(this, node, parent, results);
    },

    SwitchStatement(node, parent, results) {
        this.visit(node.discriminant, node, results);

        node.cases.forEach(switchCase => {
            this.visit(switchCase.test, switchCase, results);

            switchCase.consequent.forEach(consequent =>
                this.visit(consequent, switchCase, results)
            );
        });
    },

    UnaryExpression(node, parent, results) {
        unaryExpression.call(this, node, parent, results);
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

