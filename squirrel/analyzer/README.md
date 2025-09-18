# Squirrel Static Type Analyzer

A static type analyzer for the Squirrel programming language that provides type checking capabilities similar to MyPy and TypeScript. The analyzer supports type annotations and can strip them to produce vanilla Squirrel code while preserving the original formatting.

## Features

- **Static Type Checking**: Comprehensive type checking with detailed error reporting
- **Type Annotations**: Support for type annotations including:
  - Primitive types (`int`, `float`, `string`, `bool`, `null`)
  - Array types (`array<T>`, `T[]`)
  - Function types (`(param1: T1, param2: T2) -> ReturnType`)
  - Object types (`{field1: T1, field2: T2}`)
  - Union types (`T1 | T2`)
  - Optional types (`T?`)
  - Class types
- **Non-destructive Annotation Stripping**: Remove type annotations while preserving original file formatting
- **ANTLR-based Parser**: Robust parsing using ANTLR grammar
- **Multiple Output Formats**: Text and JSON output for integration with IDEs and tools

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd squirrel-analyzer
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Generate the ANTLR parser:
```bash
python generate_parser.py
```

This will automatically download ANTLR if needed and generate the parser classes.

## Usage

### Command Line Interface

```bash
# Type check a file
python squirrel_analyzer.py script.nut

# Strip type annotations
python squirrel_analyzer.py --strip script.nut

# Both type check and strip annotations
python squirrel_analyzer.py --check --strip script.nut

# Save stripped version to file
python squirrel_analyzer.py --strip --output clean.nut script.nut

# JSON output for tool integration
python squirrel_analyzer.py --format json script.nut
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

### Object Types

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

## Type Checking Rules

The analyzer enforces the following type checking rules:

1. **Assignment Compatibility**: Values must be assignable to their declared types
2. **Function Calls**: Arguments must match parameter types
3. **Return Types**: Function returns must match declared return type
4. **Array Element Types**: Array elements must match the declared element type
5. **Object Member Types**: Object members must match their declared types
6. **Null Safety**: Optional types must be checked before use
7. **Class Inheritance**: Subclasses are assignable to base classes

## Error Categories

- **Type Mismatch**: Assignment of incompatible types
- **Undefined Variable**: Reference to undeclared variables
- **Wrong Argument Count**: Function calls with incorrect number of arguments
- **Invalid Member Access**: Access to non-existent object members
- **Null Pointer**: Use of potentially null values without checks

## Examples

See the `examples/` directory for sample Squirrel files with type annotations:

- `basic_types.nut`: Demonstrates various type annotation syntaxes
- `type_errors.nut`: Examples of common type errors for testing

## Architecture

The analyzer consists of several key components:

1. **ANTLR Grammar** (`SquirrelParser.g4`): Defines the complete Squirrel language syntax with type annotation extensions
2. **Type System** (`squirrel_analyzer.py`): Implements the type hierarchy and type checking rules
3. **Symbol Table**: Manages variable scopes and symbol resolution
4. **Type Checker**: Performs static analysis and generates error messages
5. **Annotation Stripper**: Removes type annotations while preserving formatting

## Grammar Reference

The ANTLR grammar supports the complete Squirrel language syntax including:

- All Squirrel keywords and operators
- Expression precedence and associativity
- Statement types (if, while, for, foreach, switch, try-catch, etc.)
- Function and class declarations
- Extended syntax for type annotations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- ANTLR for the powerful parser generator
- The Squirrel language developers for the reference implementation
- MyPy and TypeScript for inspiration on type checking approaches
