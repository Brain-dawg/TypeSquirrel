#!/usr/bin/env python3
"""
Test script for the ANTLR-based type extraction
"""

from type_extractor import SquirrelTypeExtractor

def test_type_extraction():
    """Test the type extractor with sample Squirrel code"""
    
    sample_code = '''
    // Variables with type annotations
    local name: string = "Alice";
    local age: int = 25;
    local scores: array<int> = [95, 87, 92];
    local optional: string? = null;
    
    // Function with typed parameters and return type
    function greet(name: string, age: int): string {
        return "Hello " + name + ", you are " + age + " years old";
    }
    
    // Function with optional parameter
    function calculate(x: int, y: int = 10): float {
        return x + y;
    }
    
    // Class with typed fields and methods
    class Person {
        name: string;
        age: int;
        grades: array<int>;
        
        constructor(name: string, age: int) {
            this.name = name;
            this.age = age;
            this.grades = [];
        }
        
        function getName(): string {
            return this.name;
        }
        
        function addGrade(grade: int): void {
            this.grades.append(grade);
        }
        
        function getAverage(): float {
            local sum: int = 0;
            foreach (grade in this.grades) {
                sum += grade;
            }
            return sum.tofloat() / this.grades.len();
        }
    }
    
    // Class inheritance
    class Student extends Person {
        studentId: string;
        
        constructor(name: string, age: int, id: string) {
            base.constructor(name, age);
            this.studentId = id;
        }
        
        function getId(): string {
            return this.studentId;
        }
    }
    '''
    
    print("Testing ANTLR-based Type Extraction")
    print("=" * 50)
    
    extractor = SquirrelTypeExtractor()
    result = extractor.extract_from_string(sample_code)
    
    if result["success"]:
        print("✅ Parse successful!")
        extractor.print_extracted_info(result)
    else:
        print(f"❌ Parse failed: {result['error']}")

def test_with_file():
    """Test with an actual file"""
    import os
    
    test_files = [
        "examples/basic_types_style1.nut",
        "examples/type_errors_style1.nut"
    ]
    
    extractor = SquirrelTypeExtractor()
    
    for filename in test_files:
        if os.path.exists(filename):
            print(f"\n{'='*60}")
            print(f"Testing file: {filename}")
            print('='*60)
            
            result = extractor.extract_from_file(filename)
            if result["success"]:
                print("✅ Parse successful!")
                extractor.print_extracted_info(result)
            else:
                print(f"❌ Parse failed: {result['error']}")
        else:
            print(f"⚠️  File not found: {filename}")

if __name__ == "__main__":
    test_type_extraction()
    test_with_file()
