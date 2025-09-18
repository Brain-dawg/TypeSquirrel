// Example file with intentional type errors for testing

// Type mismatch errors
local name = 123;  // Error assign int to string
local age = "twenty"; // Error assign string to int

// Function parameter type errors
function greet(name) {
    return "Hello " + name;
}

local result = greet(42); // Error pass int where string expected

// Array type errors
local numbers = ["one", "two", "three"]; // Error elements in int array

// Return type errors
function getAge() {
    return "unknown"; // Error return string where int expected
}

// Null assignment errors
local required = null; // Warning null to non-optional type

// Optional type usage
local optional = "hello";
local length = optional.len(); // Error call method on optional without null check

// Undefined variable
local x = undefinedVar; // Error variable

// Wrong number of arguments
function add(a, b) {
    return a + b;
}

local sum = add(5); // Error argument

// Class inheritance errors
class Animal {
    name = null;
    
    constructor(name) {
        this.name = name;
    }
}

class Dog extends Animal {
    breed = null;
    
    constructor(name, breed) {
        base.constructor(name);
        this.breed = breed;
    }
}

local pet = Dog("Rex", "German Shepherd"); // OK assignable to base class
local specificDog = Animal("Generic"); // Error assign base class to subclass
