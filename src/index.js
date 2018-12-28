const fs = require('fs')
const { resolve, join } = require('path')
const generate = require('@babel/generator').default;
const { addNamed } = require("@babel/helper-module-imports")

const storeTerms = {}

function BabelPluginSimpleI18N(babel) {
  const { types: t } = babel
  return {
    visitor: {
      CallExpression: {
        enter(path, state) {
          if (path.node.callee.name === '__' && t.isIdentifier(path.node.callee)) {
            if(path.node.arguments.length >= 2) {
              const importName = addNamed(path, 'FormattedMessage', 'react-intl');
              if (path.node.arguments[1].type == 'StringLiteral') {
                const id = (path.node.arguments[0]||{}).value
                const defaultMessage = (path.node.arguments[1]||{}).value
                const values = (path.node.arguments[2]||{}).properties

                storeTerms[id] = defaultMessage
                const params = generate(values)

                path.replaceWithSourceString(`React.createElement(${importName.name}, {
                  id: ${JSON.stringify(id)},
                  defaultMessage: ${JSON.stringify(defaultMessage)},
                  values: {${params.join(',')}}
                }, (txt) => txt)`);

                const fileOutput = resolve(join(process.cwd(), state.opts.outputFile))
                fs.writeFileSync(fileOutput, JSON.stringify(storeTerms, null, 2))
              }
            }
          }
        }
      }
    }
  };
}

module.exports = BabelPluginSimpleI18N
