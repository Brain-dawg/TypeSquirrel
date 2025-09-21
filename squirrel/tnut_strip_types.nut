local ROOT = getroottable()

local INPUT_FILENAMES = [

    "input.nut"
    "input2.nut"
    "input3.nut"
    "input4.nut"
    "input5.nut"
]

// Example code with type annotations
local exampleCode = @"
// Function with type annotations
function getAge(): int {
    return 25;
}

function greet(name: string, age: int): string {
    return ""Hello "" + name + "", you are "" + age;
}

// Variables with type annotations
local playerName: string = ""John"";
local playerAge: int = getAge();
local isAlive: bool = true;

// Optional types
local maybeScore: int? = null;
local optionalName: string? = ""Optional"";

// Generic types
local numbers: array<int> = [1, 2, 3, 4, 5];
local names: array<string> = [""Alice"", ""Bob"", ""Charlie""];

// Complex nested generics
local matrix: array<array<int>> = [[1, 2], [3, 4]];

// Class with type annotations
class Player {
    name: string = ""Unknown"";
    health: int = 100;
    isAlive: bool = true;
    
    constructor(name: string, health: int) {
        this.name = name;
        this.health = health;
    }
    
    function takeDamage(damage: int): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }
    
    function getName(): string {
        return this.name;
    }
}

// Newslot operator with types
age: int <- 30;
score: float <- 99.5;
";

/**
 * Strips type annotations from Squirrel source code while preserving formatting
 * Squirrel port of the Python TypeAnnotationStripper class
 */
class TypeAnnotationStripper {
    
