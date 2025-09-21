import {
    Node, SourceFile, Statement, Expression, Declaration, NamedDeclaration,
    VariableDeclaration, FunctionDeclaration, LocalFunctionDeclaration,
    ClassDeclaration, ParameterDeclaration, TypeAnnotation,
    BinaryExpression, CallExpression, PropertyAccessExpression,
    ElementAccessExpression, Identifier, LiteralExpression,
    ArrayLiteralExpression, TableLiteralExpression, FunctionExpression,
    ClassExpression, LocalStatement, ConstStatement, ReturnStatement,
    IfStatement, WhileStatement, ForStatement, ForEachStatement,
    SwitchStatement, TryStatement, BlockStatement, ExpressionStatement,
    ClassMember, ClassMethod, ClassPropertyAssignment, ClassConstructor,
    TableLiteralMember, TableMethod, TablePropertyAssignment,
    SyntaxKind, forEachChild, VScriptDiagnostic, DiagnosticSeverity,
    Doc
} from "./types";

import {
    SquirrelType, PrimitiveType, NullType, AnyType, FunctionType,
    ArrayType, TableType, ClassType, UnionType, OptionalType,
    parseTypeFromAnnotation, SQUIRREL_TYPES,
    NULL_TYPE, INT_TYPE, FLOAT_TYPE, STRING_TYPE, BOOL_TYPE, ANY_TYPE
} from "./typeSystem";

const nativeSymbols = [

    globals.methods, globals.deprecatedMethods, globals.functions, globals.deprecatedFunctions,
    globals.events, globals.builtInConstants, globals.builtInVariables, globals.instancesMethods,
    globals.instancesVariables, globals.otherMethods, globals.otherVariables
];

import * as globals from "./globals";

export interface TypeCheckerOptions {
    strictNullChecks?: boolean;
    strictFunctionTypes?: boolean;
    allowImplicitAny?: boolean;
}

export interface SourceLocation {
    line: number;
    column: number;
    file?: string;
}

export interface TypeCheckerMessage {
    severity: "error" | "warning" | "info";
    message: string;
    location: SourceLocation;
    code?: string;
}

interface Symbol {
    name: string;
    type: SquirrelType;
    location: SourceLocation;
    isMutable: boolean;
    isInitialized: boolean;
    declaration: Declaration;
}

class SymbolTable {
    private symbols = new Map<string, Symbol>();
    private children: SymbolTable[] = [];

    constructor(private parent?: SymbolTable) {
        if (parent) {
            parent.children.push(this);
        }
    }

    define(symbol: Symbol): void {
        this.symbols.set(symbol.name, symbol);
    }

    lookup(name: string): Symbol | undefined {
        const symbol = this.symbols.get(name);
        if (symbol) {
            return symbol;
        }
        return this.parent?.lookup(name);
    }

    lookupLocal(name: string): Symbol | undefined {
        return this.symbols.get(name);
    }

    createChildScope(): SymbolTable {
        return new SymbolTable(this);
    }

    getParent(): SymbolTable | undefined {
        return this.parent;
    }
}

export class TypeChecker {
    
    private messages: TypeCheckerMessage[] = [];
    private symbolTable: SymbolTable;
    private currentScope: SymbolTable;
    private currentFile: string = "";
    private sourceText: string = "";
    private options: TypeCheckerOptions;
    private netPropMethods: Map<string, Doc> = new Map(globals.instancesMethods["NetProps"]);
    private netPropTypes: Map<string, Doc> = new Map(globals.netprops);

    constructor(options: TypeCheckerOptions = {}) {
        this.options = {
            strictNullChecks: true,
            strictFunctionTypes: true,
            allowImplicitAny: false,
            ...options
        };
        
        this.symbolTable = new SymbolTable();
        this.currentScope = this.symbolTable;
        this.initBuiltins();
    }

    private initBuiltins(): void {
        // Built-in functions
        const printFunc = new FunctionType([ANY_TYPE], NULL_TYPE);
        
        // Load native API symbols
        for (const symbolMap of nativeSymbols) {
            symbolMap.forEach((doc, name) => {
                const type = this.parseTypeFromDocDetail(doc.detail);
                if (type) {
                    this.defineSymbol(name, type, { line: 0, column: 0 }, false, true, {} as Declaration);
                }
            });
        }
        
        // this.defineSymbol("print", printFunc, { line: 0, column: 0 }, false, true, {} as Declaration);

        // Built-in types
        for (const [name, type] of Array.from(SQUIRREL_TYPES.entries())) {
            this.defineSymbol(name, type, { line: 0, column: 0 }, false, true, {} as Declaration);
        }
    }

