import ast
import json
import sys
import hashlib
from typing import Dict, List, Any, Optional, Set


class PythonStructureParser(ast.NodeVisitor):
    def __init__(self):
        self.variables: List[Dict[str, Any]] = []
        self.functions: List[Dict[str, Any]] = []
        self.classes: List[Dict[str, Any]] = []
        self.current_class: Optional[str] = None
        self.visited_names: Set[str] = set()
        self.scope_stack: List[str] = []
        
    def _is_private(self, name: str) -> bool:
        """Check if a name is private (starts with underscore but not dunder)"""
        return name.startswith('_') and not (name.startswith('__') and name.endswith('__'))
    
    def _should_skip_name(self, name: str) -> bool:
        """Skip built-in names and private names"""
        builtins = {'True', 'False', 'None', '__name__', '__file__', '__doc__'}
        return name in builtins or self._is_private(name)
    
    def _get_scope_key(self, name: str) -> str:
        """Generate a unique key for scoped names"""
        if self.current_class:
            return f"{self.current_class}.{name}"
        return name
    
    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        if self._should_skip_name(node.name):
            return
            
        scope_key = self._get_scope_key(node.name)
        if scope_key not in self.visited_names:
            class_info = {
                'name': node.name,
                'line': node.lineno,
                'methods': []
            }
            self.visited_names.add(scope_key)
            
    
            old_class = self.current_class
            self.current_class = node.name
            
    
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    method_key = self._get_scope_key(item.name)
                    if not self._should_skip_name(item.name) and method_key not in self.visited_names:
                        class_info['methods'].append({
                            'name': item.name,
                            'line': item.lineno
                        })
                        self.visited_names.add(method_key)
            
            self.classes.append(class_info)
            self.current_class = old_class
    
    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:

        if self.current_class is None and not self._should_skip_name(node.name):
            scope_key = self._get_scope_key(node.name)
            if scope_key not in self.visited_names:
                self.functions.append({
                    'name': node.name,
                    'line': node.lineno
                })
                self.visited_names.add(scope_key)
    
    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:

        if self.current_class is None and not self._should_skip_name(node.name):
            scope_key = self._get_scope_key(node.name)
            if scope_key not in self.visited_names:
                self.functions.append({
                    'name': node.name,
                    'line': node.lineno
                })
                self.visited_names.add(scope_key)
    
    def visit_Assign(self, node: ast.Assign) -> None:

        if self.current_class is None:
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if not self._should_skip_name(target.id):
                        scope_key = self._get_scope_key(target.id)
                        if scope_key not in self.visited_names:
                            self.variables.append({
                                'name': target.id,
                                'line': node.lineno
                            })
                            self.visited_names.add(scope_key)
                elif isinstance(target, ast.Tuple):
            
                    for elt in target.elts:
                        if isinstance(elt, ast.Name) and not self._should_skip_name(elt.id):
                            scope_key = self._get_scope_key(elt.id)
                            if scope_key not in self.visited_names:
                                self.variables.append({
                                    'name': elt.id,
                                    'line': node.lineno
                                })
                                self.visited_names.add(scope_key)
    
    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:

        if self.current_class is None and isinstance(node.target, ast.Name):
            if not self._should_skip_name(node.target.id):
                scope_key = self._get_scope_key(node.target.id)
                if scope_key not in self.visited_names:
                    self.variables.append({
                        'name': node.target.id,
                        'line': node.lineno
                    })
                    self.visited_names.add(scope_key)
    
    def visit_Import(self, node: ast.Import) -> None:

        for alias in node.names:
            name = alias.asname if alias.asname else alias.name
            if not self._should_skip_name(name):
                scope_key = self._get_scope_key(name)
                if scope_key not in self.visited_names:
                    self.variables.append({
                        'name': name,
                        'line': node.lineno
                    })
                    self.visited_names.add(scope_key)
    
    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:

        for alias in node.names:
            if alias.name == '*':
                continue
            name = alias.asname if alias.asname else alias.name
            if not self._should_skip_name(name):
                scope_key = self._get_scope_key(name)
                if scope_key not in self.visited_names:
                    self.variables.append({
                        'name': name,
                        'line': node.lineno
                    })
                    self.visited_names.add(scope_key)


def generate_content_hash(code_content: str) -> str:
    """Generate a hash of the code content for change detection"""
    return hashlib.md5(code_content.encode('utf-8')).hexdigest()


def parse_python_structure(code_content: str, previous_hash: Optional[str] = None) -> Dict[str, Any]:
    """
    Parse Python code and extract structure information with change detection
    Returns a dictionary with variables, functions, classes, and content hash
    """
    if not code_content.strip():
        return {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': True,
            'content_hash': generate_content_hash(code_content),
            'changed': True
        }
    
    current_hash = generate_content_hash(code_content)
    if previous_hash and current_hash == previous_hash:
        return {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': True,
            'content_hash': current_hash,
            'changed': False
        }
    
    try:

        try:
            tree = ast.parse(code_content, mode='exec')
        except SyntaxError as e:
            return {
                'variables': [],
                'functions': [],
                'classes': [],
                'success': False,
                'error': f'Syntax Error at line {e.lineno}: {str(e)}',
                'content_hash': current_hash,
                'changed': True
            }
        

        parser = PythonStructureParser()
        parser.visit(tree)
        

        variables = sorted(parser.variables, key=lambda x: x['line'])
        functions = sorted(parser.functions, key=lambda x: x['line'])
        classes = sorted(parser.classes, key=lambda x: x['line'])
        

        for cls in classes:
            cls['methods'] = sorted(cls['methods'], key=lambda x: x['line'])
        
        return {
            'variables': variables[:100],
            'functions': functions[:100],
            'classes': classes[:50],
            'success': True,
            'content_hash': current_hash,
            'changed': True
        }
    
    except RecursionError:
        return {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': False,
            'error': 'Recursion limit exceeded - file too deeply nested',
            'content_hash': current_hash,
            'changed': True
        }
    except MemoryError:
        return {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': False,
            'error': 'Memory limit exceeded - file too large',
            'content_hash': current_hash,
            'changed': True
        }
    except Exception as e:
        return {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': False,
            'error': f'Parse Error: {str(e)}',
            'content_hash': current_hash,
            'changed': True
        }

if __name__ == "__main__":
    try:

        if len(sys.argv) > 1:
            code_content = sys.argv[1]
            previous_hash = sys.argv[2] if len(sys.argv) > 2 else None
        else:
            code_content = sys.stdin.read()
            previous_hash = None
        
        result = parse_python_structure(code_content, previous_hash)
        

        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
        
    except Exception as e:
        error_result = {
            'variables': [],
            'functions': [],
            'classes': [],
            'success': False,
            'error': f'Execution Error: {str(e)}',
            'content_hash': '',
            'changed': True
        }
        sys.stdout.write(json.dumps(error_result))
        sys.stdout.flush()
