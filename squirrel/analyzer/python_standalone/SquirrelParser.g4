grammar SquirrelParser;

// Parser rules

program
    : statement* EOF
    ;

statement
    : expressionStatement
    | ifStatement
    | whileStatement
    | doWhileStatement
    | forStatement
    | foreachStatement
    | switchStatement
    | localDeclStatement
    | returnStatement
    | yieldStatement
    | breakStatement
    | continueStatement
    | functionStatement
    | classStatement
    | enumStatement
    | tryStatement
    | throwStatement
    | constStatement
    | blockStatement
    | SEMICOLON
    ;

blockStatement
    : LBRACE statement* RBRACE
    ;

expressionStatement
    : expression SEMICOLON?
    ;

ifStatement
    : IF LPAREN expression RPAREN statement (ELSE statement)?
    ;

whileStatement
    : WHILE LPAREN expression RPAREN statement
    ;

doWhileStatement
    : DO statement WHILE LPAREN expression RPAREN SEMICOLON?
    ;

forStatement
    : FOR LPAREN (localDecl | expression)? SEMICOLON expression? SEMICOLON expression? RPAREN statement
    ;

foreachStatement
    : FOREACH LPAREN identifier (COMMA identifier)? IN expression RPAREN statement
    ;

switchStatement
    : SWITCH LPAREN expression RPAREN LBRACE caseStatement* defaultStatement? RBRACE
    ;

caseStatement
    : CASE expression COLON statement*
    ;

defaultStatement
    : DEFAULT COLON statement*
    ;

localDeclStatement
    : LOCAL localDecl (COMMA localDecl)* SEMICOLON?
    ;

localDecl
    : identifier typeAnnotation? (ASSIGN expression)?
    ;

returnStatement
    : RETURN expression? SEMICOLON?
    ;

yieldStatement
    : YIELD expression? SEMICOLON?
    ;

breakStatement
    : BREAK SEMICOLON?
    ;

continueStatement
    : CONTINUE SEMICOLON?
    ;

functionStatement
    : FUNCTION identifier LPAREN parameterList? RPAREN typeAnnotation? functionBody
    ;

functionExpression
    : FUNCTION LPAREN parameterList? RPAREN typeAnnotation? functionBody
    ;

functionBody
    : LBRACE statement* RBRACE
    ;

parameterList
    : parameter (COMMA parameter)*
    ;

parameter
    : identifier typeAnnotation? (ASSIGN expression)?
    | VARPARAMS
    ;

classStatement
    : CLASS identifier (EXTENDS expression)? LBRACE classMember* RBRACE
    ;

classMember
    : constructorDecl
    | methodDecl
    | fieldDecl
    | STATIC methodDecl
    | STATIC fieldDecl
    ;

constructorDecl
    : CONSTRUCTOR LPAREN parameterList? RPAREN functionBody
    ;

methodDecl
    : FUNCTION identifier LPAREN parameterList? RPAREN typeAnnotation? functionBody
    | identifier LPAREN parameterList? RPAREN typeAnnotation? functionBody
    ;

fieldDecl
    : identifier typeAnnotation? (ASSIGN expression)? SEMICOLON?
    ;

enumStatement
    : ENUM identifier LBRACE enumMember (COMMA enumMember)* RBRACE
    ;

enumMember
    : identifier (ASSIGN expression)?
    ;

tryStatement
    : TRY statement CATCH LPAREN identifier RPAREN statement
    ;

throwStatement
    : THROW expression SEMICOLON?
    ;

constStatement
    : CONST identifier ASSIGN scalar SEMICOLON?
    ;

// Type annotations (our extension to Squirrel)
typeAnnotation
    : COLON type
    ;

type
    : baseType (BITOR baseType)*  // Union types using existing BITOR token
    ;

baseType
    : primitiveType
    | arrayType
    | functionType
    | tableType
    | identifier  // Custom types/classes
    ;

primitiveType
    : INT_TYPE
    | FLOAT_TYPE
    | STRING_TYPE
    | BOOL_TYPE
    | NULL
    | ANY_TYPE
    ;