    private parseTypeFromDocDetail(detail: string): SquirrelType | null {
        try {
            // Handle function signatures like "CBaseEntity.AcceptInput(input: string, param: string) -> bool"
            if (detail.includes('(') && detail.includes('->')) {
                return this.parseFunctionSignature(detail);
            }
            
            // Handle simple variable/constant declarations
            // Format might be like "variable: type" or just "type"
            const colonIndex = detail.lastIndexOf(':');
            if (colonIndex !== -1) {
                const typeString = detail.substring(colonIndex + 1).trim();
                return this.mapStringToSquirrelType(typeString);
            }
            
            // Fallback: try to parse the entire detail as a type
            return this.mapStringToSquirrelType(detail.trim());
        } catch (e) {
            // If parsing fails, return null to skip this symbol
            return null;
        }
    }

    private parseFunctionSignature(signature: string): FunctionType | null {
        try {
            // Extract function name and parameters
            // Format: "ClassName.FunctionName(param1: type1, param2: type2) -> returnType"
            const arrowIndex = signature.lastIndexOf('->');
            if (arrowIndex === -1) {
                return null;
            }

            const returnTypeString = signature.substring(arrowIndex + 2).trim();
            const beforeArrow = signature.substring(0, arrowIndex).trim();
            
            const parenStart = beforeArrow.indexOf('(');
            const parenEnd = beforeArrow.lastIndexOf(')');
            if (parenStart === -1 || parenEnd === -1) {
                return null;
            }

            const paramString = beforeArrow.substring(parenStart + 1, parenEnd);
            
            // Parse parameters
            const paramTypes: SquirrelType[] = [];
            if (paramString.trim()) {
                const params = paramString.split(',');
                for (const param of params) {
                    const colonIndex = param.lastIndexOf(':');
                    if (colonIndex !== -1) {
                        const typeString = param.substring(colonIndex + 1).trim();
                        const paramType = this.mapStringToSquirrelType(typeString);
                        if (paramType) {
                            paramTypes.push(paramType);
                        }
                    }
                }
            }

            // Parse return type
            const returnType = this.mapStringToSquirrelType(returnTypeString) || ANY_TYPE;
            
            return new FunctionType(paramTypes, returnType);
        } catch (e) {
            return null;
        }
    }

    private mapStringToSquirrelType(typeString: string): SquirrelType | null {
        const cleanType = typeString.trim();
        
        // Map common Squirrel types
        switch (cleanType) {
            case 'int':
            case 'integer':
                return INT_TYPE;
            case 'float':
                return FLOAT_TYPE;
            case 'string':
                return STRING_TYPE;
            case 'bool':
            case 'boolean':
                return BOOL_TYPE;
            case 'null':
            case 'void':
                return NULL_TYPE;
            case 'handle':
            case 'any':
                return ANY_TYPE;
            case 'array':
                return new ArrayType(ANY_TYPE);
            case 'table':
                return new TableType(ANY_TYPE, ANY_TYPE);
            default:
                // For unknown types, return ANY_TYPE as a fallback
                return ANY_TYPE;
        }
    }

    private defineSymbol(
        name: string,
        type: SquirrelType,
        location: SourceLocation,
        isMutable: boolean,
        isInitialized: boolean,
        declaration: Declaration
    ): void {
        const symbol: Symbol = {
            name,
            type,
            location,
            isMutable,
            isInitialized,
            declaration
        };
        this.currentScope.define(symbol);
    }

    private lookupSymbol(name: string): Symbol | undefined {
        return this.currentScope.lookup(name);
    }

    private enterScope(): SymbolTable {
        this.currentScope = this.currentScope.createChildScope();
        return this.currentScope;
    }

    private exitScope(): void {
        const parent = this.currentScope.getParent();
        if (parent) {
            this.currentScope = parent;
        }
    }

    private error(message: string, location: SourceLocation, code?: string): void {
        this.messages.push({
            severity: "error",
            message,
            location: { ...location, file: this.currentFile },
            code
        });
    }

    private warning(message: string, location: SourceLocation, code?: string): void {
        this.messages.push({
            severity: "warning",
            message,
            location: { ...location, file: this.currentFile },
            code
        });
    }

    private info(message: string, location: SourceLocation, code?: string): void {
        this.messages.push({
            severity: "info",
            message,
            location: { ...location, file: this.currentFile },
            code
        });
    }

