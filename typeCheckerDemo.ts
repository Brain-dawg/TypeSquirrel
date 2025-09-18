import { SquirrelTypeAnalyzer } from './squirrel/src/typeCheckerIntegration';

// Demo TypeScript code showing how to use the type checker
const analyzer = new SquirrelTypeAnalyzer({
    strictNullChecks: true,
    strictFunctionTypes: true,
    allowImplicitAny: false
});

// Example Squirrel code with type annotations
const squirrelCode = `
// Function with type annotations
function getAge(): int {
    return 25;
}

function greet(name: string, age: int): string {
    return "Hello " + name + ", you are " + age;
}

// Variables with type annotations
local playerName: string = "John";
local playerAge: int = getAge();
local isAlive: bool = true;

// Optional types
local maybeScore: int? = null;
local optionalName: string? = "Optional";

// Generic types
local numbers: array<int> = [1, 2, 3, 4, 5];
local names: array<string> = ["Alice", "Bob", "Charlie"];

// Complex nested generics
local matrix: array<array<int>> = [[1, 2], [3, 4]];

// Class with type annotations
class Player {
    name: string = "Unknown";
    health: int = 100;
    isAlive: bool = true;
    
    constructor(name: string, health: int) {
        this.name = name;
        this.health = health;
    }
    
    function takeDamage(damage: int): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }
    
    function getName(): string {
        return this.name;
    }
}

// Type errors (intentional for testing)
local wrongType: string = 123;  // Error: int not assignable to string
local result: string = greet(42, "wrong"); // Error: wrong parameter types

// Newslot operator with types
age: int <- 30;
score: float <- 99.5;
`;

async function runDemo() {
    console.log("🚀 Squirrel Type Checker Demo");
    console.log("=" .repeat(50));
    
    // Analyze the code
    const result = analyzer.analyzeFile("demo.nut", squirrelCode);
    
    if (!result.success) {
        console.log("❌ Parse Errors:");
        result.parseErrors.forEach(error => {
            console.log(`  ${error.location.line}:${error.location.column} - ${error.message}`);
        });
        return;
    }
    
    console.log("✅ Parse successful!");
    console.log("");
    
    // Show type checking messages
    if (result.typeMessages.length > 0) {
        console.log("📋 Type Analysis Results:");
        
        const errors = result.typeMessages.filter(msg => msg.severity === "error");
        const warnings = result.typeMessages.filter(msg => msg.severity === "warning");
        const infos = result.typeMessages.filter(msg => msg.severity === "info");
        
        if (errors.length > 0) {
            console.log("\n❌ Errors:");
            errors.forEach(error => {
                console.log(`  ${error.location.line}:${error.location.column} - ${error.message}`);
            });
        }
        
        if (warnings.length > 0) {
            console.log("\n⚠️  Warnings:");
            warnings.forEach(warning => {
                console.log(`  ${warning.location.line}:${warning.location.column} - ${warning.message}`);
            });
        }
        
        if (infos.length > 0) {
            console.log("\n💡 Info:");
            infos.forEach(info => {
                console.log(`  ${info.location.line}:${info.location.column} - ${info.message}`);
            });
        }
    } else {
        console.log("✅ No type issues found!");
    }
    
    console.log("");
    console.log("🔍 Extracting Type Information...");
    
    // Extract type information
    const typeInfo = analyzer.extractTypes("demo.nut", squirrelCode);
    
    if (typeInfo.success) {
        console.log(`📊 Found ${typeInfo.variables.length} variables, ${typeInfo.functions.length} functions, ${typeInfo.classes.length} classes`);
        
        if (typeInfo.variables.length > 0) {
            console.log("\n📋 Variables:");
            typeInfo.variables.forEach(variable => {
                const typeStr = variable.type ? `: ${variable.type}` : "";
                const scopeStr = variable.scope !== "global" ? ` (in ${variable.scope})` : "";
                console.log(`  ${variable.name}${typeStr}${scopeStr}`);
            });
        }
        
        if (typeInfo.functions.length > 0) {
            console.log("\n🔧 Functions:");
            typeInfo.functions.forEach(func => {
                const returnTypeStr = func.returnType ? `: ${func.returnType}` : "";
                const paramStr = func.parameters.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(", ");
                console.log(`  ${func.name}(${paramStr})${returnTypeStr}`);
            });
        }
        
        if (typeInfo.classes.length > 0) {
            console.log("\n🏗️  Classes:");
            typeInfo.classes.forEach(cls => {
                const extendsStr = cls.baseClass ? ` extends ${cls.baseClass}` : "";
                console.log(`  class ${cls.name}${extendsStr}`);
                
                if (cls.fields.length > 0) {
                    console.log("    Fields:");
                    cls.fields.forEach(field => {
                        const typeStr = field.type ? `: ${field.type}` : "";
                        console.log(`      ${field.name}${typeStr}`);
                    });
                }
                
                if (cls.methods.length > 0) {
                    console.log("    Methods:");
                    cls.methods.forEach(method => {
                        const returnTypeStr = method.returnType ? `: ${method.returnType}` : "";
                        const paramStr = method.parameters.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(", ");
                        console.log(`      ${method.name}(${paramStr})${returnTypeStr}`);
                    });
                }
            });
        }
    } else {
        console.log(`❌ Type extraction failed: ${typeInfo.error}`);
    }
    
    console.log("");
    console.log("🎉 Demo completed!");
}

// Run the demo
runDemo().catch(console.error);

export { runDemo };
