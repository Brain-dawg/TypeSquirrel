// Example Squirrel file with type annotations

// Variable declarations with type annotations
local name: string = "Hello World";
local age: int = 25;
local height: float = 5.9;
local isActive: bool = true;
local data: any = null;

// Array types
local numbers: array<int> = [1, 2, 3, 4, 5];
local names: string[] = ["Alice", "Bob", "Charlie"];

// Function with type annotations
function greet(name: string, age: int): string {
    return "Hello " + name + ", you are " + age + " years old";
}

// Function with optional parameters
function calculate(x: int, y: int = 10): int {
    return x + y;
}

// Function with array parameter
function processNumbers(nums: int[]): int {
    local sum: int = 0;
    foreach (num in nums) {
        sum += num;
    }
    return sum;
}

// Object type annotation
local person: table = {
    name: string = "John Doe",
    age: int = 30,
    email: string = "john@example.com"
};

// Union types
local value: int | string = "could be either";

// Class with type annotations
class Person {
    name: string;
    age: int;
    
    constructor(name: string, age: int) {
        this.name = name;
        this.age = age;
    }
    
    function getName(): string {
        return this.name;
    }
    
    function setAge(newAge: int): void {
        this.age = newAge;
    }
    
    function getInfo(): {name: string, age: int} {
        return {name = this.name, age = this.age};
    }
}

// Function type
local callback: (string, int) -> bool = function(msg: string, code: int): bool {
    print(msg + ": " + code);
    return code == 0;
};

// Optional type
local optionalName: string? = null;

// Main function
function main(): void {
    local p: Person = Person("Alice", 28);
    local greeting: string = greet(p.getName(), p.age);
    print(greeting);
    
    local result: int = processNumbers(numbers);
    print("Sum: " + result);
    
    if (callback("Status", 200)) {
        print("Success!");
    }
}
