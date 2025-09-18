#!/usr/bin/env python3
"""
Demonstration script for the Squirrel Static Type Analyzer
"""

from squirrel_analyzer import SquirrelAnalyzer

def demo_basic_usage():
    """Demonstrate basic analyzer usage"""
    print("Squirrel Static Type Analyzer - Demo")
    print("=" * 40)

    # Sample Squirrel code with type annotations
    sample_code = '''
// Sample Squirrel code with type annotations
local string name = "Alice";
local int age = 25;
local array<int> scores = [95, 87, 92];

function string greet(string name, int age) {
    return "Hello " + name + ", you are " + age + " years old";
}

function float average(array<int> numbers) {
    local int sum = 0;
    foreach (num in numbers) {
        sum += num;
    }
    return sum.tofloat() / numbers.len();
}

class Student {
    string name;
    array<int> grades;

    constructor(string name) {
        this.name = name;
        this.grades = [];
    }

    function null addGrade(int grade) {
        this.grades.append(grade);
    }

    function float getAverage() {
        return average(this.grades);
    }
}

// Usage
local Student student = Student("Bob");
student.addGrade(90);
student.addGrade(85);
local float avgGrade = student.getAverage();
'''

    analyzer = SquirrelAnalyzer()

    print("1. Original Code with Type Annotations:")
    print("-" * 40)
    print(sample_code)

    print("\n2. Analysis Results:")
    print("-" * 40)
    result = analyzer.analyze_string(sample_code, check_types=True, strip_annotations=True)

    if result["success"]:
        print("✓ Analysis completed successfully")
        print(f"✓ Found {len(result['messages'])} messages")

        for msg in result['messages']:
            print(f"  {msg}")

        print("\n3. Code with Type Annotations Stripped:")
        print("-" * 40)
        if result["stripped_code"]:
            print(result["stripped_code"])

        print("\n4. Summary:")
        print("-" * 40)
        print(f"Original code length: {len(result['original_code'])} characters")
        print(f"Stripped code length: {len(result['stripped_code'])} characters")
        print(f"Reduction: {len(result['original_code']) - len(result['stripped_code'])} characters")

        # Count type annotations
        type_annotations = result['original_code'].count(':')
        print(f"Estimated type annotations removed: ~{type_annotations}")

    else:
        print(f"✗ Analysis failed: {result['error']}")

def demo_error_detection():
    """Demonstrate error detection"""
    print("\n\n" + "=" * 40)
    print("Error Detection Demo")
    print("=" * 40)

    # Code with intentional errors
    error_code = '''
local string name = 123;        // Type mismatch
local int age = "twenty";       // Type mismatch
local array<int> numbers = ["a", "b"];  // Wrong element type

function string test(int x) {
    return x;  // Wrong return type
}
'''

    analyzer = SquirrelAnalyzer()
    result = analyzer.analyze_string(error_code, check_types=True)

    print("Code with errors:")
    print("-" * 20)
    print(error_code)

    print("Detection results:")
    print("-" * 20)
    if result["success"]:
        errors = [msg for msg in result["messages"] if msg.severity.value == "error"]
        warnings = [msg for msg in result["messages"] if msg.severity.value == "warning"]
        infos = [msg for msg in result["messages"] if msg.severity.value == "info"]

        print(f"Errors: {len(errors)}, Warnings: {len(warnings)}, Info: {len(infos)}")

        for msg in result["messages"]:
            print(f"  {msg}")
    else:
        print(f"Analysis failed: {result['error']}")

if __name__ == "__main__":
    demo_basic_usage()
    demo_error_detection()

    print("\n\n" + "=" * 40)
    print("Demo Complete!")
    print("=" * 40)
    print("\nTry running the analyzer yourself:")
    print("  python squirrel_analyzer.py examples/basic_types.nut")
    print("  python squirrel_analyzer.py --strip examples/basic_types.nut")
    print("  python squirrel_analyzer.py --help")
