import { Lexer } from './lexer';
import { Parser } from './parser';
import { TypeChecker, TypeCheckerMessage, TypeCheckerOptions } from './typeChecker';
import { SourceFile, VScriptDiagnostic, DiagnosticSeverity } from './types';

/**
 * High-level interface for type checking Squirrel code
 */
export class SquirrelTypeAnalyzer {
    private typeChecker: TypeChecker;

    constructor(options: TypeCheckerOptions = {}) {
        this.typeChecker = new TypeChecker(options);
    }

    /**
     * Analyze a Squirrel source file and return type checking results
     */
    analyzeFile(fileName: string, sourceText: string): AnalysisResult {
        try {
            // Parse the source code
            const lexer = new Lexer(sourceText);
            const parser = new Parser(lexer);
            const sourceFile = parser.parseSourceFile();

            // Check for parse errors
            const parseErrors = parser.getDiagnostics();
            if (parseErrors.length > 0) {
                return {
                    success: false,
                    parseErrors: parseErrors.map(err => ({
                        severity: "error" as const,
                        message: err.message,
                        location: {
                            line: this.getLineFromOffset(sourceText, err.start),
                            column: this.getColumnFromOffset(sourceText, err.start),
                            file: fileName
                        }
                    })),
                    typeMessages: [],
                    sourceFile: undefined
                };
            }

            // Run type checking
            const typeMessages = this.typeChecker.checkFile(fileName, sourceText, sourceFile);

            return {
                success: true,
                parseErrors: [],
                typeMessages,
                sourceFile
            };

        } catch (error) {
            return {
                success: false,
                parseErrors: [{
                    severity: "error" as const,
                    message: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                    location: { line: 1, column: 1, file: fileName }
                }],
                typeMessages: [],
                sourceFile: undefined
            };
        }
    }

    /**
     * Extract type information from source code without full type checking
     */
    extractTypes(fileName: string, sourceText: string): TypeExtractionResult {
        try {
            const result = this.analyzeFile(fileName, sourceText);
            
            if (!result.success || !result.sourceFile) {
                return {
                    success: false,
                    error: "Failed to parse source code",
                    variables: [],
                    functions: [],
                    classes: []
                };
            }

            // Extract type information from the AST
            const extractor = new TypeInformationExtractor();
            const typeInfo = extractor.extract(result.sourceFile);

            return {
                success: true,
                error: undefined,
                variables: typeInfo.variables,
                functions: typeInfo.functions,
                classes: typeInfo.classes
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                variables: [],
                functions: [],
                classes: []
            };
        }
    }

    private getLineFromOffset(text: string, offset: number): number {
        return text.substring(0, offset).split('\n').length;
    }

    private getColumnFromOffset(text: string, offset: number): number {
        const lines = text.substring(0, offset).split('\n');
        return lines[lines.length - 1].length + 1;
    }
}

export interface AnalysisResult {
    success: boolean;
    parseErrors: TypeCheckerMessage[];
    typeMessages: TypeCheckerMessage[];
    sourceFile?: SourceFile;
}

export interface TypeExtractionResult {
    success: boolean;
    error?: string;
    variables: VariableInfo[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
}

export interface VariableInfo {
    name: string;
    type?: string;
    location: [number, number];
    scope: string;
    isLocal: boolean;
    isParameter: boolean;
    isField: boolean;
}

export interface FunctionInfo {
    name: string;
    returnType?: string;
    location: [number, number];
    parameters: VariableInfo[];
}

export interface ClassInfo {
    name: string;
    location: [number, number];
    baseClass?: string;
    constructor?: FunctionInfo;
    methods: FunctionInfo[];
    fields: VariableInfo[];
}

/**
 * Extracts type information from the AST for compatibility with Python analyzer
 */
class TypeInformationExtractor {
    private variables: VariableInfo[] = [];
    private functions: FunctionInfo[] = [];
    private classes: ClassInfo[] = [];
    private currentScope = "global";

    extract(sourceFile: SourceFile): { variables: VariableInfo[], functions: FunctionInfo[], classes: ClassInfo[] } {
        this.variables = [];
        this.functions = [];
        this.classes = [];
        this.currentScope = "global";

        this.visitNode(sourceFile);

        return {
            variables: this.variables,
            functions: this.functions,
            classes: this.classes
        };
    }

