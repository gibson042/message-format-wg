# MessageFormat 2.0 Errors

Errors can occur during the processing of a _message_.
Some errors can be detected statically, 
such as those due to problems with _message_ syntax,
violations of requirements in the data model,
or requirements defined by a _function_.
Other errors might be detected during selection or formatting of a given _message_.
Where available, the use of validation tools is recommended,
as early detection of errors makes their correction easier.

## Error Handling

_Syntax Errors_ and _Data Model Errors_ apply to all message processors,
and MUST be emitted as soon as possible.
The other error categories are only emitted during formatting,
but it might be possible to detect them with validation tools.

During selection, an _expression_ handler MUST only emit _Resolution Errors_ and _Selection Errors_.
During formatting, an _expression_ handler MUST only emit _Resolution Errors_ and _Formatting Errors_.

_Resolution Errors_ and _Formatting Errors_ in _expressions_ that are not used
in _pattern selection_ or _formatting_ MAY be ignored,
as they do not affect the output of the formatter.

In all cases, when encountering a runtime error,
a message formatter MUST provide some representation of the message.
An informative error or errors MUST also be separately provided.

When a message contains more than one error,
or contains some error which leads to further errors,
an implementation which does not emit all of the errors
SHOULD prioritise _Syntax Errors_ and _Data Model Errors_ over others.

When an error occurs within a _selector_,
the _selector_ MUST NOT match any _variant_ _key_ other than the catch-all `*`
and a _Resolution Error_ or a _Selection Error_ MUST be emitted.

## Syntax Errors

**_<dfn>Syntax Errors</dfn>_** occur when the syntax representation of a message is not well-formed.

> Example invalid messages resulting in a _Syntax Error_:
>
> ```
> {{Missing end braces
> ```
>
> ```
> {{Missing one end brace}
> ```
>
> ```
> Unknown {{expression}}
> ```
>
> ```
> .local $var = {|no message body|}
> ```

## Data Model Errors

**_<dfn>Data Model Errors</dfn>_** occur when a message is invalid due to
violating one of the semantic requirements on its structure.

### Variant Key Mismatch

A **_<dfn>Variant Key Mismatch</dfn>_** occurs when the number of keys on a _variant_
does not equal the number of _selectors_.

> Example invalid messages resulting in a _Variant Key Mismatch_ error:
>
> ```
> .match {$one :func}
> 1 2 {{Too many}}
> * {{Otherwise}}
> ```
>
> ```
> .match {$one :func} {$two :func}
> 1 2 {{Two keys}}
> * {{Missing a key}}
> * * {{Otherwise}}
> ```

### Missing Fallback Variant

A **_<dfn>Missing Fallback Variant</dfn>_** error occurs when the message
does not include a _variant_ with only catch-all keys.

> Example invalid messages resulting in a _Missing Fallback Variant_ error:
>
> ```
> .match {$one :func}
> 1 {{Value is one}}
> 2 {{Value is two}}
> ```
>
> ```
> .match {$one :func} {$two :func}
> 1 * {{First is one}}
> * 1 {{Second is one}}
> ```

### Missing Selector Annotation

A **_<dfn>Missing Selector Annotation</dfn>_** error occurs when the _message_
contains a _selector_ that does not have an _annotation_,
or contains a _variable_ that does not directly or indirectly reference a _declaration_ with an _annotation_.

> Examples of invalid messages resulting in a _Missing Selector Annotation_ error:
>
> ```
> .match {$one}
> 1 {{Value is one}}
> * {{Value is not one}}
> ```
>
> ```
> .local $one = {|The one|}
> .match {$one}
> 1 {{Value is one}}
> * {{Value is not one}}
> ```
>
> ```
> .input {$one}
> .match {$one}
> 1 {{Value is one}}
> * {{Value is not one}}
> ```

### Duplicate Declaration

A **_<dfn>Duplicate Declaration</dfn>_** error occurs when a _variable_ is declared more than once.
Note that an input _variable_ is implicitly declared when it is first used,
so explicitly declaring it after such use is also an error.

> Examples of invalid messages resulting in a _Duplicate Declaration_ error:
>
> ```
> .input {$var :number maximumFractionDigits=0}
> .input {$var :number minimumFractionDigits=0}
> {{Redeclaration of the same variable}}
>
> .local $var = {$ext :number maximumFractionDigits=0}
> .input {$var :number minimumFractionDigits=0}
> {{Redeclaration of a local variable}}
>
> .input {$var :number minimumFractionDigits=0}
> .local $var = {$ext :number maximumFractionDigits=0}
> {{Redeclaration of an input variable}}
>
> .input {$var :number minimumFractionDigits=$var2}
> .input {$var2 :number}
> {{Redeclaration of the implicit input variable $var2}}
>
> .local $var = {$ext :someFunction}
> .local $var = {$error}
> .local $var2 = {$var2 :error}
> {{{$var} cannot be redefined. {$var2} cannot refer to itself}}
> ```

### Duplicate Option Name

