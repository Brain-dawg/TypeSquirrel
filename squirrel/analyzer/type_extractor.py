#!/usr/bin/env python3
"""
ANTLR-based Type Annotation Extractor for Squirrel

This module uses the ANTLR parser to properly extract type annotations
from Squirrel source code by walking the parse tree.
"""

from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass
from antlr4 import *
from SquirrelParserParser import SquirrelParserParser
from SquirrelParserListener import SquirrelParserListener
from squirrel_types import *


@dataclass
class VariableInfo:
    """Information about a variable declaration"""
    name: str
    type_annotation: Optional[str]
    location: tuple  # (line, column)
    scope: str  # 'global', 'function', 'class', etc.
    is_parameter: bool = False
    is_field: bool = False
    is_local: bool = False
    default_value: Optional[str] = None


@dataclass
class FunctionInfo:
    """Information about a function declaration"""
    name: str
    parameters: List[VariableInfo]
    return_type: Optional[str]
    location: tuple  # (line, column)
    scope: str


@dataclass
class ClassInfo:
    """Information about a class declaration"""
    name: str
    fields: List[VariableInfo]
    methods: List[FunctionInfo]
    constructor: Optional[FunctionInfo]
    base_class: Optional[str]
    location: tuple  # (line, column)


class TypeExtractionListener(SquirrelParserListener):
    """
    ANTLR Listener that walks the parse tree and extracts type information
    """
    
    def __init__(self):
        self.variables: List[VariableInfo] = []
        self.functions: List[FunctionInfo] = []
        self.classes: List[ClassInfo] = []
        self.current_scope = ["global"]
        self.current_class: Optional[ClassInfo] = None
        self.current_function: Optional[FunctionInfo] = None
        
    def get_current_scope(self) -> str:
        return ".".join(self.current_scope)
    
    def get_location(self, ctx) -> tuple:
        """Get line and column from parse context"""
        if hasattr(ctx, 'start'):
            return (ctx.start.line, ctx.start.column)
        return (0, 0)
    
    def extract_type_annotation(self, type_annotation_ctx) -> Optional[str]:
        """Extract type annotation string from typeAnnotation context"""
        if not type_annotation_ctx:
            return None
        
        # typeAnnotation rule is: COLON type
        # So we need to get the type part
        if hasattr(type_annotation_ctx, 'type') and type_annotation_ctx.type():
            return type_annotation_ctx.type().getText()
        elif hasattr(type_annotation_ctx, 'getText'):
            # Fallback - get full text and remove the colon
            text = type_annotation_ctx.getText()
            if text.startswith(':'):
                return text[1:].strip()
            return text
        return str(type_annotation_ctx)
    
    # Local variable declarations
    def enterLocalDeclStatement(self, ctx: SquirrelParserParser.LocalDeclStatementContext):
        """Handle local variable declarations: local name: type = value"""
        for local_decl in ctx.localDecl():
            var_name = local_decl.identifier().getText()
            type_annotation = None
            
            if local_decl.typeAnnotation():
                type_annotation = self.extract_type_annotation(local_decl.typeAnnotation())
            
            default_value = None
            if local_decl.expression():
                default_value = local_decl.expression().getText()
            
            var_info = VariableInfo(
                name=var_name,
                type_annotation=type_annotation,
                location=self.get_location(local_decl),
                scope=self.get_current_scope(),
                is_local=True,
                default_value=default_value
            )
            
            self.variables.append(var_info)
    
    # Function declarations
    def enterFunctionStatement(self, ctx: SquirrelParserParser.FunctionStatementContext):
        """Handle function declarations: function name(params): returnType { ... }"""
        func_name = ctx.identifier().getText()
        
        # Extract parameters
        parameters = []
        if ctx.parameterList():
            for param_ctx in ctx.parameterList().parameter():
                if param_ctx.VARPARAMS():
                    # Handle varargs ...
                    param_info = VariableInfo(
                        name="...",
                        type_annotation="varargs",
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.{func_name}",
                        is_parameter=True
                    )
                else:
                    param_name = param_ctx.identifier().getText()
                    param_type = None
                    if param_ctx.typeAnnotation():
                        param_type = self.extract_type_annotation(param_ctx.typeAnnotation())
                    
                    default_value = None
                    if param_ctx.expression():
                        default_value = param_ctx.expression().getText()
                    
                    param_info = VariableInfo(
                        name=param_name,
                        type_annotation=param_type,
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.{func_name}",
                        is_parameter=True,
                        default_value=default_value
                    )
                
                parameters.append(param_info)
        
        # Extract return type
        return_type = None
        if ctx.typeAnnotation():
            return_type = self.extract_type_annotation(ctx.typeAnnotation())
        
        func_info = FunctionInfo(
            name=func_name,
            parameters=parameters,
            return_type=return_type,
            location=self.get_location(ctx),
            scope=self.get_current_scope()
        )
        
        self.functions.append(func_info)
        self.current_function = func_info
        self.current_scope.append(func_name)
    
    def exitFunctionStatement(self, ctx: SquirrelParserParser.FunctionStatementContext):
        """Exit function scope"""
        self.current_scope.pop()
        self.current_function = None
    
    # Class declarations
    def enterClassStatement(self, ctx: SquirrelParserParser.ClassStatementContext):
        """Handle class declarations: class Name extends Base { ... }"""
        class_name = ctx.identifier().getText()
        
        base_class = None
        if ctx.expression():  # extends clause
            base_class = ctx.expression().getText()
        
        class_info = ClassInfo(
            name=class_name,
            fields=[],
            methods=[],
            constructor=None,
            base_class=base_class,
            location=self.get_location(ctx)
        )
        
        self.classes.append(class_info)
        self.current_class = class_info
        self.current_scope.append(class_name)
    
    def exitClassStatement(self, ctx: SquirrelParserParser.ClassStatementContext):
        """Exit class scope"""
        self.current_scope.pop()
        self.current_class = None
    
    # Class field declarations
    def enterFieldDecl(self, ctx: SquirrelParserParser.FieldDeclContext):
        """Handle class field declarations: field: type = value;"""
        if not self.current_class:
            return
        
        field_name = ctx.identifier().getText()
        type_annotation = None
        
        if ctx.typeAnnotation():
            type_annotation = self.extract_type_annotation(ctx.typeAnnotation())
        
        default_value = None
        if ctx.expression():
            default_value = ctx.expression().getText()
        
        field_info = VariableInfo(
            name=field_name,
            type_annotation=type_annotation,
            location=self.get_location(ctx),
            scope=self.get_current_scope(),
            is_field=True,
            default_value=default_value
        )
        
        self.current_class.fields.append(field_info)
        self.variables.append(field_info)
    
    # Constructor declarations
    def enterConstructorDecl(self, ctx: SquirrelParserParser.ConstructorDeclContext):
        """Handle constructor declarations: constructor(params) { ... }"""
        if not self.current_class:
            return
        
        # Extract parameters
        parameters = []
        if ctx.parameterList():
            for param_ctx in ctx.parameterList().parameter():
                if param_ctx.VARPARAMS():
                    param_info = VariableInfo(
                        name="...",
                        type_annotation="varargs",
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.constructor",
                        is_parameter=True
                    )
                else:
                    param_name = param_ctx.identifier().getText()
                    param_type = None
                    if param_ctx.typeAnnotation():
                        param_type = self.extract_type_annotation(param_ctx.typeAnnotation())
                    
                    default_value = None
                    if param_ctx.expression():
                        default_value = param_ctx.expression().getText()
                    
                    param_info = VariableInfo(
                        name=param_name,
                        type_annotation=param_type,
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.constructor",
                        is_parameter=True,
                        default_value=default_value
                    )
                
                parameters.append(param_info)
        
        constructor_info = FunctionInfo(
            name="constructor",
            parameters=parameters,
            return_type=None,  # Constructors don't have return types
            location=self.get_location(ctx),
            scope=self.get_current_scope()
        )
        
        self.current_class.constructor = constructor_info
        self.current_scope.append("constructor")
    
    def exitConstructorDecl(self, ctx: SquirrelParserParser.ConstructorDeclContext):
        """Exit constructor scope"""
        if self.current_scope[-1] == "constructor":
            self.current_scope.pop()
    
    # Method declarations (inside classes)
    def enterMethodDecl(self, ctx: SquirrelParserParser.MethodDeclContext):
        """Handle method declarations inside classes"""
        if not self.current_class:
            return
        
        method_name = ctx.identifier().getText()
        
        # Extract parameters
        parameters = []
        if ctx.parameterList():
            for param_ctx in ctx.parameterList().parameter():
                if param_ctx.VARPARAMS():
                    param_info = VariableInfo(
                        name="...",
                        type_annotation="varargs",
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.{method_name}",
                        is_parameter=True
                    )
                else:
                    param_name = param_ctx.identifier().getText()
                    param_type = None
                    if param_ctx.typeAnnotation():
                        param_type = self.extract_type_annotation(param_ctx.typeAnnotation())
                    
                    default_value = None
                    if param_ctx.expression():
                        default_value = param_ctx.expression().getText()
                    
                    param_info = VariableInfo(
                        name=param_name,
                        type_annotation=param_type,
                        location=self.get_location(param_ctx),
                        scope=f"{self.get_current_scope()}.{method_name}",
                        is_parameter=True,
                        default_value=default_value
                    )
                
                parameters.append(param_info)
        
        # Extract return type
        return_type = None
        if ctx.typeAnnotation():
            return_type = self.extract_type_annotation(ctx.typeAnnotation())
        
        method_info = FunctionInfo(
            name=method_name,
            parameters=parameters,
            return_type=return_type,
            location=self.get_location(ctx),
            scope=self.get_current_scope()
        )
        
        self.current_class.methods.append(method_info)
        self.current_scope.append(method_name)
    
    def exitMethodDecl(self, ctx: SquirrelParserParser.MethodDeclContext):
        """Exit method scope"""
        if len(self.current_scope) > 1:
            self.current_scope.pop()


