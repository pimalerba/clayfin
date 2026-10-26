const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    if (sourcePath.endsWith('.ts') || sourcePath.endsWith('.tsx')) {
      const result = ts.transpileModule(sourceText, {
        fileName: sourcePath,
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      return {
        code: result.outputText,
      };
    }
    return { code: sourceText };
  },
};
