const fs = require('fs')
const { resolve, join } = require('path')
const generate = require('@babel/generator').default;
const { addNamed } = require("@babel/helper-module-imports")

const storeTerms = {}

function BabelPluginSimpleI18N(babel) {
  const { types: t } = babel
  return {
    name: 'react-intl-export-keys',
    visitor: {
      CallExpression: {
        enter(path, state) {
          const { functionName = "__", outputFile = false } = state.opts
          if (path.node.callee.name === state.opts.functionName && t.isIdentifier(path.node.callee)) {
            if(path.node.arguments.length >= 2) {
              const importName = addNamed(path, 'FormattedMessage', 'react-intl');
              if (path.node.arguments[1].type == 'StringLiteral') {
                const id = (path.node.arguments[0]||{}).value
                const defaultMessage = (path.node.arguments[1]||{}).value
                const values = (path.node.arguments[2]||{}).properties

                storeTerms[id] = defaultMessage

                const params = (values||[]).map((node) => {
                  const v = node.value.value ? `"${node.value.value}"` : generate(node.value).code
                  return `${node.key.name}: ${v}`
                })

                path.replaceWithSourceString(`React.createElement(${importName.name}, {
                  id: ${JSON.stringify(id)},
                  defaultMessage: ${JSON.stringify(defaultMessage)},
                  values: {${params.join(',')}}
                }, (txt) => txt)`);

                if (!state.opts.outputFile) {
                  return
                }

                const fileOutput = resolve(join(process.cwd(), state.opts.outputFile))

                if (process.env.BABEL_ENV !== 'production') {
                  console.warn(`Warning: babel-plugin-react-intl-export-keys mod dev.`)
                }

                if (process.env.BABEL_ENV === 'production') {
                  fs.writeFileSync(fileOutput, JSON.stringify(storeTerms, null, 2))
                }
              }
            }
          }
        }
      }
    }
  };
}

module.exports = BabelPluginSimpleI18N
