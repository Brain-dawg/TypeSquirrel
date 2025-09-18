""" Squirrel types """

from typing import Optional

class SquirrelType:

    """ Base class for Squirrel types """

    def __init__(self, name: str):
        self.name = name

    # Return the name of the type
    def __str__(self):
        return self.name

    # Check if two types are equal
    def __eq__(self, other):
        return isinstance(other, SquirrelType) and self.name == other.name

    # Hash the type
    def __hash__(self):
        return hash(self.name)

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        """ Check if this type can be assigned to another type """

        if self == other or isinstance(other, AnyType):
            return True
        elif isinstance(self, NullType):
            return isinstance(other, (NullType, OptionalType))

        return False


class PrimitiveType(SquirrelType):
    """ Primitive types: int, float, string, bool, null """
    def __init__(self, name: str):
        self.name = name
        super().__init__(name)
    # pass


class NullType(SquirrelType):
    """ null type """
    def __init__(self):
        super().__init__("null")


class AnyType(SquirrelType):

    """ 'Any' type - accepts any value """

    def __init__(self):
        super().__init__("any")

    def is_assignable_to(self, other: 'SquirrelType') -> bool:
        return True


class FunctionType(SquirrelType):

    """ Function type with parameter and return types """

    def __init__(self, param_types: list[SquirrelType], return_type: SquirrelType):

        self.param_types = param_types
        self.return_type = return_type
        param_str = ", ".join(str(p) for p in param_types)
        super().__init__(f"({param_str}) -> {return_type}")

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        if isinstance(other, FunctionType):

            if len(self.param_types) != len(other.param_types):
                return False

            # Parameters are contravariant
            for my_param, other_param in zip(self.param_types, other.param_types):
                if not other_param.is_assignable_to(my_param):
                    return False

            # Return type is covariant
            return self.return_type.is_assignable_to(other.return_type)

        return super().is_assignable_to(other)


class ArrayType(SquirrelType):

    """ Array type with element type """

    def __init__(self, element_type: SquirrelType):

        self.element_type = element_type
        super().__init__(f"array<{element_type}>")

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        if isinstance(other, ArrayType):
            return self.element_type.is_assignable_to(other.element_type)
        return super().is_assignable_to(other)


class TableType(SquirrelType):

    """ Object/table type with member types """

    def __init__(self, member_types: tuple[SquirrelType, SquirrelType]):

        self.member_types = member_types
        super().__init__(f"table<{member_types[0]}, {member_types[1]}>")

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        if isinstance(other, TableType):

            # Structural typing - all required members must be present
            for i, sqtype in enumerate(other.member_types):
                if sqtype not in self.member_types or not self.member_types[i].is_assignable_to(sqtype):
                    return False

            return True

        return super().is_assignable_to(other)


class ClassType(SquirrelType):

    """ Class type """

    def __init__(self, name: str, members: Optional[dict[str, SquirrelType]] = None, base_class: Optional['ClassType'] = None):

        self.members = members or {}
        self.base_class = base_class
        super().__init__(name)

    def is_assignable_to(self, other: 'SquirrelType') -> bool:
        if isinstance(other, ClassType):
            # Check inheritance chain
            current: Optional['ClassType'] = self
            while current:
                if current.name == other.name:
                    return True
                current = current.base_class
            return False
        return super().is_assignable_to(other)


class UnionType(SquirrelType):

    """ Union type representing multiple possible types """

    def __init__(self, types: set[SquirrelType]):

        self.types = types
        type_str = " | ".join(sorted(str(t) for t in types))
        super().__init__(type_str)

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        if isinstance(other, UnionType):
            # All our types must be assignable to at least one of their types
            return all(any(t.is_assignable_to(ot) for ot in other.types) for t in self.types)
        # All our types must be assignable to the target type
        return all(t.is_assignable_to(other) for t in self.types)


class OptionalType(SquirrelType):

    """ Optional type (T | null) """

    def __init__(self, inner_type: SquirrelType):

        self.inner_type = inner_type
        super().__init__(f"{inner_type}?")

    def is_assignable_to(self, other: 'SquirrelType') -> bool:

        if isinstance(other, OptionalType):
            return self.inner_type.is_assignable_to(other.inner_type)

        if isinstance(other, UnionType) and NullType() in other.types:
            return self.inner_type.is_assignable_to( UnionType( other.types - {NullType()} ) )

        return super().is_assignable_to(other)


NULL_TYPE      = NullType()

INT_TYPE       = PrimitiveType("int")
FLOAT_TYPE     = PrimitiveType("float")
STRING_TYPE    = PrimitiveType("string")
BOOL_TYPE      = PrimitiveType("bool")
CHAR_TYPE      = PrimitiveType("char")

ANY_TYPE       = AnyType()

FUNCTION_TYPE  = FunctionType([ANY_TYPE], ANY_TYPE)

ARRAY_TYPE     = ArrayType(ANY_TYPE)
TABLE_TYPE     = TableType((ANY_TYPE, ANY_TYPE))
CLASS_TYPE     = ClassType("class")
INSTANCE_TYPE  = ClassType("instance")
BLOB_TYPE      = ClassType("blob")

# Built-in types
SQUIRREL_TYPES: dict[str, SquirrelType] = {

    NULL_TYPE.name     : NULL_TYPE,
    BOOL_TYPE.name     : BOOL_TYPE,
    INT_TYPE.name      : INT_TYPE,
    FLOAT_TYPE.name    : FLOAT_TYPE,
    CHAR_TYPE.name     : CHAR_TYPE,
    STRING_TYPE.name   : STRING_TYPE,
    FUNCTION_TYPE.name : FUNCTION_TYPE,
    ARRAY_TYPE.name    : ARRAY_TYPE,
    TABLE_TYPE.name    : TABLE_TYPE,
    CLASS_TYPE.name    : CLASS_TYPE,
    INSTANCE_TYPE.name : INSTANCE_TYPE,
    BLOB_TYPE.name     : BLOB_TYPE,
    ANY_TYPE.name      : ANY_TYPE
}