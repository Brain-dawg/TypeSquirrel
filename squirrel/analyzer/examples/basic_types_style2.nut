// Example Squirrel file with type annotations

// Variable declarations with type annotations
local string name   = "Hello World";
local int age       = 25;
local float height  = 5.9;
bool isActive <- true;
any data <- null;

// Array types
local int[] numbers  = [1, 2, 3, 4, 5];
local string[] names = ["Alice", "Bob", "Charlie"];

// Function with type annotations
function string greet(string name, int age) {
    return "Hello " + name + ", you are " + age + " years old";
}

// Function with optional parameters
function int calculate(int x, int y = 10) {
    return x + y;
}

// Function with array parameter
function int processNumbers(int[] nums) {
    local int sum = 0;
    foreach (num in nums) {
        sum += num;
    }
    return sum;
}

// Object type annotation
local table person = {
    int age      = 30
    string name  = "John Doe"
    string email = "john@example.com"
};

// Union types
local int|string value    = "could be either";
local bool|string? value2 = "could be either or null";

// Class with type annotations
class Person {
    string name;
    int age;
    
    constructor(string name, int age) {
        this.name = name;
        this.age = age;
    }
    
    function string getName() {
        return this.name;
    }
    
    function void setAge(int newAge) {
        this.age = newAge;
    }
    
    function table getInfo() {
        return {string name = this.name, int age = this.age};
    }
}

// Function type
local function bool callback(string msg, int code) {
    print(msg + ": " + code);
    return code == 0;
};

// Optional type
local string? optionalName = null;

// Main function
function void main() {
    local Person p = Person("Alice", 28);
    local string greeting = greet(p.getName(), p.age);
    print(greeting);
    
    local int result = processNumbers(numbers);
    print("Sum: " + result);
    
    if (callback("Status", 200)) {
        print("Success!");
    }
}
