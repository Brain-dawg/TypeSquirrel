# Squirrel Static Type Analyzer Makefile

.PHONY: all setup generate test clean examples help

# Default target
all: setup generate test

# Install dependencies and generate parser
setup:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "Setup complete!"

# Generate ANTLR parser classes
generate:
	@echo "Generating ANTLR parser..."
	python generate_parser.py
	@echo "Parser generation complete!"

# Run tests
test:
	@echo "Running tests..."
	python test_analyzer.py
	@echo "Tests complete!"

# Run analyzer on example files
examples:
	@echo "Running analyzer on example files..."
	@if [ -f "examples/basic_types.nut" ]; then \
		echo "=== Analyzing basic_types.nut ==="; \
		python squirrel_analyzer.py examples/basic_types.nut; \
		echo ""; \
		echo "=== Stripping annotations from basic_types.nut ==="; \
		python squirrel_analyzer.py --strip examples/basic_types.nut; \
	fi
	@if [ -f "examples/type_errors.nut" ]; then \
		echo ""; \
		echo "=== Analyzing type_errors.nut ==="; \
		python squirrel_analyzer.py examples/type_errors.nut; \
	fi

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	rm -f SquirrelParser*.py
	rm -f SquirrelParser.tokens
	rm -f SquirrelParserLexer.tokens
	rm -rf __pycache__/
	rm -rf *.pyc
	@echo "Clean complete!"

# Show help
help:
	@echo "Squirrel Static Type Analyzer"
	@echo "============================="
	@echo ""
	@echo "Available targets:"
	@echo "  all        - Setup, generate parser, and run tests (default)"
	@echo "  setup      - Install Python dependencies"
	@echo "  generate   - Generate ANTLR parser classes"
	@echo "  test       - Run test suite"
	@echo "  examples   - Run analyzer on example files"
	@echo "  clean      - Remove generated files"
	@echo "  help       - Show this help message"
	@echo ""
	@echo "Usage examples:"
	@echo "  make                    # Complete setup and test"
	@echo "  make generate           # Generate parser only"
	@echo "  make test               # Run tests only"
	@echo "  make examples           # Test with examples"
	@echo ""
	@echo "Manual usage:"
	@echo "  python squirrel_analyzer.py file.nut"
	@echo "  python squirrel_analyzer.py --strip --output clean.nut file.nut"