    sourceCode = null;
    lines = [];
    
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
        this.lines = this.splitLines(sourceCode);
    }
    
    /**
     * Strip type annotations while preserving formatting
     */
    function stripAnnotations() {
        local result = this.sourceCode;
        
        // 1. Strip basic type annotations like ": int", ": string", etc.
        result = this.stripBasicTypeAnnotations(result);
        
        // 2. Strip generic type annotations like ": array<int>", ": table<string, int>"
        result = this.stripGenericTypeAnnotations(result);
        
        // 3. Strip optional type markers (? characters) that follow identifiers
        result = this.stripOptionalTypeMarkers(result);
        
        // 4. Fix class member declarations - add " = null" to bare member declarations
        result = this.fixClassMemberDeclarations(result);
        
        return result;
    }
    
    /**
     * Strip basic type annotations like ": int", ": string", ": bool"
     */
    function stripBasicTypeAnnotations(text) {
        local result = text;
        
        // Pattern: ": type" where type is a basic identifier
        // Since Squirrel regex is limited, we'll do this character by character
        local newResult = "";
        local i = 0;
        local len = text.len();
        
        while (i < len) {
            local char = text[i];
            
            if (char == ':') {
                // Check if this is a type annotation
                local typeStart = i + 1;
                
                // Skip whitespace after colon
                while (typeStart < len && this.isWhitespace(text[typeStart])) {
                    typeStart++;
                }
                
                if (typeStart < len && this.isIdentifierStart(text[typeStart])) {
                    // Find end of type identifier
                    local typeEnd = typeStart;
                    while (typeEnd < len && this.isIdentifierChar(text[typeEnd])) {
                        typeEnd++;
                    }
                    
                    local typeName = text.slice(typeStart, typeEnd);
                    
                    // Check if this is a known type
                    if (this.isKnownType(typeName)) {
                        // Skip the entire type annotation
                        i = typeEnd;
                        continue;
                    }
                }
            }
            
            newResult += char;
            i++;
        }
        
        return newResult;
    }
    
    /**
     * Strip generic type annotations like "array<int>", "table<string, int>"
     */
    function stripGenericTypeAnnotations(text) {
        local result = text;
        
        // Find and remove generic type patterns
        local newResult = "";
        local i = 0;
        local len = text.len();
        
        while (i < len) {
            local char = text[i];
            
            if (char == '<') {
                // Check if this is part of a generic type
                local beforeAngle = i - 1;
                
                // Look backwards to see if we have a type identifier before <
                while (beforeAngle >= 0 && this.isWhitespace(text[beforeAngle])) {
                    beforeAngle--;
                }
                
                if (beforeAngle >= 0) {
                    local typeStart = beforeAngle;
                    while (typeStart > 0 && this.isIdentifierChar(text[typeStart])) {
                        typeStart--;
                    }
                    if (!this.isIdentifierChar(text[typeStart])) {
                        typeStart++;
                    }
                    
                    local typeName = text.slice(typeStart, beforeAngle + 1);
                    
                    if (this.isGenericType(typeName)) {
                        // Find matching closing >
                        local angleDepth = 1;
                        local closePos = i + 1;
                        
                        while (closePos < len && angleDepth > 0) {
                            if (text[closePos] == '<') {
                                angleDepth++;
                            } else if (text[closePos] == '>') {
                                angleDepth--;
                            }
                            closePos++;
                        }
                        
                        if (angleDepth == 0) {
                            // Remove the entire generic part
                            newResult = newResult.slice(0, newResult.len() - (beforeAngle - typeStart + 1));
                            i = closePos;
                            continue;
                        }
                    }
                }
            }
            
            newResult += char;
            i++;
        }
        
        return newResult;
    }
    
    /**
     * Strip optional type markers (? characters) that follow identifiers
     */
    function stripOptionalTypeMarkers(text) {
        local result = "";
        local i = 0;
        local len = text.len();
        
        while (i < len) {
            local char = text[i];
            
            if (char == '?' && i > 0) {
                // Check if previous character was an identifier character
                local prevChar = text[i - 1];
                if (this.isIdentifierChar(prevChar)) {
                    // Skip the ? character
                    i++;
                    continue;
                }
            }
            
            result += char;
            i++;
        }
        
        return result;
    }
    
    /**
     * Fix class member declarations - add " = null" to bare member declarations
     */
    function fixClassMemberDeclarations(text) {
        local lines = this.splitLines(text);
        local result = [];
        local inClass = false;
        local braceCount = 0;
        
        foreach (line in lines) {
            local trimmedLine = this.trim(line);
            
            // Track if we're inside a class
            if (trimmedLine.find("class ") != null && trimmedLine.find("{") != null) {
                inClass = true;
                braceCount = this.countChar(line, '{') - this.countChar(line, '}');
            } else if (inClass) {
                braceCount += this.countChar(line, '{') - this.countChar(line, '}');
                if (braceCount <= 0) {
                    inClass = false;
                    braceCount = 0;
                }
            }
            
            // If we're in a class and find a bare member declaration, fix it
            if (inClass) {
                local memberMatch = this.matchClassMember(line);
                if (memberMatch != null) {
                    local indent = memberMatch.indent;
                    local memberName = memberMatch.name;
                    line = indent + memberName + " = null;";
                }
            }
            
            result.append(line);
        }
        
        return this.joinLines(result);
    }
    
    /**
     * Check if a line matches a class member pattern
     */
    function matchClassMember(line) {
        // Look for pattern: "    name;" (with optional whitespace)
        local trimmed = this.trim(line);
        
        // Skip lines with keywords
        if (trimmed.find("function") != null || 
            trimmed.find("constructor") != null || 
            trimmed.find("static") != null ||
            trimmed.find("=") != null ||
            trimmed.find("(") != null) {
            return null;
        }
        
        // Check if line ends with semicolon
        if (trimmed.len() == 0 || trimmed[trimmed.len() - 1] != ';') {
            return null;
        }
        
        // Extract identifier before semicolon
        local nameEnd = trimmed.len() - 1; // Before semicolon
        while (nameEnd > 0 && this.isWhitespace(trimmed[nameEnd - 1])) {
            nameEnd--;
        }
        
        local nameStart = nameEnd - 1;
        while (nameStart > 0 && this.isIdentifierChar(trimmed[nameStart - 1])) {
            nameStart--;
        }
        
        if (nameStart < nameEnd && this.isIdentifierStart(trimmed[nameStart])) {
            local memberName = trimmed.slice(nameStart, nameEnd);
            local indent = line.slice(0, line.find(memberName));
            
            return {
                indent = indent,
                name = memberName
            };
        }
        
        return null;
    }
    
    // Helper functions
    
    function splitLines(text) {
        local lines = [];
        local currentLine = "";
        
        for (local i = 0; i < text.len(); i++) {
            local char = text[i];
            if (char == '\n') {
                lines.append(currentLine);
                currentLine = "";
            } else if (char != '\r') { // Skip \r characters
                currentLine += char;
            }
        }
        
        if (currentLine.len() > 0) {
            lines.append(currentLine);
        }
        
        return lines;
    }
    
    function joinLines(lines) {
        local result = "";
        for (local i = 0; i < lines.len(); i++) {
            result += lines[i];
            if (i < lines.len() - 1) {
                result += "\n";
            }
        }
        return result;
    }
    
    function isWhitespace(char) {
        return char == ' ' || char == '\t' || char == '\n' || char == '\r';
    }
    
    function isIdentifierStart(char) {
        return (char >= 'a' && char <= 'z') || 
               (char >= 'A' && char <= 'Z') || 
               char == '_';
    }
    
    function isIdentifierChar(char) {
        return this.isIdentifierStart(char) || 
               (char >= '0' && char <= '9');
    }
    
    function isKnownType(typeName) {
        local knownTypes = [
            "int", "float", "string", "bool", "char", "null",
            "array", "table", "function", "class", "instance", 
            "blob", "any", "void"
        ];
        
        foreach (type in knownTypes) {
            if (typeName == type) {
                return true;
            }
        }
        return false;
    }
    
    function isGenericType(typeName) {
        local genericTypes = ["array", "table", "function"];
        
        foreach (type in genericTypes) {
            if (typeName == type) {
                return true;
            }
        }
        return false;
    }
    
    function trim(str) {
        if (str.len() == 0) return str;
        
        local start = 0;
        local end = str.len() - 1;
        
        while (start <= end && this.isWhitespace(str[start])) {
            start++;
        }
        
        while (end >= start && this.isWhitespace(str[end])) {
            end--;
        }
        
        return str.slice(start, end + 1);
    }
    
    function countChar(str, char) {
        local count = 0;
        for (local i = 0; i < str.len(); i++) {
            if (str[i] == char) {
                count++;
            }
        }
        return count;
    }
}