arrayType
    : ARRAY LT type GT
    ;

functionType
    : LPAREN (type (COMMA type)*)? RPAREN ARROW type
    ;

tableType
    : LBRACE objectMember (COMMA objectMember)* RBRACE
    ;

objectMember
    : identifier COLON type
    ;

// Expressions
expression
    : assignmentExpression
    ;

assignmentExpression
    : conditionalExpression
    | conditionalExpression assignmentOperator assignmentExpression
    ;

assignmentOperator
    : ASSIGN
    | NEWSLOT
    | PLUSEQ
    | MINUSEQ
    | MULEQ
    | DIVEQ
    | MODEQ
    ;

conditionalExpression
    : logicalOrExpression
    | logicalOrExpression QUESTION expression COLON conditionalExpression
    ;

logicalOrExpression
    : logicalAndExpression
    | logicalOrExpression OR logicalAndExpression
    ;

logicalAndExpression
    : bitwiseOrExpression
    | logicalAndExpression AND bitwiseOrExpression
    ;

bitwiseOrExpression
    : bitwiseXorExpression
    | bitwiseOrExpression BITOR bitwiseXorExpression
    ;

bitwiseXorExpression
    : bitwiseAndExpression
    | bitwiseXorExpression BITXOR bitwiseAndExpression
    ;

bitwiseAndExpression
    : equalityExpression
    | bitwiseAndExpression BITAND equalityExpression
    ;

equalityExpression
    : relationalExpression
    | equalityExpression EQ relationalExpression
    | equalityExpression NE relationalExpression
    ;

relationalExpression
    : shiftExpression
    | relationalExpression LT shiftExpression
    | relationalExpression LE shiftExpression
    | relationalExpression GT shiftExpression
    | relationalExpression GE shiftExpression
    | relationalExpression INSTANCEOF shiftExpression
    | relationalExpression IN shiftExpression
    | relationalExpression THREEWAY shiftExpression
    ;

shiftExpression
    : additiveExpression
    | shiftExpression SHIFTL additiveExpression
    | shiftExpression SHIFTR additiveExpression
    | shiftExpression USHIFTR additiveExpression
    ;

additiveExpression
    : multiplicativeExpression
    | additiveExpression PLUS multiplicativeExpression
    | additiveExpression MINUS multiplicativeExpression
    ;

multiplicativeExpression
    : unaryExpression
    | multiplicativeExpression MUL unaryExpression
    | multiplicativeExpression DIV unaryExpression
    | multiplicativeExpression MOD unaryExpression
    ;

unaryExpression
    : postfixExpression
    | PLUS unaryExpression
    | MINUS unaryExpression
    | NOT unaryExpression
    | BITNOT unaryExpression
    | TYPEOF unaryExpression
    | CLONE unaryExpression
    | DELETE unaryExpression
    | PLUSPLUS unaryExpression
    | MINUSMINUS unaryExpression
    ;

postfixExpression
    : primaryExpression
    | postfixExpression LBRACKET expression RBRACKET
    | postfixExpression DOT identifier
    | postfixExpression DOUBLECOLON identifier
    | postfixExpression LPAREN argumentList? RPAREN
    | postfixExpression PLUSPLUS
    | postfixExpression MINUSMINUS
    ;

primaryExpression
    : identifier
    | literal
    | THIS
    | BASE
    | LPAREN expression RPAREN
    | functionExpression
    | arrayLiteral
    | tableLiteral
    | RESUME expression
    | YIELD expression
    ;

arrayLiteral
    : LBRACKET (expression (COMMA expression)*)? RBRACKET
    ;

tableLiteral
    : LBRACE (tableMember (COMMA tableMember)*)? RBRACE
    ;

tableMember
    : (identifier | LBRACKET expression RBRACKET | STRING) COLON expression
    | FUNCTION identifier LPAREN parameterList? RPAREN typeAnnotation? functionBody
    ;

argumentList
    : expression (COMMA expression)*
    ;

literal
    : scalar
    | STRING
    ;

scalar
    : INTEGER
    | FLOAT
    | TRUE
    | FALSE
    | NULL
    ;