    private getLocationFromNode(node: Node): SourceLocation {
        // Convert byte offset to line/column
        // This is a simplified version - you might want to implement proper line mapping
        const lines = this.sourceText.substring(0, node.start).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    private validateNetProp(funcName: string, args: Expression[], functionType: FunctionType): void {
       
        // check the netprop 2nd argument type
        if (funcName !== "GetTable" && funcName in this.netPropMethods) {

            const propParam = args[1]["value"] ?? "";
            let returnType = functionType.returnType;

            if (!(propParam in this.netPropTypes)) {

                this.warning(
                    `Unknown NetProp: ${propParam}`,
                    this.getLocationFromNode(args[1]),
                    "TS2304"
                );
            }
            else if ( this.netPropTypes[propParam] !== returnType.toString()) {

                if (returnType instanceof NullType) {
                    returnType = functionType.paramTypes[2] ?? ANY_TYPE;
                }

                this.error(
                    `NetProp/DataMap '${propParam}' is not assignable to parameter of type '${functionType.paramTypes[1].toString()} (Expected ${returnType.toString()})'`,
                    this.getLocationFromNode(args[1]),
                    "TS2345"
                );
            }
        }
    }

    checkFile(fileName: string, sourceText: string, sourceFile: SourceFile): TypeCheckerMessage[] {
        this.currentFile = fileName;
        this.sourceText = sourceText;
        this.messages = [];
        
        this.visitNode(sourceFile);
        
        return this.messages;
    }

    private visitNode(node: Node): SquirrelType {
        switch (node.kind) {
            case SyntaxKind.SourceFile:
                return this.visitSourceFile(node as SourceFile);
            case SyntaxKind.VariableDeclaration:
                return this.visitVariableDeclaration(node as VariableDeclaration);
            case SyntaxKind.FunctionDeclaration:
                return this.visitFunctionDeclaration(node as FunctionDeclaration);
            case SyntaxKind.LocalFunctionDeclaration:
                return this.visitLocalFunctionDeclaration(node as LocalFunctionDeclaration);
            case SyntaxKind.ClassDeclaration:
                return this.visitClassDeclaration(node as ClassDeclaration);
            case SyntaxKind.LocalStatement:
                return this.visitLocalStatement(node as LocalStatement);
            case SyntaxKind.ConstStatement:
                return this.visitConstStatement(node as ConstStatement);
            case SyntaxKind.BinaryExpression:
                return this.visitBinaryExpression(node as BinaryExpression);
            case SyntaxKind.CallExpression:
                return this.visitCallExpression(node as CallExpression);
            case SyntaxKind.PropertyAccessExpression:
                return this.visitPropertyAccessExpression(node as PropertyAccessExpression);
            case SyntaxKind.ElementAccessExpression:
                return this.visitElementAccessExpression(node as ElementAccessExpression);
            case SyntaxKind.Identifier:
                return this.visitIdentifier(node as Identifier);
            case SyntaxKind.IntegerLiteral:
                return INT_TYPE;
            case SyntaxKind.FloatLiteral:
                return FLOAT_TYPE;
            case SyntaxKind.StringLiteral:
            case SyntaxKind.VerbatimStringLiteral:
                return STRING_TYPE;
            case SyntaxKind.TrueLiteral:
            case SyntaxKind.FalseLiteral:
                return BOOL_TYPE;
            case SyntaxKind.NullLiteral:
                return NULL_TYPE;
            case SyntaxKind.ArrayLiteralExpression:
                return this.visitArrayLiteralExpression(node as ArrayLiteralExpression);
            case SyntaxKind.TableLiteralExpression:
                return this.visitTableLiteralExpression(node as TableLiteralExpression);
            case SyntaxKind.FunctionExpression:
                return this.visitFunctionExpression(node as FunctionExpression);
            case SyntaxKind.ClassExpression:
                return this.visitClassExpression(node as ClassExpression);
            case SyntaxKind.ReturnStatement:
                return this.visitReturnStatement(node as ReturnStatement);
            case SyntaxKind.IfStatement:
                return this.visitIfStatement(node as IfStatement);
            case SyntaxKind.WhileStatement:
                return this.visitWhileStatement(node as WhileStatement);
            case SyntaxKind.ForStatement:
                return this.visitForStatement(node as ForStatement);
            case SyntaxKind.ForEachStatement:
                return this.visitForEachStatement(node as ForEachStatement);
            case SyntaxKind.BlockStatement:
                return this.visitBlockStatement(node as BlockStatement);
            case SyntaxKind.ExpressionStatement:
                return this.visitExpressionStatement(node as ExpressionStatement);
            case SyntaxKind.ClassMethod:
                return this.visitClassMethod(node as ClassMethod);
            case SyntaxKind.ClassPropertyAssignment:
                return this.visitClassPropertyAssignment(node as ClassPropertyAssignment);
            case SyntaxKind.ClassConstructor:
                return this.visitClassConstructor(node as ClassConstructor);
            default:
                // Visit children for other node types
                forEachChild(node, child => this.visitNode(child));
                return ANY_TYPE;
        }
    }

    private visitSourceFile(node: SourceFile): SquirrelType {
        for (const statement of node.statements.elements) {
            this.visitNode(statement);
        }
        return ANY_TYPE;
    }

    private visitVariableDeclaration(node: VariableDeclaration): SquirrelType {
        const location = this.getLocationFromNode(node);
        let declaredType: SquirrelType = ANY_TYPE;
        
        // Get declared type from type annotation
        if (node.typeAnnotation) {
            declaredType = parseTypeFromAnnotation(node.typeAnnotation);
            // this.info(`Variable '${node.name.value}' declared with type: ${declaredType.toString()}`, location);
        }

        // Get actual type from initializer
        let actualType: SquirrelType = ANY_TYPE;
        if (node.initialiser) {
            actualType = this.visitNode(node.initialiser);
        }

        // Type compatibility check
        if (node.typeAnnotation && node.initialiser) {
            if (!actualType.isAssignableTo(declaredType)) {
                this.error(
                    `'${actualType.toString()}' is not assignable to type '${declaredType.toString()}'`,
                    location,
                    "TS2322"
                );
            }
        }

        // Define symbol
        const finalType = node.typeAnnotation ? declaredType : actualType;
        this.defineSymbol(
            node.name.value,
            finalType,
            location,
            true,
            !!node.initialiser,
            node
        );

        return finalType;
    }

    private visitFunctionDeclaration(node: FunctionDeclaration): SquirrelType {
        const location = this.getLocationFromNode(node);
        
        // Enter function scope
        this.enterScope();

        // Process parameters
        const paramTypes: SquirrelType[] = [];
        for (const param of node.parameters.elements) {
            if (param.kind === SyntaxKind.ParameterDeclaration) {
                const paramDecl = param as ParameterDeclaration;
                const paramType = paramDecl.typeAnnotation 
                    ? parseTypeFromAnnotation(paramDecl.typeAnnotation)
                    : ANY_TYPE;
                
                paramTypes.push(paramType);
                this.defineSymbol(
                    paramDecl.name.value,
                    paramType,
                    this.getLocationFromNode(paramDecl),
                    true,
                    true,
                    paramDecl
                );

                // if (paramDecl.typeAnnotation) {
                //     this.info(`Parameter '${paramDecl.name.value}': ${paramType.toString()}`, this.getLocationFromNode(paramDecl));
                // }
            }
        }

        // Get return type (TODO: Add returnType to FunctionDeclaration interface)
        // const returnType = this.visitNode(node.returnType);
        const returnType = ANY_TYPE;

        // Visit function body
        this.visitNode(node.statement);

        // Exit function scope
        this.exitScope();

        // Create function type
        const functionType = new FunctionType(paramTypes, returnType);
        
        // Define function symbol
        this.defineSymbol(
            this.getFunctionName(node),
            functionType,
            location,
            false,
            true,
            node
        );

        return functionType;
    }

    private visitLocalFunctionDeclaration(node: LocalFunctionDeclaration): SquirrelType {
        const location = this.getLocationFromNode(node);
        
        // Enter function scope
        this.enterScope();

        // Process parameters
        const paramTypes: SquirrelType[] = [];
        for (const param of node.parameters.elements) {
            if (param.kind === SyntaxKind.ParameterDeclaration) {
                const paramDecl = param as ParameterDeclaration;
                const paramType = paramDecl.typeAnnotation 
                    ? parseTypeFromAnnotation(paramDecl.typeAnnotation)
                    : ANY_TYPE;
                
                paramTypes.push(paramType);
                this.defineSymbol(
                    paramDecl.name.value,
                    paramType,
                    this.getLocationFromNode(paramDecl),
                    true,
                    true,
                    paramDecl
                );
            }
        }

        // Get return type (TODO: Add returnType to LocalFunctionDeclaration interface)
        const returnType = ANY_TYPE;

        // Visit function body
        this.visitNode(node.statement);

        // Exit function scope
        this.exitScope();

        // Create function type
        const functionType = new FunctionType(paramTypes, returnType);
        
        // Define function symbol
        this.defineSymbol(
            node.name.value,
            functionType,
            location,
            false,
            true,
            node
        );

        return functionType;
    }

    private visitClassDeclaration(node: ClassDeclaration): SquirrelType {
        const location = this.getLocationFromNode(node);
        const className = this.getClassName(node);
        
        // Create class type
        const classType = new ClassType(className);

        // Define class symbol first (so it's available for self-references)
        this.defineSymbol(
            className,
            classType,
            location,
            false,
            true,
            node
        );

        // Enter class scope
        this.enterScope();

        // Process members - these will define methods and properties in the class scope
        for (const member of node.members.elements) {
            this.visitNode(member);
        }

        // Exit class scope
        this.exitScope();

        return classType;
    }

    private visitLocalStatement(node: LocalStatement): SquirrelType {
        for (const declaration of node.declarations.elements) {
            this.visitNode(declaration);
        }
        return ANY_TYPE;
    }

    private visitConstStatement(node: ConstStatement): SquirrelType {
        const location = this.getLocationFromNode(node);
        const initializerType = this.visitNode(node.initialiser);
        
        this.defineSymbol(
            node.name.value,
            initializerType,
            location,
            false,
            true,
            node
        );

        return initializerType;
    }

    private visitBinaryExpression(node: BinaryExpression): SquirrelType {
        // Handle assignment operators specially
        if (node.operator === SyntaxKind.EqualsToken || node.operator === SyntaxKind.LessMinusToken) {
            // For newslot assignments (e.g., MyClass <- class), handle the left side as a declaration
            if (node.left.kind === SyntaxKind.Identifier && 
                (node.right.kind === SyntaxKind.ClassExpression || node.right.kind === SyntaxKind.FunctionExpression)) {
                
                const identifier = node.left as Identifier;
                const rightType = this.visitNode(node.right);
                
                // Define the symbol for the new assignment
                this.defineSymbol(
                    identifier.value,
                    rightType,
                    this.getLocationFromNode(identifier),
                    false, // not mutable (it's a class/function)
                    true,  // initialized
                    node as any // use the binary expression as declaration
                );
                
                return rightType;
            }
            
            // Regular assignment - visit both sides and check compatibility
            const leftType = this.visitNode(node.left);
            const rightType = this.visitNode(node.right);
            
            if (!rightType.isAssignableTo(leftType)) {
                this.error(
                    `'${rightType.toString()}' is not assignable to type '${leftType.toString()}'`,
                    this.getLocationFromNode(node),
                    "TS2322"
                );
            }
            return leftType;
        }

        // For non-assignment operators, visit both sides normally
        const leftType = this.visitNode(node.left);
        const rightType = this.visitNode(node.right);

        // Handle arithmetic operators
        if ([SyntaxKind.PlusToken, SyntaxKind.MinusToken, SyntaxKind.AsteriskToken, SyntaxKind.SlashToken].includes(node.operator)) {
            if (leftType instanceof PrimitiveType && rightType instanceof PrimitiveType) {
                if ((leftType.name === "int" || leftType.name === "float") && 
                    (rightType.name === "int" || rightType.name === "float")) {
                    return leftType.name === "float" || rightType.name === "float" ? FLOAT_TYPE : INT_TYPE;
                }
                if (leftType.name === "string" || rightType.name === "string") {
                    return STRING_TYPE;
                }
            }
        }

        // Handle comparison operators
        if ([SyntaxKind.EqualsEqualsToken, SyntaxKind.ExclamationEqualsToken, 
             SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken,
             SyntaxKind.LessThanEqualsToken, SyntaxKind.GreaterThanEqualsToken].includes(node.operator)) {
            return BOOL_TYPE;
        }

        return ANY_TYPE;
    }

    private visitCallExpression(node: CallExpression): SquirrelType {
        const functionType = this.visitNode(node.expression);

        const args = node.argumentExpressions.elements;
        
        if (functionType instanceof FunctionType) {
            // Check argument count
            const expectedParams = functionType.paramTypes.length;
            const actualArgs = args.length;
            
            if (actualArgs !== expectedParams) {
                this.error(
                    `Expected ${expectedParams} arguments, but got ${actualArgs}`,
                    this.getLocationFromNode(node),
                    "TS2554"
                );
            }
            const funcName = node.expression["value"] ?? "";

            // Check argument types
            for (let i = 0; i < Math.min(expectedParams, actualArgs); i++) {

                const argType = this.visitNode(args[i]);
                const paramType = functionType.paramTypes[i];
                if (!argType. isAssignableTo(paramType)) {
                    this.error(
                        `Argument '${argType.toString()}' is not assignable to parameter of type '${paramType.toString()}'`,
                        this.getLocationFromNode(args[i]),
                        "TS2345"
                    );
                }
            }

            this.validateNetProp(funcName, args, functionType);

            // // check the netprop 2nd argument type
            // if (funcName !== "GetTable" && funcName in this.netPropMethods) {

            //     const propParam = args[1].toString();
            //     let returnType = functionType.returnType;

            //     if (!(propParam in this.netPropTypes)) {

            //         this.warning(
            //             `Unknown NetProp: ${propParam}`,
            //             this.getLocationFromNode(args[1]),
            //             "TS2304"
            //         );
            //     }
            //     else if ( this.netPropTypes[propParam] !== returnType.toString()) {

            //         if (returnType instanceof NullType) {
            //             returnType = functionType.paramTypes[2] ?? ANY_TYPE;
            //         }

            //         this.error(
            //             `NetProp/DataMap '${propParam}' is not assignable to parameter of type '${functionType.paramTypes[1].toString()} (Expected ${returnType.toString()})'`,
            //             this.getLocationFromNode(args[1]),
            //             "TS2345"
            //         );
            //     }
            // }

            return functionType.returnType;
        }

        return ANY_TYPE;
    };

    private visitPropertyAccessExpression(node: PropertyAccessExpression): SquirrelType {
        const objectType = this.visitNode(node.expression);

        if (objectType instanceof ClassType) {
            const memberType = objectType.members.get(node.property.value);
            if (memberType) {
                return memberType;
            }
        }

        return ANY_TYPE;
    }

    private visitElementAccessExpression(node: ElementAccessExpression): SquirrelType {
        const objectType = this.visitNode(node.expression);
        const indexType = this.visitNode(node.argumentExpression);

        if (objectType instanceof ArrayType) {
            if (!indexType.isAssignableTo(INT_TYPE)) {
                this.error(
                    `Array index must be of type 'int', but got '${indexType.toString()}'`,
                    this.getLocationFromNode(node.argumentExpression),
                    "TS2538"
                );
            }
            return objectType.elementType;
        }

        if (objectType instanceof TableType) {
            if (!indexType.isAssignableTo(objectType.keyType)) {
                this.error(
                    `Table key must be of type '${objectType.keyType.toString()}', but got '${indexType.toString()}'`,
                    this.getLocationFromNode(node.argumentExpression),
                    "TS2538"
                );
            }
            return objectType.valueType;
        }

        return ANY_TYPE;
    }

    private visitIdentifier(node: Identifier): SquirrelType {
        // Don't check identifiers that are part of declarations
        // These should be handled by their respective declaration visitors
        const symbol = this.lookupSymbol(node.value);
        if (symbol) {
            return symbol.type;
        }

        // Only report "Cannot find name" for identifiers that are actually being referenced
        // Skip this error for identifiers in declaration contexts (they'll be handled by declaration visitors)
        this.error(
            `Cannot find name '${node.value}'`,
            this.getLocationFromNode(node),
            "TS2304"
        );
        return ANY_TYPE;
    }

    private visitArrayLiteralExpression(node: ArrayLiteralExpression): SquirrelType {
        if (node.elements.elements.length === 0) {
            return new ArrayType(ANY_TYPE);
        }

        // Infer element type from first element
        const elementType = this.visitNode(node.elements.elements[0]);
        
        // Check all elements are compatible
        for (let i = 1; i < node.elements.elements.length; i++) {
            const elemType = this.visitNode(node.elements.elements[i]);
            if (!elemType.isAssignableTo(elementType)) {
                this.warning(
                    `Array element '${elemType.toString()}' is not assignable to inferred type '${elementType.toString()}'`,
                    this.getLocationFromNode(node.elements.elements[i])
                );
            }
        }

        return new ArrayType(elementType);
    }

    private visitTableLiteralExpression(node: TableLiteralExpression): SquirrelType {
        if (node.members.elements.length === 0) {
            return new TableType(ANY_TYPE, ANY_TYPE);
        }

        // For now, return a generic table type
        // TODO: Implement proper table type inference
        return new TableType(STRING_TYPE, ANY_TYPE);
    }

    private visitFunctionExpression(node: FunctionExpression): SquirrelType {

        // Enter function scope
        this.enterScope();

        // Process parameters
        const paramTypes: SquirrelType[] = [];
        for (const param of node.parameters.elements) {
            if (param.kind === SyntaxKind.ParameterDeclaration) {
                const paramDecl = param as ParameterDeclaration;
                const paramType = paramDecl.typeAnnotation 
                    ? parseTypeFromAnnotation(paramDecl.typeAnnotation)
                    : ANY_TYPE;
                
                paramTypes.push(paramType);
                this.defineSymbol(
                    paramDecl.name.value,
                    paramType,
                    this.getLocationFromNode(paramDecl),
                    true,
                    true,
                    paramDecl
                );
            }
        }

        // Get return type (TODO: Add returnType to FunctionExpression interface)
        const returnType = ANY_TYPE;

        // Visit function body
        this.visitNode(node.statement);

        // Exit function scope
        this.exitScope();

        return new FunctionType(paramTypes, returnType);
    }

    private visitClassExpression(node: ClassExpression): SquirrelType {
        // Enter class scope
        this.enterScope();

        // Create anonymous class type
        const classType = new ClassType("<anonymous>");

        // Process members
        for (const member of node.members.elements) {
            this.visitNode(member);
        }

        // Exit class scope
        this.exitScope();

        return classType;
    }

    private visitReturnStatement(node: ReturnStatement): SquirrelType {
        
        const returnType = this.visitNode(node.expression);

        if (!returnType.isAssignableTo(ANY_TYPE)) {
            this.error(
                `Return type '${returnType.toString()}' is not assignable to type '${ANY_TYPE.toString()}'`,
                this.getLocationFromNode(node.expression),
                "TS2322"
            );
        }

        return NULL_TYPE;
    }

    private visitIfStatement(node: IfStatement): SquirrelType {
        const conditionType = this.visitNode(node.expression);
        
        if (!conditionType.isAssignableTo(BOOL_TYPE) && !conditionType.isAssignableTo(ANY_TYPE)) {
            this.warning(
                `Condition should be of type 'bool', but got '${conditionType.toString()}'`,
                this.getLocationFromNode(node.expression)
            );
        }

        this.visitNode(node.thenStatement);
        if (node.elseStatement) {
            this.visitNode(node.elseStatement);
        }

        return ANY_TYPE;
    }

    private visitWhileStatement(node: WhileStatement): SquirrelType {
        const conditionType = this.visitNode(node.expression);
        
        if (!conditionType.isAssignableTo(BOOL_TYPE) && !conditionType.isAssignableTo(ANY_TYPE)) {
            this.warning(
                `Condition should be of type 'bool', but got '${conditionType.toString()}'`,
                this.getLocationFromNode(node.expression)
            );
        }

        this.visitNode(node.statement);
        return ANY_TYPE;
    }

    private visitForStatement(node: ForStatement): SquirrelType {
        this.enterScope();

        if (node.initialiser) {
            this.visitNode(node.initialiser);
        }
        if (node.condition) {
            const conditionType = this.visitNode(node.condition);
            if (!conditionType.isAssignableTo(BOOL_TYPE) && !conditionType.isAssignableTo(ANY_TYPE)) {
                this.warning(
                    `Condition should be of type 'bool', but got '${conditionType.toString()}'`,
                    this.getLocationFromNode(node.condition)
                );
            }
        }
        if (node.incrementor) {
            this.visitNode(node.incrementor);
        }

        this.visitNode(node.statement);
        this.exitScope();
        return ANY_TYPE;
    }

    private visitForEachStatement(node: ForEachStatement): SquirrelType {
        this.enterScope();

        const iterableType = this.visitNode(node.iterable);
        
        // Define loop variables
        if (node.index) {
            this.defineSymbol(
                node.index.name.value,
                INT_TYPE,
                this.getLocationFromNode(node.index),
                true,
                true,
                node.index
            );
        }

        let valueType = ANY_TYPE;
        if (iterableType instanceof ArrayType) {
            valueType = iterableType.elementType;
        } else if (iterableType instanceof TableType) {
            valueType = iterableType.valueType;
        }

        this.defineSymbol(
            node.value.name.value,
            valueType,
            this.getLocationFromNode(node.value),
            true,
            true,
            node.value
        );

        this.visitNode(node.statement);
        this.exitScope();
        return ANY_TYPE;
    }

    private visitBlockStatement(node: BlockStatement): SquirrelType {
        this.enterScope();
        for (const statement of node.statements.elements) {
            this.visitNode(statement);
        }
        this.exitScope();
        return ANY_TYPE;
    }

    private visitExpressionStatement(node: ExpressionStatement): SquirrelType {
        // this.validateNetProp(node.expression["value"], node.expression["argumentExpressions"].elements, this.visitNode(node.expression) as FunctionType);
        return this.visitNode(node.expression);
    }

    private visitClassMethod(node: ClassMethod): SquirrelType {
        const location = this.getLocationFromNode(node);
        
        // Enter method scope
        this.enterScope();

        // Process parameters
        const paramTypes: SquirrelType[] = [];
        for (const param of node.parameters.elements) {
            if (param.kind === SyntaxKind.ParameterDeclaration) {
                const paramDecl = param as ParameterDeclaration;
                const paramType = paramDecl.typeAnnotation 
                    ? parseTypeFromAnnotation(paramDecl.typeAnnotation)
                    : ANY_TYPE;
                
                paramTypes.push(paramType);
                this.defineSymbol(
                    paramDecl.name.value,
                    paramType,
                    this.getLocationFromNode(paramDecl),
                    true,
                    true,
                    paramDecl
                );
            }
        }

        // Get return type (TODO: Add returnType to ClassMethod interface)
        const returnType = ANY_TYPE;

        // Visit method body
        if (node.statement) {
            this.visitNode(node.statement);
        }

        // Exit method scope
        this.exitScope();

        // Create method type
        const methodType = new FunctionType(paramTypes, returnType);
        
        // Define method symbol in class scope
        this.defineSymbol(
            this.getMethodName(node),
            methodType,
            location,
            false,
            true,
            node
        );

        return methodType;
    }

    private visitClassPropertyAssignment(node: ClassPropertyAssignment): SquirrelType {
        const location = this.getLocationFromNode(node);
        let declaredType: SquirrelType = ANY_TYPE;
        
        // Get declared type from type annotation (TODO: Add typeAnnotation to ClassPropertyAssignment interface)
        // if (node.typeAnnotation) {
        //     declaredType = parseTypeFromAnnotation(node.typeAnnotation);
        // }

        // Get actual type from initializer
        let actualType: SquirrelType = ANY_TYPE;
        if (node.initialiser) {
            actualType = this.visitNode(node.initialiser);
        }

        // Type compatibility check
        // if (node.typeAnnotation && node.initialiser) {
        //     if (!actualType.isAssignableTo(declaredType)) {
        //         this.error(
        //             `Type '${actualType.toString()}' is not assignable to type '${declaredType.toString()}'`,
        //             location,
        //             "TS2322"
        //         );
        //     }
        // }

        // Define property symbol in class scope
        const finalType = actualType;
        this.defineSymbol(
            this.getPropertyName(node),
            finalType,
            location,
            true,
            !!node.initialiser,
            node
        );

        return finalType;
    }

    private visitClassConstructor(node: ClassConstructor): SquirrelType {
        const location = this.getLocationFromNode(node);
        
        // Enter constructor scope
        this.enterScope();

        // Process parameters
        const paramTypes: SquirrelType[] = [];
        for (const param of node.parameters.elements) {
            if (param.kind === SyntaxKind.ParameterDeclaration) {
                const paramDecl = param as ParameterDeclaration;
                const paramType = paramDecl.typeAnnotation 
                    ? parseTypeFromAnnotation(paramDecl.typeAnnotation)
                    : ANY_TYPE;
                
                paramTypes.push(paramType);
                this.defineSymbol(
                    paramDecl.name.value,
                    paramType,
                    this.getLocationFromNode(paramDecl),
                    true,
                    true,
                    paramDecl
                );
            }
        }

        // Visit constructor body
        if (node.statement) {
            this.visitNode(node.statement);
        }

        // Exit constructor scope
        this.exitScope();

        // Constructor doesn't have a return type, it returns the class instance
        const constructorType = new FunctionType(paramTypes, ANY_TYPE);
        
        // Define constructor symbol in class scope
        this.defineSymbol(
            "constructor",
            constructorType,
            location,
            false,
            true,
            node
        );

        return constructorType;
    }

    // Helper methods
    private getFunctionName(node: FunctionDeclaration): string {
        if (node.name.kind === SyntaxKind.Identifier) {
            return (node.name as Identifier).value;
        }
        return "<computed>";
    }

    private getClassName(node: ClassDeclaration): string {
        if (node.name.kind === SyntaxKind.Identifier) {
            return (node.name as Identifier).value;
        }
        return "<computed>";
    }

    private getMethodName(node: ClassMethod): string {
        if (node.name.kind === SyntaxKind.Identifier) {
            return (node.name as Identifier).value;
        }
        return "<computed>";
    }

    private getPropertyName(node: ClassPropertyAssignment): string {
        if (node.name.kind === SyntaxKind.Identifier) {
            return (node.name as Identifier).value;
        }
        return "<computed>";
    }

    getMessages(): TypeCheckerMessage[] {
        return this.messages;
    }

    getDiagnostics(): VScriptDiagnostic[] {
        return this.messages.map(msg => ({
            start: 0, // You'll need to map this properly
            end: 0,   // You'll need to map this properly
            message: msg.message,
            severity: msg.severity === "error" ? DiagnosticSeverity.Error : DiagnosticSeverity.Warning
        }));
    }
}
