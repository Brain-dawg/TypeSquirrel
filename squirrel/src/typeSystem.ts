import { TypeAnnotation, Identifier, SyntaxKind } from "./types";

/**
 * Base class for all Squirrel types
 */
export abstract class SquirrelType {
    constructor(public readonly name: string) {}

    toString(): string {
        return this.name;
    }

    equals(other: SquirrelType): boolean {
        return this.constructor === other.constructor && this.name === other.name;
    }

    /**
     * Check if this type can be assigned to another type
     */
    isAssignableTo(other: SquirrelType): boolean {
        if (this.equals(other) || other instanceof AnyType) {
            return true;
        }
        if (this instanceof NullType) {
            return other instanceof NullType || other instanceof OptionalType;
        }
        // Allow non-optional types to be assigned to optional types
        if (other instanceof OptionalType) {
            return this.isAssignableTo(other.innerType);
        }
        return false;
    }
}

/**
 * Primitive types: int, float, string, bool, null
 */
export class PrimitiveType extends SquirrelType {
    constructor(name: string) {
        super(name);
    }
}

/**
 * Null type
 */
export class NullType extends SquirrelType {
    constructor() {
        super("null");
    }
}

/**
 * 'Any' type - accepts any value
 */
export class AnyType extends SquirrelType {
    constructor() {
        super("any");
    }

    isAssignableTo(_other: SquirrelType): boolean {
        return true;
    }
}

/**
 * Function type with parameter and return types
 */
export class FunctionType extends SquirrelType {
    constructor(
        public readonly paramTypes: SquirrelType[],
        public readonly returnType: SquirrelType
    ) {
        const paramStr = paramTypes.map(p => p.toString()).join(", ");
        super(`(${paramStr}) -> ${returnType.toString()}`);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof FunctionType) {
            if (this.paramTypes.length !== other.paramTypes.length) {
                return false;
            }

            // Parameters are contravariant
            for (let i = 0; i < this.paramTypes.length; i++) {
                if (!other.paramTypes[i].isAssignableTo(this.paramTypes[i])) {
                    return false;
                }
            }

            // Return type is covariant
            return this.returnType.isAssignableTo(other.returnType);
        }
        return super.isAssignableTo(other);
    }
}

/**
 * Array type with element type
 */
export class ArrayType extends SquirrelType {
    constructor(public readonly elementType: SquirrelType) {
        super(`array<${elementType.toString()}>`);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof ArrayType) {
            return this.elementType.isAssignableTo(other.elementType);
        }
        return super.isAssignableTo(other);
    }
}

/**
 * Table type with key and value types
 */
export class TableType extends SquirrelType {
    constructor(
        public readonly keyType: SquirrelType,
        public readonly valueType: SquirrelType
    ) {
        super(`table<${keyType.toString()}, ${valueType.toString()}>`);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof TableType) {
            return this.keyType.isAssignableTo(other.keyType) && 
                   this.valueType.isAssignableTo(other.valueType);
        }
        return super.isAssignableTo(other);
    }
}

/**
 * Class type
 */
export class ClassType extends SquirrelType {
    constructor(
        name: string,
        public readonly members: Map<string, SquirrelType> = new Map(),
        public readonly baseClass?: ClassType
    ) {
        super(name);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof ClassType) {
            // Check inheritance chain
            let current: ClassType | undefined = this;
            while (current) {
                if (current.name === other.name) {
                    return true;
                }
                current = current.baseClass;
            }
            return false;
        }
        return super.isAssignableTo(other);
    }
}

/**
 * Union type representing multiple possible types
 */
export class UnionType extends SquirrelType {
    constructor(public readonly types: Set<SquirrelType>) {
        const typeStr = Array.from(types)
            .map(t => t.toString())
            .sort()
            .join(" | ");
        super(typeStr);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof UnionType) {
            // All our types must be assignable to at least one of their types
            return Array.from(this.types).every(t => 
                Array.from(other.types).some(ot => t.isAssignableTo(ot))
            );
        }
        // All our types must be assignable to the target type
        return Array.from(this.types).every(t => t.isAssignableTo(other));
    }
}

