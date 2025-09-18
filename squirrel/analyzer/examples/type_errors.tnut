// TypeScript/MyPy-style annotations

// Example file with intentional type errors for testing

// Type mismatch errors
local name: string = 123;  // Error: cannot assign int to string
age: int <- "twenty"; // Error: cannot assign string to int

// Function parameter type errors
function greet(name: string): string {
    return "Hello " + name;
}

function GetWorldspawn(): entity {
    return Entities.First();
}

local result: string = greet(42); // Error: cannot pass int where string expected

// Array type errors
local numbers: array<int> = ["one", "two", "three"]; // Error: string elements in int array

// Return type errors
function getAge(): int {
    return "unknown"; // Error: cannot return string where int expected
}

// Null assignment errors
local required: string = null; // Warning: assigning null to non-optional type

// Optional type usage
local optional: string? = "hello";
local length: int = optional.len(); // Error: cannot call method on optional without null check

// Undefined variable
local x: int = undefinedVar; // Error: undefined variable

// Wrong number of arguments
function add(a: int, b: int): int {
    return a + b;
}

local sum: int = add(5); // Error: missing argument


// Class inheritance errors
class Animal {
    name: string = null;
    
    constructor(name: string) {
        this.name = name;
    }
}


class Dog extends Animal {
    breed: string = null;
    
    constructor(name: string, breed: string) {
        base.constructor(name);
        this.breed = breed;
    }
}

function MakeClass(): class {

    return class {
        function test() {
            return true;
        }
    }
}


local pet: Animal = Dog("Rex", "German Shepherd"); // OK: subclass assignable to base class
local specificDog: Dog = Animal("Generic"); // Error: cannot assign base class to subclass
