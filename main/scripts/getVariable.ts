import { PythonShell } from "python-shell";

export function GetVariable({ path }: { path: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    const script = `
import ast
import json

class VariableTypeExtractor(ast.NodeVisitor):
    def __init__(self):
        self.variables = {}
        self.local_vars = {}
        self.functions = {}

    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                var_name = target.id
                var_type, var_value = self._get_type_and_value(node.value)
                self.variables[var_name] = {
                    "type": var_type,
                    "value": var_value
                }
                self.local_vars[var_name] = var_value
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.functions[node.name] = ast.unparse(node)
        self.generic_visit(node)

    def _get_type_and_value(self, node):
        if isinstance(node, ast.Constant):
            value = node.value
            if isinstance(value, complex):
                return "complex", f"{value.real}+{value.imag}j"
            elif isinstance(value, range):
                return "range", list(value)
            return type(value).__name__, value

        elif isinstance(node, ast.Name):
            val = self.local_vars.get(node.id, "Unknown")
            val_type = type(val).__name__

            if isinstance(val, complex):
                val = f"{val.real}+{val.imag}j"
            elif isinstance(val, range):
                val = list(val)

            return val_type, val

        elif isinstance(node, ast.BinOp):
            left_type, left_value = self._get_type_and_value(node.left)
            right_type, right_value = self._get_type_and_value(node.right)
            try:
                result = eval(f"{repr(left_value)} {self._get_operator(node.op)} {repr(right_value)}")
                if isinstance(result, complex):
                    return "complex", f"{result.real}+{result.imag}j"
                elif isinstance(result, range):
                    return "range", list(result)
                return type(result).__name__, result
            except:
                return "Unknown", "Unknown"

        elif isinstance(node, ast.Call):
            try:
                func_name = ast.unparse(node.func)
                if func_name in self.functions:
                    exec(self.functions[func_name], self.local_vars)
                result = eval(ast.unparse(node), self.local_vars)

                if isinstance(result, complex):
                    return "complex", f"{result.real}+{result.imag}j"
                elif isinstance(result, range):
                    return "range", list(result)

                return type(result).__name__, result
            except:
                return "Function Call", "Unknown"

        elif isinstance(node, ast.List):
            return "List", [self._get_type_and_value(el)[1] for el in node.elts]
        elif isinstance(node, ast.Dict):
            keys = [self._get_type_and_value(k)[1] for k in node.keys]
            values = [self._get_type_and_value(v)[1] for v in node.values]
            return "Dict", dict(zip(keys, values))
        elif isinstance(node, ast.Set):
            return "Set", list({self._get_type_and_value(el)[1] for el in node.elts})
        elif isinstance(node, ast.Tuple):
            return "Tuple", tuple(self._get_type_and_value(el)[1] for el in node.elts)
        elif isinstance(node, ast.Subscript):
            return "Subscript", "Subscript"
        elif isinstance(node, ast.Attribute):
            return "Attribute", "Attribute"
        else:
            return "Unknown", "Unknown"

    def _get_operator(self, op):
        return {
            ast.Add: "+",
            ast.Sub: "-",
            ast.Mult: "*",
            ast.Div: "/"
        }.get(type(op), "Unknown")

    def get_variables(self):
        return self.variables

def extract_variables_from_file(file_path):
    with open(file_path, "r") as file:
        tree = ast.parse(file.read(), filename=file_path)

    try:
        extractor = VariableTypeExtractor()
        extractor.visit(tree)
        return extractor.get_variables()
    except:
        return {}

if __name__ == "__main__":
    file_path = r"${path}"
    variables = extract_variables_from_file(file_path)
    print(json.dumps(variables, indent=4))
`;

    const options = {
      pythonOptions: ["-u"],
      pythonPath: PythonShell.defaultPythonPath,
    };

    PythonShell.runString(script, options)
      .then((results) => {
        try {
          const output = JSON.parse(results.join("") || "{}");
          resolve(output);
        } catch (parseError) {
          reject(parseError);
        }
      })
      .catch(reject);
  });
}
