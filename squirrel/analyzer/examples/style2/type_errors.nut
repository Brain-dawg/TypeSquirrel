// C-style annotations

// Example file with intentional type errors for testing

// Type mismatch errors
local string name = 123;  // Error: cannot assign int to string
local int age = "twenty"; // Error: cannot assign string to int

// Function parameter type errors
function string greet(string name) {
    return "Hello " + name;
}

local string result = greet(42); // Error: cannot pass int where string expected

// Array type errors
local array<int> numbers = ["one", "two", "three"]; // Error: string elements in int array

// Return type errors
function int getAge() {
    return "unknown"; // Error: cannot return string where int expected
}

// Null assignment errors
local string required = null; // Warning: assigning null to non-optional type

// Optional type usage
local string? optional = "hello";
local int length = optional.len(); // Error: cannot call method on optional without null check

// Undefined variable
local int x = undefinedVar; // Error: undefined variable

// Wrong number of arguments
function int add(int a, int b) {
    return a + b;
}

local int sum = add(5); // Error: missing argument

// Class inheritance errors
class Animal {
    string name = "Rex";
    
    constructor(string name) {
        this.name = name;
    }
}

class Dog extends Animal {
    string breed = "German Shepherd";
    
    constructor(string name = "Rex", string breed = "German Shepherd") {
        base.constructor(name);
        this.breed = breed;
    }
}

local Animal pet = Dog("Rex", "German Shepherd"); // OK: subclass assignable to base class
local Dog specificDog = Animal("Generic"); // Error: cannot assign base class to subclass
