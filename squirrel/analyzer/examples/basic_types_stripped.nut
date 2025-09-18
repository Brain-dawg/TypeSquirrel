// Example Squirrel file with type annotations

// Variable declarations with type annotations
local name = "Hello World";
local age = 25;
local height = 5.9;
local isActive = true;
local data = null;

// Array types
local numbers = [1, 2, 3, 4, 5];
local names = ["Alice", "Bob", "Charlie"];

// Function with type annotations
function greet(name, age) {
    return "Hello " + name + ", you are " + age + " years old";
}

// Function with optional parameters
function calculate(x, y = 10) {
    return x + y;
}

// Function with array parameter
function processNumbers(nums) {
    local sum = 0;
    foreach (num in nums) {
        sum += num;
    }
    return sum;
}

// Object type annotation
local person = {
    name = "John Doe",
    age = 30,
    email = "john@example.com"
};

// Union types
local value = "could be either";

// Class with type annotations
class Person {
    name = null;
    age = null;
    
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    
    function getName() {
        return this.name;
    }
    
    function setAge(newAge) {
        this.age = newAge;
    }
    
    function getInfo() {
        return {name = this.name, age = this.age};
    }
}

// Function type
local callback = function(msg, code) {
    print(msg + ": " + code);
    return code == 0;
};

// Optional type
local optionalName = null;

// Main function
function main() {
    local p = Person("Alice", 28);
    local greeting = greet(p.getName(), p.age);
    print(greeting);
    
    local result = processNumbers(numbers);
    print("Sum: " + result);
    
    if (callback("Status", 200)) {
        print("Success!");
    }
}