/**
 * Main function to strip type annotations from a file
 */
function stripTypeAnnotationsFromFile(inputFile, outputFile = null) {

    try {
        // Read source file
        local sourceCode = FileToString(inputFile);
        if (sourceCode == null) {
            print("Error: Could not read file: " + inputFile);
            return false;
        }
        
        // Create stripper and process
        local stripper = TypeAnnotationStripper(sourceCode);
        local strippedCode = stripper.stripAnnotations();
        
        // Determine output file
        if (outputFile == null) {
            // Generate output filename: input.nut -> input_stripped.nut
            local dotPos = inputFile.find(".");
            if (dotPos != null) {
                outputFile = inputFile.slice(0, dotPos) + "_stripped" + inputFile.slice(dotPos);
            } else {
                outputFile = inputFile + "_stripped";
            }
        }
        
        // Write stripped code
        local success = StringToFile(strippedCode, outputFile);
        if (success) {
            print("Successfully stripped type annotations from: " + inputFile);
            print("Output written to: " + outputFile);
            return true;
        } else {
            print("Error: Could not write to file: " + outputFile);
            return false;
        }
        
    } catch (e) {
        print("Error processing file: " + e);
        return false;
    }
}

/**
 * Example usage function
 */
function demonstrateTypeStripping() {

    print("=== Type Annotation Stripper Demo ===");

    print("Original code:");
    print("==============");
    print(exampleCode);
    
    // Strip type annotations
    local stripper = TypeAnnotationStripper(exampleCode);
    local strippedCode = stripper.stripAnnotations();
    
    print("\nStripped code:");
    print("==============");
    print(strippedCode);
    
    print("\n=== Demo completed ===");
}

// Export the main functions
if (!("stripTypeAnnotationsFromFile" in ROOT)) {
    ROOT.stripTypeAnnotationsFromFile <- stripTypeAnnotationsFromFile;
    ROOT.demonstrateTypeStripping     <- demonstrateTypeStripping;
    ROOT.TypeAnnotationStripper       <- TypeAnnotationStripper;
}