/**
 * Optional type (T | null)
 */
export class OptionalType extends SquirrelType {
    constructor(public readonly innerType: SquirrelType) {
        super(`${innerType.toString()}?`);
    }

    isAssignableTo(other: SquirrelType): boolean {
        if (other instanceof OptionalType) {
            return this.innerType.isAssignableTo(other.innerType);
        }
        if (other instanceof UnionType && Array.from(other.types).some(t => t instanceof NullType)) {
            const nonNullTypes = new Set(Array.from(other.types).filter(t => !(t instanceof NullType)));
            return this.innerType.isAssignableTo(new UnionType(nonNullTypes));
        }
        return super.isAssignableTo(other);
    }
}

// Built-in types
export const NULL_TYPE = new NullType();
export const INT_TYPE = new PrimitiveType("int");
export const FLOAT_TYPE = new PrimitiveType("float");
export const STRING_TYPE = new PrimitiveType("string");
export const BOOL_TYPE = new PrimitiveType("bool");
export const CHAR_TYPE = new PrimitiveType("char");
export const ANY_TYPE = new AnyType();
export const FUNCTION_TYPE = new FunctionType([ANY_TYPE], ANY_TYPE);
export const ARRAY_TYPE = new ArrayType(ANY_TYPE);
export const TABLE_TYPE = new TableType(ANY_TYPE, ANY_TYPE);
export const CLASS_TYPE = new ClassType("class");
export const INSTANCE_TYPE = new ClassType("instance");
export const BLOB_TYPE = new ClassType("blob");

// Built-in types map
export const SQUIRREL_TYPES = new Map<string, SquirrelType>([
    ["null", NULL_TYPE],
    ["int", INT_TYPE],
    ["float", FLOAT_TYPE],
    ["string", STRING_TYPE],
    ["bool", BOOL_TYPE],
    ["char", CHAR_TYPE],
    ["any", ANY_TYPE],
    ["function", FUNCTION_TYPE],
    ["array", ARRAY_TYPE],
    ["table", TABLE_TYPE],
    ["class", CLASS_TYPE],
    ["instance", INSTANCE_TYPE],
    ["blob", BLOB_TYPE],
]);

/**
 * Parse a type annotation AST node into a SquirrelType
 */
export function parseTypeFromAnnotation(annotation: TypeAnnotation): SquirrelType {
    const baseType = parseBaseType(annotation.typeName);
    
    // Handle generic arguments
    if (annotation.genericArguments && annotation.genericArguments.elements.length > 0) {
        const genericArgs = annotation.genericArguments.elements.map(parseTypeFromAnnotation);
        
        if (baseType.name === "array" && genericArgs.length === 1) {
            const arrayType = new ArrayType(genericArgs[0]);
            return annotation.isOptional ? new OptionalType(arrayType) : arrayType;
        } else if (baseType.name === "table" && genericArgs.length === 2) {
            const tableType = new TableType(genericArgs[0], genericArgs[1]);
            return annotation.isOptional ? new OptionalType(tableType) : tableType;
        } else if (baseType instanceof FunctionType && genericArgs.length > 0) {
            // For function<ReturnType> or function<Param1, Param2, ..., ReturnType>
            const returnType = genericArgs[genericArgs.length - 1];
            const paramTypes = genericArgs.slice(0, -1);
            const funcType = new FunctionType(paramTypes, returnType);
            return annotation.isOptional ? new OptionalType(funcType) : funcType;
        }
    }
    
    return annotation.isOptional ? new OptionalType(baseType) : baseType;
}

function parseBaseType(identifier: Identifier): SquirrelType {
    const typeName = identifier.value;
    return SQUIRREL_TYPES.get(typeName) || new ClassType(typeName);
}
