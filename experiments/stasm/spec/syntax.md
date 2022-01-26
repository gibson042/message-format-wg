# MessageFormat 2.0 Syntax

<details>
<summary>Changelog</summary>

|   Date   | Description |
|----------|-------------|
| **TODO** |Aliases to submessages|
|2022-01-26|Specify symbols more precisely. Restrict whitespace.|
|2022-01-26|Add `/*...*/` comments|
|2022-01-25|Add `"..."` string literals and literal formatters|
|2022-01-25|Specify escape sequences|
|2022-01-25|Initial design|

</details>

## Table of Contents

1. [Introduction](#introduction)
    1. [Design Goals](#design-goals)
    1. [Design Restrictions](#design-restrictions)
1. [Overview & Examples](#overview--examples)
    1. [Simple Messages](#simple-messages)
    1. [Simple Placeholders](#simple-placeholders)
    1. [Formatting Functions](#formatting-functions)
    1. [Aliases](#aliases)
    1. [Selection](#selection)
    1. [Complex Messages](#complex-messages)
1. [Comparison with ICU MessageFormat 1.0](#comparison-with-icu-messageformat-10)
1. [Productions](#productions)
    1. [Message](#message)
    1. [Declarations](#declarations)
    1. [Variants & Patterns](#variants--patterns)
    1. [Expressions](#expressions)
1. [Tokens](#tokens)
    1. [Names](#names)
    1. [Text](#text)
    1. [Literals](#literals)
    1. [Escape Sequences](#escape-sequences)
    1. [Comments](#comments)
    1. [Whitespace](#whitespace)
1. [Complete EBNF](#complete-ebnf)

## Introduction

This document defines the formal grammar describing the syntax of a single message. A separate syntax shall be specified to describe collections of messages (_MessageResources_), including message identifiers, metadata, comments, groups, etc.

The document is part of the MessageFormat 2.0 specification, the successor to ICU MessageFormat, henceforth called ICU MessageFormat 1.0.

### Design Goals

The design goals of the syntax specification are as follows:

1. The syntax should be an incremental update over the ICU MessageFormat 1.0 syntax in order to leverage the familiarity and the single-message model that is ubiquitous in the localization tooling today, and increase the chance of adoption.

    * _Non-Goal_: Be backwards-compatible with the ICU MessageFormat 1.0 syntax.

1. The syntax inside translatable content should be easy to understand for humans. This includes making it clear which parts of the message body _are_ translatable content, which parts inside it are placeholders, as well as making the selection logic predictable and easy to reason about.

    * _Non-Goal_: Make the syntax intuitive enough for non-technical translators to hand-edit. Instead, we assume that most translators will work with MessageFormat 2.0 by means of GUI tooling, CAT workbenches etc.

1. The syntax surrounding translatable content should be easy to write and edit for developers, localization engineers, and easy to parse by machines.

1. The syntax should make a single message easily embeddable inside many container formats: `.properties`, YAML, XML, inlined as string literals in programming languages, etc. This includes a future _MessageResource_ specification.

### Design Restrictions

The syntax specification takes into account the following design restrictions:

1. Whitespace outside the translatable content should be insignificant. It should be possible to define a message entirely on a single line with no ambiguitiy, as well as to format it over multiple lines for clarity.

1. The syntax should not use nor reserve any keywords in any natural language, such as `if`, `match`, or `let`.

1. The syntax should define as few special characters and sigils as possible.

## Overview & Examples

### Simple Messages

A simple message without any variables:

    [Hello, world!]

The same message defined in a `.properties` file:

```properties
app.greetings.hello = [Hello, world!]
```

The same message defined inline in JavaScript:

```js
let hello = new MessageFormat("[Hello, world!]");
hello.format();
```

### Simple Placeholders

A message with an interpolated variable:

    [Hello, {$userName}!]

The same message defined in a `.properties` file:

```properties
app.greetings.hello = [Hello, {$userName}!]
```

The same message defined inline in JavaScript:

```js
let hello = new MessageFormat("[Hello, {$userName}!]");
hello.format({userName: "Anne"});
```

### Formatting Functions

A message with an interpolated `$date` variable formatted with a custom `datetime` function:

    [Today is {$date datetime weekday:long}]

A message with an interpolated `$userName` variable formatted with a custom `name` function capable of declension (using either a fixed dictionary, algorithmic declension, ML, etc.):

    [Hello, {$userName name case:vocative}!]

A message with an interpolated `$userObj` variable formatted with a custom `name` function capable of plucking the first name from the object representing a person:

    [Hello, {$userObj name first:full}!]

### Aliases

A message defining a `$whom` alias which is then used twice inside the pattern:

    $whom = {$monster noun case:accusative}
    [You see {$quality adjective article:indefinite accord:$whom} {$whom}!]

### Selection

A message with a single selector:

    {$count plural}? 
        one [$You have one notification.]
        other [$You have {$count} notification.]

A message with a single selector which is an invocation of a custom function named `platform`, formatted on a single line:

    {platform}? windows [Settings] _ [Preferences]

A message with a single selector and a custom `hasCase` function which allows the message to query for presence of grammatical cases required for each variant:

    {$userName hasCase}?
        vocative [Hello, {$userName name case:vocative}!]
        accusative [Please welcome {$userName name case:accusative}!]
        _ [Hello!]

A message with two selectors:

    {$photoCount plural}? {$userGender}?
        one masculine [{$userName} added a new photo to his album.]
        one feminine [{$userName} added a new photo to her album.]
        one other [{$userName} added a new photo to their album.]
        other masculine [{$userName} added {$photoCount} photos to his album.]
        other feminine [{$userName} added {$photoCount} photos to her album.]
        other other [{$userName} added {$photoCount} photos to their album.]

A message defining two aliases: `$itemAcc` and `$countInt`, and using `$countInt` as a selector:

    $itemAcc = {$item noun count:$count case:accusative}
    $countInt = {$count number maxFractionDigits:0}?
        one [You bought {$color adj article:indefinite accord:$itemAcc} {$itemAcc}.]
        other [You bought {$countInt} {$color adj accord:$itemAcc} {$itemAcc}.]

### Complex Messages

A complex message with 2 selectors and 3 local variable definitions:

    /* The host's first name. */
    $hostName = {$host name first:full}
    /* The first guest's first name. */
    $guestName = {$guest name first:full}
    /* The number of guests excluding the first guest. */
    $guestsOther = {$guestCount number /* Remove 1 from $guestCount */ offset:1}

    {$host gender}? {$guestCount number}?
        /* The host is female. */
        female 0 [{$hostName} does not give a party.]
        female 1 [{$hostName} invites {$guestName} to her party.]
        female 2 [{$hostName} invites {$guestName} and one other person to her party.]
        female [{$hostName} invites {$guestName} and {$guestsOther} other people to her party.]

        /* The host is male. */
        male 0 [{$hostName} does not give a party.]
        male 1 [{$hostName} invites {$guestName} to his party.]
        male 2 [{$hostName} invites {$guestName} and one other person to his party.]
        male [{$hostName} invites {$guestName} and {$guestsOther} other people to his party.]

        other 0 [{$hostName} does not give a party.]
        other 1 [{$hostName} invites {$guestName} to their party.]
        other 2 [{$hostName} invites {$guestName} and one other person to their party.]
        other [{$hostName} invites {$guestName} and {$guestsOther} other people to their party.]

## Comparison with ICU MessageFormat 1.0

MessageFormat 2.0 improves upon the ICU MessageFormat 1.0 syntax through the following changes:

1. In MessageFormat 2.0, variants can only be defined at the top level of the message, thus precluding any possible nestedness of expressions.

    ICU MessageFormat 1.0:
    ```
    {foo, func,
        foo1 {Value 1},
        foo2 {
            {bar, func,
                bar1 {Value 2a}
                bar2 {Value 2b}}}}
    ```

    MessageFormat 2.0:
    ```
    {$foo func}?
    {$bar func}?
        foo1 [Value 1]
        foo2 bar1 [Value 2a]
        foo2 bar2 [Value 2b]
    ```

1. MessageFormat 2.0 differentiates between the syntax used to introduce expressions (`{...}`) and the syntax used to defined translatable content (`[...]`).

1. MessageFormat 2.0 uses the dollar sign (`$`) as the sigil for variable references, and only allows named options to functions. The purpose of this change is to help disambiguate between the different parts of a placeholder (variable references, function names, literals etc.).

    ICU MessageFormat 1.0:
    ```
    {when, date, short}
    ```

    MessageFormat 2.0:
    ```
    {$when date style:short}
    ```

1. MessageFormat 2.0 doesn't provide the `#` shorthand inside variants. Instead it allows aliases to be defined at the top of the message; these aliases can then be referred to inside patterns similar to other variables.

1. MessageFormat 2.0 doesn't require commas (`,`) inside placeholders.

## Productions

### Message

A single message consists of zero of more _declarations_ and at least one _variant_.

```
Message ::= Declaration* Variant+
```

### Declarations

A declaration is an _expression_ specified at the beginning of the message. It may be bound to an _alias_ which can then be used in other expressions.

When followed by `?`, a declaration is also a selector which will be used during formatting to select an appropriate variant of the message.

```
Declaration ::= Alias? '{' Expression '}' '?'?
Alias ::= Variable '='
```

Examples:

```
{$userGender}?
```

```
{$count plural}?
```

```
$itemAccusative = {$item noun case:accusative}
```


### Variants & Patterns

A message must include at least one _variant_. The translatable content of a variant is called a _pattern_. Patterns are always delimited with `[` at the start, and `]` at the end. This serves 3 purposes:

* The message should be unambiguously embeddable in various container formats regardless of the container's whitespace trimming rules. E.g. in Java `.properties` files, `hello = [Hello]` will unambiguously define the `Hello` message without the space in front of it.
* The message should be conveniently embeddable in various programming languages without the need to escape characters commonly related to strings, e.g. `"` and `'`. Such need may still occur when a singe or double quote is used in the translatable content or to delimit a string literal.
* The syntax should make it as clear as possible which parts of the message body are translatable and which ones are part of the formatting logic definition.

Variants can be optionally keyed; during formatting their keys will be matched against the message's selectors. The formatting specification defines which variant is chosen by comparing its keys to the message's selectors, including the situation when no keys or no selectors are defined.

```
Variant ::= VariantKey* Pattern
VariantKey ::= Symbol | Literal
Pattern ::= '[' (Text | Placeable)* ']' /* ws: explicit */
Placeable ::= '{' Expression '}'
```

Examples:

```
[Hello, world!]
```

```
key [Hello, world!]
```

```
key 0 [Hello, world!]
```

### Expressions

Expressions can be either of the following productions:

- _Format calls_ start with a literal or a variable name, optionally followed by the formatting function and its named options. Formatting functions do not accept any positional arguments other than the argument in front of them.
- _Function calls_ are standalone invocations which start with the function's name optionally followed by its named options. Functions do not accept any positional arguments.

```
Expression ::= FormatCall | FunctionCall
FormatCall ::= (Literal | Variable) FunctionCall?
FunctionCall ::= Symbol Option*
Option ::= Symbol ':' (Symbol | Literal | Variable)
```

Examples:

```
1.23 number maxFractionDigits:1
```

```
"1970-01-01T13:37:00.000Z" datetime weekday:long
```

```
$when datetime style:long
```

```
ref msgid:some_other_message
```

## Tokens

The grammar defines the following tokens for the purpose of the lexical analysis.

### Names

A _symbol_ is a versatile token used in variable names (prefixed with `$`), function names, option names, and commonly as option values and variant keys.

The symbol's definition is based on XML's [Name](https://www.w3.org/TR/xml/#NT-Name) to maximally align it with [NMTOKEN](https://www.w3.org/TR/xml/#NT-Nmtoken) which is used throughout the grammatical feature data [specified in LDML](https://unicode.org/reports/tr35/tr35-general.html#Grammatical_Features) and [defined in CLDR](https://unicode-org.github.io/cldr-staging/charts/latest/grammar/index.html). The only difference between a symbol and XML Name is that symbols must not contain `:`.

```
Variable ::= '$' Symbol /* ws: explicit */
Symbol ::= SymbolStart SymbolChar* /* ws: explicit */
SymbolStart ::= [a-zA-Z] | "_"
               | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF]
               | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D]
               | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF]
               | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
SymbolChar ::= SymbolStart | DecimalDigit | "-" | "." | #xB7
             | [#x0300-#x036F] | [#x203F-#x2040]
```

### Text

Text is the translatable content of a _pattern_. Any Unicode codepoint is allowed in text, with the exception of `]` (which ends the pattern), `{` (which starts a placeholder), and `\` (which starts an escape sequence).

```
Text ::= (TextChar | TextEscape)+ /* ws: explicit */
TextChar ::= AnyChar - (']' | '{' | Esc)
AnyChar ::= .
```

### Literals

Any Unicode codepoint is allowed in string literals, with the exception of `"` (which ends the string literal, and `\` (which starts an escape sequence).

```
Literal ::= String | Number /* ws: explicit */
String ::= '"' (StringChar | StringEscape)* '"' /* ws: explicit */
Number ::= '-'? DecimalDigit+ ('.' DecimalDigit+)? /* ws: explicit */
StringChar ::= AnyChar - ('"' | Esc)
DecimalDigit ::= [0-9]
```

### Escape Sequences

Escape sequences are introduced by the backslash character (`\`). They are allowed in translatable text as well as in string literals.

```
Esc ::= #x5c
TextEscape ::= Esc ']' | Esc '{' | UnicodeEscape
StringEscape ::= Esc '"' | UnicodeEscape
UnicodeEscape ::= Esc 'u' HexDigit HexDigit HexDigit HexDigit
                | Esc 'U' HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit
HexDigit ::= [0-9a-fA-F]
```

### Comments

Comments are delimited with `/*` at the start, and `*/` at the end, and can contain any Unicode codepoint including line breaks. Comments can only appear outside translatable text.

```
Comment ::= '/*' (AnyChar* - (AnyChar* '*/' AnyChar*)) '*/'
```

### Whitespace

Whitespace is defined as tab, carriage return, line feed, or the space character.

Inside patterns, whitespace is part of the translatable content and is recorded and stored verbatim. Outside translatable text, whitespace is not significant, unless it's required to differentiate between two literals.

```
WhiteSpace ::= #x9 | #xD | #xA | #x20
```

## Complete EBNF

The following EBNF uses the [W3C flavor](https://www.w3.org/TR/xml/#sec-notation) of the BNF notation. The grammar is an LL(1) grammar without backtracking.

```ebnf
Message ::= Declaration* Variant+

/* Aliases and selectors */
Declaration ::= Alias? '{' Expression '}' '?'?
Alias ::= Variable '='

/* Pattern and pattern elements */
Variant ::= VariantKey* Pattern
VariantKey ::= Symbol | Literal
Pattern ::= '[' (Text | Placeable)* ']' /* ws: explicit */
Placeable ::= '{' Expression '}'

/* Expressions */
Expression ::= FormatCall | FunctionCall
FormatCall ::= (Literal | Variable) FunctionCall?
FunctionCall ::= Symbol Option*
Option ::= Symbol ':' (Symbol | Literal | Variable)

/* Ignored tokens */
Ignore ::= Comment | WhiteSpace /* ws: definition */

<?TOKENS?>

/* Names */
Variable ::= '$' Symbol /* ws: explicit */
Symbol ::= SymbolStart SymbolChar* /* ws: explicit */
SymbolStart ::= [a-zA-Z] | "_"
               | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF]
               | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D]
               | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF]
               | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
SymbolChar ::= SymbolStart | DecimalDigit | "-" | "." | #xB7
             | [#x0300-#x036F] | [#x203F-#x2040]

/* Text */
Text ::= (TextChar | TextEscape)+
TextChar ::= AnyChar - (']' | '{' | Esc)
AnyChar ::= .

/* Literals */
Literal ::= String | Number /* ws: explicit */
String ::= '"' (StringChar | StringEscape)* '"' /* ws: explicit */
Number ::= '-'? DecimalDigit+ ('.' DecimalDigit+)? /* ws: explicit */
StringChar ::= AnyChar - ('"'| Esc)
DecimalDigit ::= [0-9]

/* Escape sequences */
Esc ::= '\'
TextEscape ::= Esc ']' | Esc '{' | UnicodeEscape
StringEscape ::= Esc '"' | UnicodeEscape
UnicodeEscape ::= Esc 'u' HexDigit HexDigit HexDigit HexDigit
                | Esc 'U' HexDigit HexDigit HexDigit HexDigit HexDigit HexDigit
HexDigit ::= [0-9a-fA-F]

/* Comments */
Comment ::= '/*' (AnyChar* - (AnyChar* '*/' AnyChar*)) '*/'

/* WhiteSpace */
WhiteSpace ::= #x9 | #xD | #xA | #x20
```