/**
 * Main function
 */
function main() {

    // Get command line arguments (simulated - Squirrel doesn't have native argv)
    // In a real implementation, you'd need to pass these as parameters or use a different approach
    
    // For demo purposes, let's check if we're running in demo mode
    local runDemo = false;
    local inputFile = null;
    local outputFile = null;
    
    // This is a simplified version - in practice you'd need to handle command line args differently
    // For now, let's make it interactive
    
    print("Squirrel Type Annotation Stripper");
    print("=================================");
    print("");
    
    // Check if user wants demo
    print("Choose an option:");
    print("1. Strip type annotations from a file");
    print("2. Run demonstration");
    print("3. Show help");
    print("");
    
    // In a real CLI, you'd read from stdin or command line args
    // For this demo, let's just run the demonstration
    demonstrateTypeStripping();
    
    print("");
    print("To use this tool with actual files, you would call:");
    print("stripTypeAnnotationsFromFile(\"input.nut\", \"output.nut\");");
}

/**
 * Process a single file
 */
function processFile(inputFile, outputFile = null) {

    print("Processing file: " + inputFile);
    
    if (!stripTypeAnnotationsFromFile(inputFile, outputFile)) {
        print("Failed to process file: " + inputFile);
        return false;
    }
    
    return true;
}

/**
 * Process multiple files
 */
function processFiles(inputFiles, outputDir = null) {

    local successCount = 0;
    local totalCount = inputFiles.len();
    
    print("Processing " + totalCount + " files...");
    
    foreach (inputFile in inputFiles) {
        local outputFile = outputDir ? outputDir + "/" + getBaseName(inputFile) : null;
        
        if (processFile(inputFile, outputFile)) {
            successCount++;
        }
    }
    
    print("");
    print("Results: " + successCount + "/" + totalCount + " files processed successfully");
    
    return successCount == totalCount;
}

/**
 * Get base name from file path
 */
function getBaseName(filePath) {

    local lastSlash = filePath.len() - 1;
    
    // Find last slash or backslash
    for (local i = filePath.len() - 1; i >= 0; i--) {
        if (filePath[i] == '/' || filePath[i] == '\\') {
            lastSlash = i;
            break;
        }
    }
    
    return filePath.slice(lastSlash + 1);
}

/**
 * Batch process all .nut files in a directory
 */
function processBatch(inputDir, outputDir = null) {

    // Note: Squirrel doesn't have built-in directory listing
    // This would need to be implemented with external tools or C++ extensions
    print("Batch processing not implemented in pure Squirrel");
    print("You would need to implement directory listing functionality");
    
    // Example of how you might call it if you had file listing:
    /*
    local nutFiles = listFiles(inputDir, "*.nut");
    return processFiles(nutFiles, outputDir);
    */
    
    return false;
}

/**
 * Interactive mode
 */
function interactiveMode() {

    print("Interactive Type Annotation Stripper");
    print("====================================");
    print("");
    
    while (true) {
        print("Options:");
        print("1. Process a single file");
        print("2. Run demonstration");
        print("3. Exit");
        print("");
        print("Enter your choice (1-3): ");
        
        // In a real implementation, you'd read from stdin
        // For demo, let's just run the demonstration
        demonstrateTypeStripping();
        break;
    }
}

/**
 * Example of how to use the stripper programmatically
 */
function exampleUsage() {

    print("=== Programmatic Usage Example ===");
    
    // Example 1: Strip types from a string
    local codeWithTypes = @"
function calculate(x: int, y: int): float {
    local result: float = x * y * 1.5;
    return result;
}

class Calculator {
    precision: int = 2;
    
    function add(a: float, b: float): float {
        return a + b;
    }
}
";
    
    print("Original code:");
    print(codeWithTypes);
    
    local stripper = TypeAnnotationStripper(codeWithTypes);
    local strippedCode = stripper.stripAnnotations();
    
    print("\nStripped code:");
    print(strippedCode);
    
    print("\n=== Example completed ===");
}

// Run the main function
main();

// Also demonstrate example usage
print("\n");
exampleUsage();
