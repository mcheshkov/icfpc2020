#[derive(Debug)]
enum Token<'a> {
    Operand(&'a str),
    Apply(),
}

impl<'token> Token<'token> {
    fn parse_next<'s, 'a>(stream: &'s [Token<'a>]) -> Option<(Action<'a>, &'s [Token<'a>])> {
        stream.split_first().map(|(token, rest)| match token {
            Token::Operand(val) => (Action::Value(val), rest),
            Token::Apply() => {
                let (first, rest) =
                    Token::parse_next(rest).expect("Could not parse first argument for ap");
                let (second, rest) =
                    Token::parse_next(rest).expect("Could not parse second argument for ap");
                (Action::Application(Box::new(first), Box::new(second)), rest)
            }
        })
    }
}

#[derive(Debug)]
enum Action<'a> {
    Value(&'a str),
    Application(Box<Action<'a>>, Box<Action<'a>>),
}

impl<'a> Action<'a> {
    fn to_string(&self) -> String {
        match self {
            Self::Value(s) => String::from(*s),
            Self::Application(func, operand) => {
                format!("{}({})", func.to_string(), operand.to_string())
            }
        }
    }

    fn to_math(&self) -> MathAction {
        match self {
            Self::Value(s) => MathAction::Value(*s),
            Self::Application(func, operand) => {
                let mut tmp = func.to_math();
                match tmp {
                    MathAction::Value(_) => {
                        MathAction::Call(Box::new(tmp), vec![operand.to_math()])
                    }
                    MathAction::Call(func, mut args) => {
                        args.push(operand.to_math());
                        MathAction::Call(func, args)
                    }
                    _ => unreachable!("should only be basic items"),
                }
            }
        }
    }
}

#[derive(Debug, Eq, PartialEq)]
enum MathAction<'a> {
    Value(&'a str),
    Call(Box<MathAction<'a>>, Vec<MathAction<'a>>),
    List(Vec<MathAction<'a>>),
}

impl<'a> MathAction<'a> {
    fn combine_lists(self) -> MathAction<'a> {
        match self {
            Self::Call(val, mut args) if *val == MathAction::Value("cons") && args.len() == 2 => {
                let second = args.pop().unwrap();
                let first = args.pop().unwrap();
                let second_list_possibly = second.combine_lists();
                match second_list_possibly {
                    MathAction::List(mut items) => {
                        items.insert(0, first);
                        MathAction::List(items)
                    }
                    MathAction::Value("nil") => MathAction::List(vec![first]),
                    _ => MathAction::Call(
                        Box::new(MathAction::Value("cons")),
                        vec![first, second_list_possibly],
                    ),
                }
            }
            _ => self,
        }
    }
}

// fn main() -> () {
//     // let mut args: Vec<String> = env::args().collect();
//     // let str = args.pop().expect("Need first argument");
//
//     // let tmp = "pwr2   =   ap ap s ap ap c ap eq 0 1 ap ap b ap mul 2 ap ap b pwr2 ap add -1";
//     let tmp = ":1029 = ap ap cons 7 ap ap cons 123229502148636 nil";
//     let test: Vec<Token> = tmp.split_ascii_whitespace()
//         .map(|x| {
//             match x {
//                 "ap" => Token::Apply(),
//                 _ => Token::Operand(x),
//             }
//         })
//         .collect();
//     let mut actions: Vec<Action> = vec![];
//     let mut stream = test.as_slice();
//     loop {
//         let next = Token::parse_next(stream);
//         match next {
//             Some((action, str)) => {
//                 stream = str;
//                 actions.push(action);
//             }
//             None => break
//         }
//     }
//
//     for a in actions {
//         let m = a.to_math();
//         println!("{:?}", m);
//         println!("{:?}", m.combine_lists());
//     }
// }