A **_<dfn>Duplicate Option Name</dfn>_** error occurs when the same _identifier_
appears on the left-hand side of more than one _option_ in the same _expression_.

> Examples of invalid messages resulting in a _Duplicate Option Name_ error:
>
> ```
> Value is {42 :number style=percent style=decimal}
> ```
>
> ```
> .local $foo = {horse :func one=1 two=2 one=1}
> {{This is {$foo}}}
> ```

## Resolution Errors

**_<dfn>Resolution Errors</dfn>_** occur when the runtime value of a part of a message
cannot be determined.

### Unresolved Variable

An **_<dfn>Unresolved Variable</dfn>_** error occurs when a variable reference cannot be resolved.

> For example, attempting to format either of the following messages
> would result in an _Unresolved Variable_ error if done within a context that
> does not provide for the variable reference `$var` to be successfully resolved:
>
> ```
> The value is {$var}.
> ```
>
> ```
> .match {$var :func}
> 1 {{The value is one.}}
> * {{The value is not one.}}
> ```

### Unknown Function

An **_<dfn>Unknown Function</dfn>_** error occurs when an _expression_ includes
a reference to a function which cannot be resolved.

> For example, attempting to format either of the following messages
> would result in an _Unknown Function_ error if done within a context that
> does not provide for the function `:func` to be successfully resolved:
>
> ```
> The value is {horse :func}.
> ```
>
> ```
> .match {|horse| :func}
> 1 {{The value is one.}}
> * {{The value is not one.}}
> ```

### Unsupported Expression

An **_<dfn>Unsupported Expression</dfn>_** error occurs when an expression uses
syntax reserved for future standardization,
or for private implementation use that is not supported by the current implementation.

> For example, attempting to format this message
> would always result in an _Unsupported Expression_ error:
>
> ```
> The value is {!horse}.
> ```
>
> Attempting to format this message would result in an _Unsupported Expression_ error
> if done within a context that does not support the `^` private use sigil:
>
> ```
> .match {|horse| ^private}
> 1 {{The value is one.}}
> * {{The value is not one.}}
> ```

### Invalid Expression

An **_<dfn>Invalid Expression</dfn>_** error occurs when a _message_ includes an _expression_
whose implementation-defined internal requirements produce an error during _function resolution_
or when a _function_ returns a value (such as `null`) that the implementation does not support.

An **_<dfn>Operand Mismatch Error</dfn>_** is an _Invalid Expression_ error that occurs when
an _operand_ provided to a _function_ during _function resolution_ does not match one of the
expected implementation-defined types for that function;
or in which a literal _operand_ value does not have the required format
and thus cannot be processed into one of the expected implementation-defined types
for that specific _function_.

> For example, the following _message_ produces an _Operand Mismatch Error_
> (a type of _Invalid Expression_ error)
> because the literal `|horse|` does not match the production `number-literal`,
> which is a requirement of the function `:number` for its operand:
> ```
> .local $horse = {horse :number}
> {{You have a {$horse}.}}
> ```
> The following _message_ might produce an _Invalid Expression_ error if the
> the function `:function` threw an exception or otherwise emitted an error
> rather than returning a valid value:
>```
> {{This has an invalid expression {$var :function} because it has a bug in it.}}
>```

### Unsupported Statement

An **_<dfn>Unsupported Statement</dfn>_** error occurs when a message includes a _reserved statement_.

> For example, attempting to format this message
> would always result in an _Unsupported Statement_ error:
>
> ```
> .some {|horse|}
> {{The message body}}
> ```

## Selection Errors

**_<dfn>Selection Errors</dfn>_** occur when message selection fails.

> For example, attempting to format either of the following messages
> might result in a _Selection Error_ if done within a context that
> uses a `:number` selector function which requires its input to be numeric:
>
> ```
> .match {|horse| :number}
> 1 {{The value is one.}}
> * {{The value is not one.}}
> ```
>
> ```
> .local $sel = {|horse| :number}
> .match {$sel}
> 1 {{The value is one.}}
> * {{The value is not one.}}
> ```

## Formatting Errors

**_<dfn>Formatting Errors</dfn>_** occur during the formatting of a resolved value,
for example when encountering a value with an unsupported type
or an internally inconsistent set of options.

> For example, attempting to format any of the following messages
> might result in a _Formatting Error_ if done within a context that
>
> 1. provides for the variable reference `$user` to resolve to
>    an object `{ name: 'Kat', id: 1234 }`,
> 2. provides for the variable reference `$field` to resolve to
>    a string `'address'`, and
> 3. uses a `:get` formatting function which requires its argument to be an object and
>    an option `field` to be provided with a string value,
>
> ```
> Hello, {horse :get field=name}!
> ```
>
> ```
> Hello, {$user :get}!
> ```
>
> ```
> .local $id = {$user :get field=id}
> {{Hello, {$id :get field=name}!}}
> ```
>
> ```
> Your {$field} is {$id :get field=$field}
> ```