identifier
    : IDENTIFIER
    | CONSTRUCTOR  // constructor can be used as identifier in some contexts
    ;

// Lexer rules

// Keywords
IF          : 'if';
ELSE        : 'else';
WHILE       : 'while';
DO          : 'do';
FOR         : 'for';
FOREACH     : 'foreach';
IN          : 'in';
SWITCH      : 'switch';
CASE        : 'case';
DEFAULT     : 'default';
BREAK       : 'break';
CONTINUE    : 'continue';
RETURN      : 'return';
YIELD       : 'yield';
RESUME      : 'resume';
FUNCTION    : 'function';
LOCAL       : 'local';
CLASS       : 'class';
EXTENDS     : 'extends';
CONSTRUCTOR : 'constructor';
STATIC      : 'static';
ENUM        : 'enum';
CONST       : 'const';
TRY         : 'try';
CATCH       : 'catch';
THROW       : 'throw';
DELETE      : 'delete';
CLONE       : 'clone';
TYPEOF      : 'typeof';
INSTANCEOF  : 'instanceof';
THIS        : 'this';
BASE        : 'base';
TRUE        : 'true';
FALSE       : 'false';
NULL        : 'null';
RAWCALL     : 'rawcall';

// Type annotation keywords (our extension)
INT_TYPE    : 'int';
FLOAT_TYPE  : 'float';
STRING_TYPE : 'string';
BOOL_TYPE   : 'bool';
ANY_TYPE    : 'any';
ARRAY       : 'array';

// Operators
ASSIGN      : '=';
NEWSLOT     : '<-';
PLUSEQ      : '+=';
MINUSEQ     : '-=';
MULEQ       : '*=';
DIVEQ       : '/=';
MODEQ       : '%=';
EQ          : '==';
NE          : '!=';
LT          : '<';
LE          : '<=';
GT          : '>';
GE          : '>=';
THREEWAY    : '<=>';
AND         : '&&';
OR          : '||';
PLUS        : '+';
MINUS       : '-';
MUL         : '*';
DIV         : '/';
MOD         : '%';
PLUSPLUS    : '++';
MINUSMINUS  : '--';
NOT         : '!';
BITNOT      : '~';
BITAND      : '&';
BITOR       : '|';
BITXOR      : '^';
SHIFTL      : '<<';
SHIFTR      : '>>';
USHIFTR     : '>>>';
QUESTION    : '?';
COLON       : ':';
DOUBLECOLON : '::';
SEMICOLON   : ';';
COMMA       : ',';
DOT         : '.';
VARPARAMS   : '...';
ARROW       : '->';

// Delimiters
LPAREN      : '(';
RPAREN      : ')';
LBRACE      : '{';
RBRACE      : '}';
LBRACKET    : '[';
RBRACKET    : ']';

// Literals
INTEGER
    : [0-9]+
    | '0' [xX] [0-9a-fA-F]+
    | '0' [0-7]+
    ;

FLOAT
    : [0-9]+ '.' [0-9]* ([eE] [+-]? [0-9]+)?
    | [0-9]+ [eE] [+-]? [0-9]+
    ;

STRING
    : '"' (~["\\\r\n] | EscapeSequence)* '"'
    | '\'' (~['\\\r\n] | EscapeSequence)* '\''
    | '@"' (~["] | '""')* '"'  // Verbatim string
    ;

fragment
EscapeSequence
    : '\\' [btnfr"'\\]
    | '\\' [0-7] [0-7]? [0-7]?
    | '\\' 'x' [0-9a-fA-F] [0-9a-fA-F]?
    | '\\' 'u' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]
    | '\\' 'U' [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F] [0-9a-fA-F]
    ;

IDENTIFIER
    : [a-zA-Z_] [a-zA-Z0-9_]*
    ;

// Comments and whitespace
LINE_COMMENT
    : ('//' | '#') ~[\r\n]* -> skip
    ;

BLOCK_COMMENT
    : '/*' .*? '*/' -> skip
    ;

WS
    : [ \t\r\n]+ -> skip
    ;
