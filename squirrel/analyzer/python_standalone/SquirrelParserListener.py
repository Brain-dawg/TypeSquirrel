# Generated from SquirrelParser.g4 by ANTLR 4.13.1
from antlr4 import *
if "." in __name__:
    from .SquirrelParserParser import SquirrelParserParser
else:
    from SquirrelParserParser import SquirrelParserParser

# This class defines a complete listener for a parse tree produced by SquirrelParserParser.
class SquirrelParserListener(ParseTreeListener):

    # Enter a parse tree produced by SquirrelParserParser#program.
    def enterProgram(self, ctx:SquirrelParserParser.ProgramContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#program.
    def exitProgram(self, ctx:SquirrelParserParser.ProgramContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#statement.
    def enterStatement(self, ctx:SquirrelParserParser.StatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#statement.
    def exitStatement(self, ctx:SquirrelParserParser.StatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#blockStatement.
    def enterBlockStatement(self, ctx:SquirrelParserParser.BlockStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#blockStatement.
    def exitBlockStatement(self, ctx:SquirrelParserParser.BlockStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#expressionStatement.
    def enterExpressionStatement(self, ctx:SquirrelParserParser.ExpressionStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#expressionStatement.
    def exitExpressionStatement(self, ctx:SquirrelParserParser.ExpressionStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#ifStatement.
    def enterIfStatement(self, ctx:SquirrelParserParser.IfStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#ifStatement.
    def exitIfStatement(self, ctx:SquirrelParserParser.IfStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#whileStatement.
    def enterWhileStatement(self, ctx:SquirrelParserParser.WhileStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#whileStatement.
    def exitWhileStatement(self, ctx:SquirrelParserParser.WhileStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#doWhileStatement.
    def enterDoWhileStatement(self, ctx:SquirrelParserParser.DoWhileStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#doWhileStatement.
    def exitDoWhileStatement(self, ctx:SquirrelParserParser.DoWhileStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#forStatement.
    def enterForStatement(self, ctx:SquirrelParserParser.ForStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#forStatement.
    def exitForStatement(self, ctx:SquirrelParserParser.ForStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#foreachStatement.
    def enterForeachStatement(self, ctx:SquirrelParserParser.ForeachStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#foreachStatement.
    def exitForeachStatement(self, ctx:SquirrelParserParser.ForeachStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#switchStatement.
    def enterSwitchStatement(self, ctx:SquirrelParserParser.SwitchStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#switchStatement.
    def exitSwitchStatement(self, ctx:SquirrelParserParser.SwitchStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#caseStatement.
    def enterCaseStatement(self, ctx:SquirrelParserParser.CaseStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#caseStatement.
    def exitCaseStatement(self, ctx:SquirrelParserParser.CaseStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#defaultStatement.
    def enterDefaultStatement(self, ctx:SquirrelParserParser.DefaultStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#defaultStatement.
    def exitDefaultStatement(self, ctx:SquirrelParserParser.DefaultStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#localDeclStatement.
    def enterLocalDeclStatement(self, ctx:SquirrelParserParser.LocalDeclStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#localDeclStatement.
    def exitLocalDeclStatement(self, ctx:SquirrelParserParser.LocalDeclStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#localDecl.
    def enterLocalDecl(self, ctx:SquirrelParserParser.LocalDeclContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#localDecl.
    def exitLocalDecl(self, ctx:SquirrelParserParser.LocalDeclContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#returnStatement.
    def enterReturnStatement(self, ctx:SquirrelParserParser.ReturnStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#returnStatement.
    def exitReturnStatement(self, ctx:SquirrelParserParser.ReturnStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#yieldStatement.
    def enterYieldStatement(self, ctx:SquirrelParserParser.YieldStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#yieldStatement.
    def exitYieldStatement(self, ctx:SquirrelParserParser.YieldStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#breakStatement.
    def enterBreakStatement(self, ctx:SquirrelParserParser.BreakStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#breakStatement.
    def exitBreakStatement(self, ctx:SquirrelParserParser.BreakStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#continueStatement.
    def enterContinueStatement(self, ctx:SquirrelParserParser.ContinueStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#continueStatement.
    def exitContinueStatement(self, ctx:SquirrelParserParser.ContinueStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#functionStatement.
    def enterFunctionStatement(self, ctx:SquirrelParserParser.FunctionStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#functionStatement.
    def exitFunctionStatement(self, ctx:SquirrelParserParser.FunctionStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#functionExpression.
    def enterFunctionExpression(self, ctx:SquirrelParserParser.FunctionExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#functionExpression.
    def exitFunctionExpression(self, ctx:SquirrelParserParser.FunctionExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#functionBody.
    def enterFunctionBody(self, ctx:SquirrelParserParser.FunctionBodyContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#functionBody.
    def exitFunctionBody(self, ctx:SquirrelParserParser.FunctionBodyContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#parameterList.
    def enterParameterList(self, ctx:SquirrelParserParser.ParameterListContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#parameterList.
    def exitParameterList(self, ctx:SquirrelParserParser.ParameterListContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#parameter.
    def enterParameter(self, ctx:SquirrelParserParser.ParameterContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#parameter.
    def exitParameter(self, ctx:SquirrelParserParser.ParameterContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#classStatement.
    def enterClassStatement(self, ctx:SquirrelParserParser.ClassStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#classStatement.
    def exitClassStatement(self, ctx:SquirrelParserParser.ClassStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#classMember.
    def enterClassMember(self, ctx:SquirrelParserParser.ClassMemberContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#classMember.
    def exitClassMember(self, ctx:SquirrelParserParser.ClassMemberContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#constructorDecl.
    def enterConstructorDecl(self, ctx:SquirrelParserParser.ConstructorDeclContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#constructorDecl.
    def exitConstructorDecl(self, ctx:SquirrelParserParser.ConstructorDeclContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#methodDecl.
    def enterMethodDecl(self, ctx:SquirrelParserParser.MethodDeclContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#methodDecl.
    def exitMethodDecl(self, ctx:SquirrelParserParser.MethodDeclContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#fieldDecl.
    def enterFieldDecl(self, ctx:SquirrelParserParser.FieldDeclContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#fieldDecl.
    def exitFieldDecl(self, ctx:SquirrelParserParser.FieldDeclContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#enumStatement.
    def enterEnumStatement(self, ctx:SquirrelParserParser.EnumStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#enumStatement.
    def exitEnumStatement(self, ctx:SquirrelParserParser.EnumStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#enumMember.
    def enterEnumMember(self, ctx:SquirrelParserParser.EnumMemberContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#enumMember.
    def exitEnumMember(self, ctx:SquirrelParserParser.EnumMemberContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#tryStatement.
    def enterTryStatement(self, ctx:SquirrelParserParser.TryStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#tryStatement.
    def exitTryStatement(self, ctx:SquirrelParserParser.TryStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#throwStatement.
    def enterThrowStatement(self, ctx:SquirrelParserParser.ThrowStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#throwStatement.
    def exitThrowStatement(self, ctx:SquirrelParserParser.ThrowStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#constStatement.
    def enterConstStatement(self, ctx:SquirrelParserParser.ConstStatementContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#constStatement.
    def exitConstStatement(self, ctx:SquirrelParserParser.ConstStatementContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#typeAnnotation.
    def enterTypeAnnotation(self, ctx:SquirrelParserParser.TypeAnnotationContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#typeAnnotation.
    def exitTypeAnnotation(self, ctx:SquirrelParserParser.TypeAnnotationContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#type.
    def enterType(self, ctx:SquirrelParserParser.TypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#type.
    def exitType(self, ctx:SquirrelParserParser.TypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#baseType.
    def enterBaseType(self, ctx:SquirrelParserParser.BaseTypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#baseType.
    def exitBaseType(self, ctx:SquirrelParserParser.BaseTypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#primitiveType.
    def enterPrimitiveType(self, ctx:SquirrelParserParser.PrimitiveTypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#primitiveType.
    def exitPrimitiveType(self, ctx:SquirrelParserParser.PrimitiveTypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#arrayType.
    def enterArrayType(self, ctx:SquirrelParserParser.ArrayTypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#arrayType.
    def exitArrayType(self, ctx:SquirrelParserParser.ArrayTypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#functionType.
    def enterFunctionType(self, ctx:SquirrelParserParser.FunctionTypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#functionType.
    def exitFunctionType(self, ctx:SquirrelParserParser.FunctionTypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#tableType.
    def enterTableType(self, ctx:SquirrelParserParser.TableTypeContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#tableType.
    def exitTableType(self, ctx:SquirrelParserParser.TableTypeContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#objectMember.
    def enterObjectMember(self, ctx:SquirrelParserParser.ObjectMemberContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#objectMember.
    def exitObjectMember(self, ctx:SquirrelParserParser.ObjectMemberContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#expression.
    def enterExpression(self, ctx:SquirrelParserParser.ExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#expression.
    def exitExpression(self, ctx:SquirrelParserParser.ExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#assignmentExpression.
    def enterAssignmentExpression(self, ctx:SquirrelParserParser.AssignmentExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#assignmentExpression.
    def exitAssignmentExpression(self, ctx:SquirrelParserParser.AssignmentExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#assignmentOperator.
    def enterAssignmentOperator(self, ctx:SquirrelParserParser.AssignmentOperatorContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#assignmentOperator.
    def exitAssignmentOperator(self, ctx:SquirrelParserParser.AssignmentOperatorContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#conditionalExpression.
    def enterConditionalExpression(self, ctx:SquirrelParserParser.ConditionalExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#conditionalExpression.
    def exitConditionalExpression(self, ctx:SquirrelParserParser.ConditionalExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#logicalOrExpression.
    def enterLogicalOrExpression(self, ctx:SquirrelParserParser.LogicalOrExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#logicalOrExpression.
    def exitLogicalOrExpression(self, ctx:SquirrelParserParser.LogicalOrExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#logicalAndExpression.
    def enterLogicalAndExpression(self, ctx:SquirrelParserParser.LogicalAndExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#logicalAndExpression.
    def exitLogicalAndExpression(self, ctx:SquirrelParserParser.LogicalAndExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#bitwiseOrExpression.
    def enterBitwiseOrExpression(self, ctx:SquirrelParserParser.BitwiseOrExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#bitwiseOrExpression.
    def exitBitwiseOrExpression(self, ctx:SquirrelParserParser.BitwiseOrExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#bitwiseXorExpression.
    def enterBitwiseXorExpression(self, ctx:SquirrelParserParser.BitwiseXorExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#bitwiseXorExpression.
    def exitBitwiseXorExpression(self, ctx:SquirrelParserParser.BitwiseXorExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#bitwiseAndExpression.
    def enterBitwiseAndExpression(self, ctx:SquirrelParserParser.BitwiseAndExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#bitwiseAndExpression.
    def exitBitwiseAndExpression(self, ctx:SquirrelParserParser.BitwiseAndExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#equalityExpression.
    def enterEqualityExpression(self, ctx:SquirrelParserParser.EqualityExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#equalityExpression.
    def exitEqualityExpression(self, ctx:SquirrelParserParser.EqualityExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#relationalExpression.
    def enterRelationalExpression(self, ctx:SquirrelParserParser.RelationalExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#relationalExpression.
    def exitRelationalExpression(self, ctx:SquirrelParserParser.RelationalExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#shiftExpression.
    def enterShiftExpression(self, ctx:SquirrelParserParser.ShiftExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#shiftExpression.
    def exitShiftExpression(self, ctx:SquirrelParserParser.ShiftExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#additiveExpression.
    def enterAdditiveExpression(self, ctx:SquirrelParserParser.AdditiveExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#additiveExpression.
    def exitAdditiveExpression(self, ctx:SquirrelParserParser.AdditiveExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#multiplicativeExpression.
    def enterMultiplicativeExpression(self, ctx:SquirrelParserParser.MultiplicativeExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#multiplicativeExpression.
    def exitMultiplicativeExpression(self, ctx:SquirrelParserParser.MultiplicativeExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#unaryExpression.
    def enterUnaryExpression(self, ctx:SquirrelParserParser.UnaryExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#unaryExpression.
    def exitUnaryExpression(self, ctx:SquirrelParserParser.UnaryExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#postfixExpression.
    def enterPostfixExpression(self, ctx:SquirrelParserParser.PostfixExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#postfixExpression.
    def exitPostfixExpression(self, ctx:SquirrelParserParser.PostfixExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#primaryExpression.
    def enterPrimaryExpression(self, ctx:SquirrelParserParser.PrimaryExpressionContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#primaryExpression.
    def exitPrimaryExpression(self, ctx:SquirrelParserParser.PrimaryExpressionContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#arrayLiteral.
    def enterArrayLiteral(self, ctx:SquirrelParserParser.ArrayLiteralContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#arrayLiteral.
    def exitArrayLiteral(self, ctx:SquirrelParserParser.ArrayLiteralContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#tableLiteral.
    def enterTableLiteral(self, ctx:SquirrelParserParser.TableLiteralContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#tableLiteral.
    def exitTableLiteral(self, ctx:SquirrelParserParser.TableLiteralContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#tableMember.
    def enterTableMember(self, ctx:SquirrelParserParser.TableMemberContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#tableMember.
    def exitTableMember(self, ctx:SquirrelParserParser.TableMemberContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#argumentList.
    def enterArgumentList(self, ctx:SquirrelParserParser.ArgumentListContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#argumentList.
    def exitArgumentList(self, ctx:SquirrelParserParser.ArgumentListContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#literal.
    def enterLiteral(self, ctx:SquirrelParserParser.LiteralContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#literal.
    def exitLiteral(self, ctx:SquirrelParserParser.LiteralContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#scalar.
    def enterScalar(self, ctx:SquirrelParserParser.ScalarContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#scalar.
    def exitScalar(self, ctx:SquirrelParserParser.ScalarContext):
        pass


    # Enter a parse tree produced by SquirrelParserParser#identifier.
    def enterIdentifier(self, ctx:SquirrelParserParser.IdentifierContext):
        pass

    # Exit a parse tree produced by SquirrelParserParser#identifier.
    def exitIdentifier(self, ctx:SquirrelParserParser.IdentifierContext):
        pass



del SquirrelParserParser