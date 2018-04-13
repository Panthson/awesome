{
    function onlyUnique(value, index, self) { 
        return self.indexOf(value) === index;
    }
}

start = ws* pl:pair_list ws* { return pl; }

pair_list = 
	p:pair ws+ pl:pair_list {
    var col_name = Object.keys(p)[0];
    if(pl[col_name]){
      pl[col_name] = "(" + p[col_name] + " OR " + pl[col_name] + ")";
    }else{
      pl[col_name] = p[col_name];
    }
    return pl;
  }
  / p:pair { 
    return p;
  };

pair = 
	col_name:field ws* colon ws* term_list:term_list{ 
    var o = {};
    o[col_name] = term_list;
    return o;
  }
  / date:date{ return { _date: date }; }
  / term_list:term_list { return {_text : term_list}; }

field = field_chars:[0-9a-zA-Z_.]+{ return field_chars.join(''); }

term_list = 
	L_PAREN term_list:term_list R_PAREN { return '(' + term_list + ')'; }
  / L_PAREN term (ws+ term_list)* R_PAREN
  / term ws* OR ws* term_list
  / term ws* AND ws* term_list
  / t:term { return t; }

term = 
  proximity 
  / range 
  / chars:word { 
      if(typeof(chars) === 'string')
        return chars; 
      return chars.join(''); 
    } 
  / phrase 
  / NOT ws* term 
  / PLUS ws* term

proximity = doublequote nonspace_character+ ws+ nonspace_character+ doublequote tilde int

phrase = doublequote text:(doublequote_character*) doublequote { return '"' + text.join('') + '"'; }

doublequote_character =
  (!doublequote) c:character { return c; }
  / "!"

range = inclusive_range / exclusive_range

inclusive_range = L_BRACK nonspace_character+ ws+ TO ws+ nonspace_character+ R_BRACK
exclusive_range = L_BRACE nonspace_character+ ws+ TO ws+ nonspace_character+ R_BRACE

word = 
	OR c:nonspace_character+ { return "OR" + c.join(''); }
  / "O" c:not_R_space_character* { return "O" + c.join(''); }
  / AND c:nonspace_character+ { return "AND" + c.join(''); }
  / "AN" c:not_D_space_character+ { return "AN" + c.join(''); }
  / "AN"
  / "A" c:not_N_space_character d:nonspace_character* { return "A" + c + d.join(''); }
  / "A" 
  / "NOT" c:nonspace_character+ { return "NOT" + c.join(''); }
  / c:non_boolean_starter d:nonspace_character* { return c + d.join(''); }
  / c:escape_sequence d:nonspace_character* { return c + d.join(''); }

date = month:month "/" day:day "/" year:year { return month + "/" + day.join('') + "/" + year.join(''); }
month = "0" d:DIGIT { return "0" + d } / "10" / "11" / "12"
day = "0" [1-9] / "1" DIGIT / "2" DIGIT / "30" { return ["3", "0"]; } / "31" { return ["3", "1"]; }
year = "1" DIGIT DIGIT DIGIT / "2" DIGIT DIGIT DIGIT

// \x21 -> !
// \x26 -> &
// \x28 -> (
// \x29 -> )
// \x2B -> +
// \x2D -> -
// \x41 -> A
// \x44 -> D
// \x4E -> N
// \x4F -> O
// \x52 -> R
// \x5C -> \

nonspace_character = nonspace_unescaped / escape_sequence
not_D_space_character = [\x21\x23-\x43\x45-\x5B\x5D-\u10FFFF]
not_N_space_character = [\x21\x23-\x4D\x4F-\x5B\x5D-\u10FFFF]
not_R_space_character = [\x21\x23-\x51\x53-\x5B\x5D-\u10FFFF] 
non_boolean_starter = [\x23-\x25\x27\x2A\x2C\x2E-\x40\x42-\x4E\x50-\x5B\x5D-\u10FFFF]

OR = "OR"
AND = "AND" / "&&"
NOT = "!" / "NOT" / "-"
PLUS = "+"
TO = "TO"
L_BRACK = "[" ws*
R_BRACK = ws* "]"
L_BRACE = "{" ws*
R_BRACE = ws* "}"
L_PAREN = "("
R_PAREN = ")"

int = zero / (digit1_9 DIGIT*)
zero = "0"
digit1_9 = [1-9]
DIGIT = [0-9]

unescaped = '\x20' / nonspace_unescaped
nonspace_unescaped = [\x23-\x25\x27\x2A\x2C\x2E-\x5B\x5D-\u10FFFF] //any changes should also be reflected up
escape_character = "\\"
doublequote "double quote" = '"'
singlequote "single quote" = "'"
colon = ":"
tilde = "~"
HEXDIG = [0-9a-f]i

variable = $([0-9a-zA-Z_\$]+)

character =
  unescaped / escape_sequence

escape_sequence "escape sequence" = escape_character sequence:(
     doublequote
   / singlequote
   / "\\"
   / "/"
   / "-"
   / "&"
   / "!"
   / "b" { return "\b"; }
   / "f" { return "\f"; }
   / "n" { return "\n"; }
   / "r" { return "\r"; }
   / "t" { return "\t"; }
   / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
       return String.fromCharCode(parseInt(digits, 16));
     }
  )
  { return sequence; }

ws "whitespace" = [ \t]+

/*

term_group = 
	term
	/ (term ( term) +)

*/