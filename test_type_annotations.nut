// Test file for type annotation parsing
// These should all parse without "Statement expected" or "End of statement expected" errors

// Function return type annotations (Issue 1 - Fixed)
function getAge(): int 
{
    return 25;
}

function getName(): string 
{
    return "John";
}

function getEntity(): entity 
{
    return Entities.First();
}

function getNumbers(): array<int> 
{
    return [1, 2, 3];
}

// Variable type annotations with optional types (Issue 2 - Fixed)
local name: string = "test";
local optional: string? = "hello";
local maybeNull: entity? = null;
local optionalNumber: int? = 42;

// Generic types (Issue 3 - Fixed)
local numbers: array<int> = [1, 2, 3];
local names: array<string> = ["a", "b", "c"];
local entities: array<entity> = [];
local optionalArray: array<string>? = ["test"];

// Function parameters with types
function greet(name: string, age: int): string {
    return "Hello " + name + ", you are " + age;
}

function processOptional(value: string?): bool {
    if (value != null) {
        return true;
    }
    return false;
}

// Complex nested generics (Issue 1 - Fixed)
function processComplexNesting(data: array<array<string>>): int {
    return data.len();
}

// Mixed parameter types
function complexFunction(
    id: int,
    name: string?, 
    tags: array<string>,
    metadata: entity?
): bool {
    return true;
}

// Newslot operator (Issue 2 - Fixed)
age: int <- 25;
local score: int <- 100;
local playerName: string <- "John";
local optionalEntity: entity? <- null;

// Class member variables with type annotations (Issue 3 - Fixed)
class Animal {
    name: string = "Unknown";
    age: int = 0;
    isAlive: bool = true;
    
    constructor(name: string, age: int) {
        this.name = name;
        this.age = age;
    }
}

class Dog extends Animal {
    breed: string = "Mixed";
    owner: string? = null;
    
    constructor(name: string, age: int, breed: string) {
        base.constructor(name, age);
        this.breed = breed;
    }
}

// Mixed assignment operators in classes
class TestClass {
    normalAssign: string = "test";
    newslotAssign: int <- 42;
    optionalValue: string? = null;
    complexType: array<string> = ["a", "b"];
}
