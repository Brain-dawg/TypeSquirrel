# TypeSquirrel

A **static type analyzer for the Squirrel programming language**.  Provides type checking capabilities similar to MyPy and TypeScript.  Type annotations are stripped to produce vanilla Squirrel/VScript code.

## Type Checking Rules

The analyzer enforces the following type checking rules:

1. **Assignment Compatibility**: Values must be assignable to their declared types
2. **Function Calls**: Arguments must match parameter types
3. **Return Types**: Function returns must match declared return type
4. **Array Element Types**: Array elements must match the declared element type
5. **Table Member Types**: Table members must match their declared types
6. **Null Safety**: Optional types must be checked before use
7. **Class Inheritance**: Subclasses are assignable to base classes

## Error Categories

- **Type Mismatch**: Assignment of incompatible types
- **Undefined Variable**: Reference to undeclared variables
- **Wrong Argument Count**: Function calls with incorrect number of arguments
- **Invalid Member Access**: Access to non-existent table members
- **Null Pointer**: Use of potentially null values without checks

## Examples

See the `examples/` directory for sample Squirrel/VScript files with type annotations:

- `basic_types.nut`: Demonstrates various type annotation syntaxes
- `type_errors.nut`: Examples of common type errors for testing

## ~~Standalone Analyzer Usage~~

This doesn't actually do any type checking, currently unfinished

Requires python 3.10+.  `winget install python` in cmd/powershell if you don't have it.

```bash
git clone https://github.com/Brain-dawg/TypeSquirrel
cd squirrel-analyzer
pip install -r requirements.txt
python generate_parser.py
```

### Commands

```bash
# Type check a file ( UNFINISHED )
python squirrel_analyzer.py script.tnut

# Type check and strip annotations ( UNFINISHED )
python squirrel_analyzer.py -c -s script.tnut

# Strip type annotations only
python squirrel_analyzer.py -s -o script.nut script.tnut

# JSON output
python squirrel_analyzer.py -fmt json script.tnut
```

### Python API

```python
from squirrel_analyzer import SquirrelAnalyzer

analyzer = SquirrelAnalyzer()

# Analyze a file
result = analyzer.analyze_file("script.nut", check_types=True, strip_annotations=True)

# Analyze source code string
result = analyzer.analyze_string(source_code, check_types=True, strip_annotations=True)

# Access results
if result["success"]:
    for message in result["messages"]:
        print(f"{message.location}: {message.severity.value}: {message.message}")
    
    if result["stripped_code"]:
        print("Stripped code:", result["stripped_code"])
```

## Type Annotation Syntax

### Variable Declarations

```squirrel
local name: string = "John";
local age: int = 25;
local height: float = 5.9;
local isActive: bool = true;
local data: any = null;
```

### Array Types

```squirrel
local numbers: array<int> = [1, 2, 3];
local names: string[] = ["Alice", "Bob"];
```

### Function Types

```squirrel
// Function declaration
function greet(name: string, age: int): string {
    return "Hello " + name + ", age " + age;
}

// Function type variable
local callback: (string, int) -> bool = function(msg: string, code: int): bool {
    return code == 0;
};
```

### Table Types

```squirrel
local person: {name: string, age: int} = {
    name = "John",
    age = 30
};
```

### Union and Optional Types

```squirrel
local value: int | string = "could be either";
local optional: string? = null; // Equivalent to string | null
```

### Class Types

```squirrel
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
}
```