import nunjucks from 'nunjucks';

function LoadExtension() {
  this.tags = ['load'];

  this.parse = function (parser, nodes, lexer) {
    const tok = parser.nextToken();

    const args = parser.parseSignature(null, true);

    let asVar = null;
    if (parser.skipSymbol('as')) {
      const varTok = parser.nextToken();
      asVar = varTok.value;
    }

    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtension(this, 'run', args, [asVar]);
  };

  this.run = function (context, path, asVar) {
    const ctx = context.getVariables();
    let result;

    const inlineMatch = path && path.match(/^(!.+!)?(.+)$/);

    if (inlineMatch) {
      const loaderChainStr = inlineMatch[1];
      const filePath = inlineMatch[2];

      if (loaderChainStr) {
        const loaders = loaderChainStr.slice(0, -1).split('!').filter(Boolean);
        let content;

        try {
          content = require(filePath);
        } catch (e) {
          if (loaderChainStr.includes('raw')) {
            content = '';
          } else {
            throw e;
          }
        }

        for (const loader of loaders.reverse()) {
          try {
            const loaderFn = require(loader);
            content = loaderFn(content);
          } catch (e) {
            // Loader failed
          }
        }

        result = typeof content === 'string' ? content : JSON.stringify(content);
      } else {
        result = this.env.render(filePath, ctx);
      }
    } else if (path) {
      result = this.env.render(path, ctx);
    } else {
      result = '';
    }

    if (asVar) {
      context.setVariable(asVar, result);
      return '';
    }

    return new nunjucks.runtime.SafeString(result);
  };
}

module.exports = new LoadExtension();
