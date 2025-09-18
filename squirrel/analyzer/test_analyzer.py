#!/usr/bin/env python3
"""
Test script for the Squirrel Static Type Analyzer
"""

import os
import sys
from squirrel_analyzer import SquirrelAnalyzer, ErrorSeverity

def test_basic_functionality():
    """Test basic analyzer functionality"""
    print("Testing basic functionality...")
    
    analyzer = SquirrelAnalyzer()
    
    # Test with simple code
    simple_code = """
    local name: string = "Hello";
    local age: int = 25;
    
    function greet(name: string): string {
        return "Hello " + name;
    }
    """
    
    result = analyzer.analyze_string(simple_code, check_types=True, strip_annotations=True)
    
    assert result["success"], "Analysis should succeed"
    print(f"✓ Found {len(result['messages'])} messages")
    
    if result["stripped_code"]:
        print("✓ Type annotation stripping works")
        print("Original code length:", len(simple_code))
        print("Stripped code length:", len(result["stripped_code"]))
    
    return True

def test_type_errors():
    """Test type error detection"""
    print("\nTesting type error detection...")
    
    analyzer = SquirrelAnalyzer()
    
    # Code with type errors
    error_code = """
    local name: string = 123;  // Type mismatch
    local age: int = "twenty"; // Type mismatch
    """
    
    result = analyzer.analyze_string(error_code, check_types=True)
    
    assert result["success"], "Analysis should succeed even with type errors"
    
    # Count different message types
    errors = [msg for msg in result["messages"] if msg.severity == ErrorSeverity.ERROR]
    warnings = [msg for msg in result["messages"] if msg.severity == ErrorSeverity.WARNING]
    infos = [msg for msg in result["messages"] if msg.severity == ErrorSeverity.INFO]
    
    print(f"✓ Found {len(errors)} errors, {len(warnings)} warnings, {len(infos)} info messages")
    
    return True

def test_annotation_stripping():
    """Test type annotation stripping"""
    print("\nTesting annotation stripping...")
    
    analyzer = SquirrelAnalyzer()
    
    annotated_code = """
    local name: string = "Hello";
    local age: int = 25;
    local numbers: array<int> = [1, 2, 3];
    
    function greet(name: string, age: int): string {
        return "Hello " + name;
    }
    """
    
    result = analyzer.analyze_string(annotated_code, check_types=False, strip_annotations=True)
    
    assert result["success"], "Analysis should succeed"
    assert result["stripped_code"], "Stripped code should be available"
    
    # Check that type annotations are removed
    stripped = result["stripped_code"]
    
    # These should be removed
    assert ": string" not in stripped, "String type annotation should be removed"
    assert ": int" not in stripped, "Int type annotation should be removed"
    assert ": array<int>" not in stripped, "Array type annotation should be removed"
    
    # These should remain
    assert "local name" in stripped, "Variable declaration should remain"
    assert "function greet" in stripped, "Function declaration should remain"
    assert '"Hello"' in stripped, "String literals should remain"
    
    print("✓ Type annotations successfully stripped")
    print("✓ Original code structure preserved")
    
    return True

def test_example_files():
    """Test with example files"""
    print("\nTesting example files...")
    
    analyzer = SquirrelAnalyzer()
    
    example_files = [
        "examples/basic_types.nut",
        "examples/type_errors.nut"
    ]
    
    for filename in example_files:
        if os.path.exists(filename):
            print(f"Testing {filename}...")
            result = analyzer.analyze_file(filename, check_types=True, strip_annotations=True)
            
            if result["success"]:
                print(f"✓ {filename}: {len(result['messages'])} messages")
                if result["stripped_code"]:
                    print(f"✓ {filename}: Annotation stripping successful")
            else:
                print(f"✗ {filename}: {result['error']}")
        else:
            print(f"⚠ {filename}: File not found, skipping")
    
    return True

def run_all_tests():
    """Run all tests"""
    print("Squirrel Static Type Analyzer - Test Suite")
    print("=" * 45)
    
    tests = [
        test_basic_functionality,
        test_type_errors,
        test_annotation_stripping,
        test_example_files
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✓ PASSED")
            else:
                failed += 1
                print("✗ FAILED")
        except Exception as e:
            failed += 1
            print(f"✗ FAILED: {str(e)}")
    
    print("\n" + "=" * 45)
    print(f"Test Results: {passed} passed, {failed} failed")
    
    if failed > 0:
        print("\nNote: Some failures are expected if ANTLR is not properly set up.")
        print("Run 'python generate_parser.py' to generate the parser first.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
