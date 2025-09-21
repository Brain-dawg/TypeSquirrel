import { checkSquirrelCode } from './squirrel/src/typeCheckerIntegration';

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
    console.log("=".repeat(50));
    
    // Analyze the code using the new integrated checker
    const result = checkSquirrelCode(squirrelCode, "demo.tnut");
    
    console.log("📋 Type Analysis Results:");
    console.log(`Found ${result.diagnostics.length} diagnostics`);
    
    if (result.diagnostics.length > 0) {
        const errors = result.diagnostics.filter(d => d.severity === 1);
        const warnings = result.diagnostics.filter(d => d.severity === 2);
        const infos = result.diagnostics.filter(d => d.severity === 3);
        
        if (errors.length > 0) {
            console.log("\n❌ Errors:");
            errors.forEach(error => {
                console.log(`  ${error.start}-${error.end}: ${error.message}`);
            });
        }
        
        if (warnings.length > 0) {
            console.log("\n⚠️  Warnings:");
            warnings.forEach(warning => {
                console.log(`  ${warning.start}-${warning.end}: ${warning.message}`);
            });
        }
        
        if (infos.length > 0) {
            console.log("\n💡 Info:");
            infos.forEach(info => {
                console.log(`  ${info.start}-${info.end}: ${info.message}`);
            });
        }
    } else {
        console.log("✅ No diagnostics found!");
    }
    
    if (result.sourceFile) {
        console.log("\n✅ Parse successful! AST generated.");
    } else {
        console.log("\n❌ Parse failed - no AST generated.");
    }
    
    console.log("");
    console.log("🎉 Demo completed!");
}

// Run the demo
runDemo().catch(console.error);

export { runDemo };
