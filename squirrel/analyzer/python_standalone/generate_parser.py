#!/usr/bin/env python3
"""
Script to generate ANTLR parser classes for Squirrel
"""

import os
import subprocess
import sys
from pathlib import Path

def check_antlr():
    """Check if ANTLR is available"""
    try:
        result = subprocess.run(['antlr4', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"Found ANTLR: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    # Try with java -jar
    antlr_jar = Path.home() / "antlr-4.13.1-complete.jar"
    if antlr_jar.exists():
        try:
            result = subprocess.run(['java', '-jar', str(antlr_jar)], capture_output=True, text=True)
            if "ANTLR Parser Generator" in result.stderr:
                print(f"Found ANTLR JAR: {antlr_jar}")
                return str(antlr_jar)
        except FileNotFoundError:
            pass
    
    return False

def download_antlr():
    """Download ANTLR if not available"""
    import urllib.request
    
    antlr_jar = Path.home() / "antlr-4.13.1-complete.jar"
    if antlr_jar.exists():
        return str(antlr_jar)
    
    print("Downloading ANTLR...")
    url = "https://www.antlr.org/download/antlr-4.13.1-complete.jar"
    try:
        urllib.request.urlretrieve(url, antlr_jar)
        print(f"Downloaded ANTLR to: {antlr_jar}")
        return str(antlr_jar)
    except Exception as e:
        print(f"Failed to download ANTLR: {e}")
        return False

def generate_parser(antlr_path=None):
    """Generate parser classes from grammar"""
    grammar_file = "SquirrelParser.g4"
    
    if not os.path.exists(grammar_file):
        print(f"Error: Grammar file {grammar_file} not found")
        return False
    
    # Prepare command
    if antlr_path and antlr_path.endswith('.jar'):
        cmd = ['java', '-jar', antlr_path, '-Dlanguage=Python3', grammar_file]
    else:
        cmd = ['antlr4', '-Dlanguage=Python3', grammar_file]
    
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("Parser generation successful!")
            print("Generated files:")
            for ext in ['Lexer.py', 'Parser.py', 'Listener.py', 'Visitor.py']:
                filename = f"SquirrelParser{ext}"
                if os.path.exists(filename):
                    print(f"  - {filename}")
            return True
        else:
            print(f"Error generating parser:")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"Error running ANTLR: {e}")
        return False

def main():
    """Main function"""
    print("Squirrel Parser Generator")
    print("=" * 25)
    
    # Check for ANTLR
    antlr_path = check_antlr()
    if not antlr_path:
        print("ANTLR not found. Attempting to download...")
        antlr_path = download_antlr()
        if not antlr_path:
            print("Failed to obtain ANTLR. Please install it manually:")
            print("1. Download from: https://www.antlr.org/download/antlr-4.13.1-complete.jar")
            print("2. Or install via: pip install antlr4-tools")
            sys.exit(1)
    
    # Generate parser
    if generate_parser(antlr_path):
        print("\nParser generation completed successfully!")
        print("You can now run the analyzer with: python squirrel_analyzer.py <file.nut>")
    else:
        print("\nParser generation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