class SquirrelTypeExtractor:
    """
    Main class for extracting type information from Squirrel source code
    using ANTLR parser
    """
    
    def __init__(self):
        self.listener = TypeExtractionListener()
    
    def extract_from_string(self, source_code: str) -> Dict[str, Any]:
        """
        Extract type information from source code string
        
        Returns:
            Dict containing variables, functions, and classes with their type info
        """
        try:
            # Create ANTLR input stream
            input_stream = InputStream(source_code)
            
            # Create lexer
            from SquirrelParserLexer import SquirrelParserLexer
            lexer = SquirrelParserLexer(input_stream)
            
            # Create token stream
            token_stream = CommonTokenStream(lexer)
            
            # Create parser
            from SquirrelParserParser import SquirrelParserParser
            parser = SquirrelParserParser(token_stream)
            
            # Parse the program
            tree = parser.program()
            
            # Walk the tree with our listener
            walker = ParseTreeWalker()
            walker.walk(self.listener, tree)
            
            return {
                "success": True,
                "variables": self.listener.variables,
                "functions": self.listener.functions,
                "classes": self.listener.classes,
                "error": None
            }
            
        except Exception as e:
            return {
                "success": False,
                "variables": [],
                "functions": [],
                "classes": [],
                "error": str(e)
            }
    
    def extract_from_file(self, filename: str) -> Dict[str, Any]:
        """
        Extract type information from a file
        """
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                source_code = f.read()
            return self.extract_from_string(source_code)
        except Exception as e:
            return {
                "success": False,
                "variables": [],
                "functions": [],
                "classes": [],
                "error": f"Error reading file: {str(e)}"
            }
    
    def print_extracted_info(self, result: Dict[str, Any]):
        """Print extracted type information in a readable format"""
        if not result["success"]:
            print(f"Error: {result['error']}")
            return
        
        print("=== EXTRACTED TYPE INFORMATION ===")
        
        # Variables
        if result["variables"]:
            print(f"\n📝 VARIABLES ({len(result['variables'])})")
            print("-" * 40)
            for var in result["variables"]:
                type_str = var.type_annotation or "any"
                scope_str = f"[{var.scope}]"
                flags = []
                if var.is_local:
                    flags.append("local")
                if var.is_parameter:
                    flags.append("param")
                if var.is_field:
                    flags.append("field")
                
                flag_str = f"({', '.join(flags)})" if flags else ""
                default_str = f" = {var.default_value}" if var.default_value else ""
                
                print(f"  {var.name}: {type_str} {flag_str} {scope_str}{default_str}")
                print(f"    Location: line {var.location[0]}, col {var.location[1]}")
        
        # Functions
        if result["functions"]:
            print(f"\n🔧 FUNCTIONS ({len(result['functions'])})")
            print("-" * 40)
            for func in result["functions"]:
                param_strs = []
                for param in func.parameters:
                    param_type = param.type_annotation or "any"
                    param_str = f"{param.name}: {param_type}"
                    if param.default_value:
                        param_str += f" = {param.default_value}"
                    param_strs.append(param_str)
                
                params_str = f"({', '.join(param_strs)})"
                return_type = func.return_type or "void"
                
                print(f"  {func.name}{params_str}: {return_type}")
                print(f"    Scope: {func.scope}")
                print(f"    Location: line {func.location[0]}, col {func.location[1]}")
        
        # Classes
        if result["classes"]:
            print(f"\n🏛️  CLASSES ({len(result['classes'])})")
            print("-" * 40)
            for cls in result["classes"]:
                base_str = f" extends {cls.base_class}" if cls.base_class else ""
                print(f"  class {cls.name}{base_str}")
                print(f"    Location: line {cls.location[0]}, col {cls.location[1]}")
                
                if cls.fields:
                    print(f"    Fields ({len(cls.fields)}):")
                    for field in cls.fields:
                        field_type = field.type_annotation or "any"
                        default_str = f" = {field.default_value}" if field.default_value else ""
                        print(f"      {field.name}: {field_type}{default_str}")
                
                if cls.constructor:
                    param_strs = []
                    for param in cls.constructor.parameters:
                        param_type = param.type_annotation or "any"
                        param_str = f"{param.name}: {param_type}"
                        if param.default_value:
                            param_str += f" = {param.default_value}"
                        param_strs.append(param_str)
                    params_str = f"({', '.join(param_strs)})"
                    print(f"    Constructor{params_str}")
                
                if cls.methods:
                    print(f"    Methods ({len(cls.methods)}):")
                    for method in cls.methods:
                        param_strs = []
                        for param in method.parameters:
                            param_type = param.type_annotation or "any"
                            param_str = f"{param.name}: {param_type}"
                            if param.default_value:
                                param_str += f" = {param.default_value}"
                            param_strs.append(param_str)
                        params_str = f"({', '.join(param_strs)})"
                        return_type = method.return_type or "void"
                        print(f"      {method.name}{params_str}: {return_type}")


def main():
    """Test the type extractor"""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python type_extractor.py <squirrel_file>")
        sys.exit(1)
    
    filename = sys.argv[1]
    extractor = SquirrelTypeExtractor()
    result = extractor.extract_from_file(filename)
    extractor.print_extracted_info(result)


if __name__ == "__main__":
    main()