    private visitNode(node: any): void {
        // This is a simplified visitor - you'd implement full AST traversal
        // For now, just demonstrate the structure
        
        switch (node.kind) {
            case "SourceFile":
                for (const statement of node.statements?.elements || []) {
                    this.visitNode(statement);
                }
                break;
                
            case "VariableDeclaration":
                this.variables.push({
                    name: node.name?.value || "<unknown>",
                    type: node.typeAnnotation ? this.getTypeString(node.typeAnnotation) : undefined,
                    location: [1, 1], // You'd calculate this from node.start
                    scope: this.currentScope,
                    isLocal: this.currentScope !== "global",
                    isParameter: false,
                    isField: false
                });
                break;
                
            case "FunctionDeclaration":
                const funcInfo: FunctionInfo = {
                    name: this.getFunctionName(node),
                    returnType: node.returnType ? this.getTypeString(node.returnType) : undefined,
                    location: [1, 1], // You'd calculate this from node.start
                    parameters: []
                };
                
                // Extract parameters
                for (const param of node.parameters?.elements || []) {
                    if (param.kind === "ParameterDeclaration") {
                        funcInfo.parameters.push({
                            name: param.name?.value || "<unknown>",
                            type: param.typeAnnotation ? this.getTypeString(param.typeAnnotation) : undefined,
                            location: [1, 1],
                            scope: funcInfo.name,
                            isLocal: false,
                            isParameter: true,
                            isField: false
                        });
                    }
                }
                
                this.functions.push(funcInfo);
                
                // Visit function body with new scope
                const oldScope = this.currentScope;
                this.currentScope = funcInfo.name;
                if (node.statement) {
                    this.visitNode(node.statement);
                }
                this.currentScope = oldScope;
                break;
                
            case "ClassDeclaration":
                const classInfo: ClassInfo = {
                    name: this.getClassName(node),
                    location: [1, 1],
                    baseClass: undefined, // You'd extract this from node.inherits
                    constructor: undefined,
                    methods: [],
                    fields: []
                };
                
                this.classes.push(classInfo);
                
                // Visit class members
                const oldClassScope = this.currentScope;
                this.currentScope = classInfo.name;
                for (const member of node.members?.elements || []) {
                    this.visitNode(member);
                }
                this.currentScope = oldClassScope;
                break;
                
            default:
                // Visit children for other node types
                if (node.statements?.elements) {
                    for (const child of node.statements.elements) {
                        this.visitNode(child);
                    }
                }
                break;
        }
    }

    private getTypeString(typeAnnotation: any): string {
        if (!typeAnnotation || !typeAnnotation.typeName) {
            return "any";
        }

        let typeStr = typeAnnotation.typeName.value || "any";

        // Handle generic arguments
        if (typeAnnotation.genericArguments?.elements) {
            const genericArgs = typeAnnotation.genericArguments.elements
                .map((arg: any) => this.getTypeString(arg))
                .join(", ");
            typeStr += `<${genericArgs}>`;
        }

        // Handle optional types
        if (typeAnnotation.isOptional) {
            typeStr += "?";
        }

        return typeStr;
    }

    private getFunctionName(node: any): string {
        if (node.name?.kind === "Identifier") {
            return node.name.value;
        }
        return "<computed>";
    }

    private getClassName(node: any): string {
        if (node.name?.kind === "Identifier") {
            return node.name.value;
        }
        return "<computed>";
    }
}

/**
 * Simple function for VSCode extension integration
 * Returns diagnostics in the format expected by the language server
 */
export function checkSquirrelCode(code: string, fileName: string = "untitled.nut"): { 
    sourceFile: SourceFile | undefined, 
    diagnostics: VScriptDiagnostic[] 
} {
    try {
        // Parse the source code
        const lexer = new Lexer(code);
        const parser = new Parser(lexer);
        const sourceFile = parser.parseSourceFile();

        // Get parse errors
        const parseErrors = parser.getDiagnostics();
        
        // Run type checking only if parsing succeeded
        let typeErrors: VScriptDiagnostic[] = [];
        if (parseErrors.length === 0) {
            const typeChecker = new TypeChecker({
                strictNullChecks: true,
                strictFunctionTypes: true,
                allowImplicitAny: false
            });
            
            const typeMessages = typeChecker.checkFile(fileName, code, sourceFile);
            
            // Convert TypeCheckerMessage to VScriptDiagnostic
            typeErrors = typeMessages.map(msg => convertToVScriptDiagnostic(msg, code));
        }

        return {
            sourceFile: parseErrors.length === 0 ? sourceFile : undefined,
            diagnostics: [...parseErrors, ...typeErrors]
        };

    } catch (error) {
        // Return a single diagnostic for the error
        return {
            sourceFile: undefined,
            diagnostics: [{
                start: 0,
                end: code.length,
                message: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                severity: DiagnosticSeverity.Error
            }]
        };
    }
}

/**
 * Convert TypeCheckerMessage to VScriptDiagnostic format
 */
function convertToVScriptDiagnostic(message: TypeCheckerMessage, sourceText: string): VScriptDiagnostic {
    // Convert line/column back to byte offset
    const lines = sourceText.split('\n');
    let start = 0;
    
    // Calculate start offset
    for (let i = 0; i < message.location.line - 1 && i < lines.length; i++) {
        start += lines[i].length + 1; // +1 for newline character
    }
    start += Math.max(0, message.location.column - 1);
    
    // Estimate end position (start + reasonable length)
    const end = Math.min(start + Math.max(10, message.message.length / 4), sourceText.length);
    
    return {
        start,
        end,
        message: message.message,
        severity: message.severity === "error" ? DiagnosticSeverity.Error : 
                 message.severity === "warning" ? DiagnosticSeverity.Warning :
                 DiagnosticSeverity.Information
    };
}

// Export for use in VS Code extension
export { SquirrelTypeAnalyzer as default };
