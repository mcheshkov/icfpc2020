#[derive(Debug)]
enum Token<'a> {
    Operand(&'a str),
    Apply(),
}

impl<'token> Token<'token> {
    fn parse_next<'s, 'a>(stream: &'s [Token<'a>]) -> Option<(Action<'a>, &'s [Token<'a>])> {
        stream.split_first().map(|(token, rest)| match token {
            Token::Operand(val) => {
                let v = if let Ok(num) = i64::from_str_radix(val, 10) {
                    Action::Number(num)
                } else {
                    Action::Value(val)
                };
                (v, rest)
            }
            Token::Apply() => {
                let (first, rest) =
                    Token::parse_next(rest).expect("Could not parse first argument for ap");
                let (second, rest) =
                    Token::parse_next(rest).expect("Could not parse second argument for ap");
                (
                    Action::SingleArgApplication(Box::new(first), Box::new(second)),
                    rest,
                )
            }
        })
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Ord, PartialOrd)]
pub enum Action<'a> {
    Value(&'a str),
    Number(i64),
    SingleArgApplication(Box<Action<'a>>, Box<Action<'a>>),
    MultipleArgApplication(Box<Action<'a>>, Vec<Action<'a>>),
    List(Vec<Action<'a>>),
}

impl<'a> Action<'a> {
    pub fn parse(stream: &str) -> Vec<Action> {
        let test: Vec<Token> = stream
            .split_ascii_whitespace()
            .map(|x| match x {
                "ap" => Token::Apply(),
                _ => Token::Operand(x),
            })
            .collect();

        let mut actions: Vec<Action> = vec![];
        let mut stream = test.as_slice();
        loop {
            let next = Token::parse_next(stream);
            match next {
                Some((action, str)) => {
                    stream = str;
                    actions.push(action);
                }
                None => break,
            }
        }
        actions
    }

    pub fn to_string(&self) -> String {
        match self {
            Self::Value(s) => String::from(*s),
            Self::Number(val) => val.to_string(),
            Self::SingleArgApplication(func, operand) => {
                format!("{}({})", func.to_string(), operand.to_string())
            }
            Self::MultipleArgApplication(func, operands) => format!(
                "{}({})",
                func.to_string(),
                operands
                    .iter()
                    .map(|o| o.to_string())
                    .collect::<Vec<String>>()
                    .join(",")
            ),
            Self::List(items) => format!(
                "[{}]",
                items
                    .iter()
                    .map(|o| o.to_string())
                    .collect::<Vec<String>>()
                    .join(",")
            ),
        }
    }

    fn recursive_apply_no_leafs<F: FnMut(Self) -> (Self, bool)>(self, mut func: F) -> (Self, bool) {
        let mut something_changed = false;
        let res = {
            let mut extract = Self::account_changed(&mut something_changed);
            match self {
                Self::Number(_) | Self::Value(_) => self,
                Self::SingleArgApplication(f, args) => {
                    Self::application(extract(func(*f)), extract(func(*args)))
                }
                Self::MultipleArgApplication(f, args) => Self::multi_application(
                    extract(func(*f)),
                    args.into_iter().map(|a| extract(func(a))).collect(),
                ),
                Self::List(items) => {
                    Self::List(items.into_iter().map(|i| extract(func(i))).collect())
                }
            }
        };
        (res, something_changed.clone())
    }

    pub fn account_changed<'b>(changed: &'b mut bool) -> impl FnMut((Action, bool)) -> Action + 'b {
        return move |res| {
            let (action, step_changed) = res;
            *changed = *changed || step_changed;
            action
        };
    }

    pub fn reduce_args(self) -> (Action<'a>, bool) {
        let mut something_changed = false;
        let res = {
            let mut extract = Self::account_changed(&mut something_changed);
            match self {
                Self::SingleArgApplication(func, operand) => {
                    let first_reduced = extract(func.reduce_args());
                    match first_reduced {
                        Action::Value(_) | Action::List(_) | Action::Number(_) => {
                            Action::multi_application(
                                first_reduced,
                                vec![extract(operand.reduce_args())],
                            )
                        }
                        Action::MultipleArgApplication(func, mut args) => {
                            args.push(extract(operand.reduce_args()));
                            Action::multi_application(extract(func.reduce_args()), args)
                        }
                        Action::SingleArgApplication(_, _) => {
                            unreachable!("cannot be SingleArgApplication")
                        }
                    }
                }
                Self::MultipleArgApplication(func, operands) => {
                    let first_reduced = extract(func.reduce_args());
                    match first_reduced {
                        Action::Value(_) | Action::List(_) | Action::Number(_) => {
                            Action::multi_application(
                                first_reduced,
                                operands
                                    .into_iter()
                                    .map(|o| extract(o.reduce_args()))
                                    .collect(),
                            )
                        }
                        Action::MultipleArgApplication(func, mut other_operands) => {
                            other_operands
                                .extend(operands.into_iter().map(|o| extract(o.reduce_args())));
                            Action::multi_application(extract(func.reduce_args()), other_operands)
                        }
                        Action::SingleArgApplication(_, _) => {
                            unreachable!("cannot be SingleArgApplication")
                        }
                    }
                }
                _ => extract(self.recursive_apply_no_leafs(Self::reduce_args)),
            }
        };
        (res, something_changed)
    }

    pub fn reduce_lists(self) -> (Action<'a>, bool) {
        let mut something_changed = false;
        let res = {
            let mut extract = Self::account_changed(&mut something_changed);
            match self {
                Self::MultipleArgApplication(val, mut args)
                    if *val == Self::Value("cons") && args.len() == 2 =>
                {
                    let second = args.pop().unwrap();
                    let first = args.pop().unwrap();
                    let second_list_possibly = extract(second.reduce_lists());
                    match second_list_possibly {
                        Self::List(mut items) => {
                            items.insert(0, first);
                            Self::List(items)
                        }
                        Self::Value("nil") => Self::List(vec![first]),
                        _ => Self::multi_application(
                            Self::Value("cons"),
                            vec![first, second_list_possibly],
                        ),
                    }
                }
                _ => self,
            }
        };
        (res, something_changed)
    }

    fn apply_combinator<F: FnMut(Self, Self, Self) -> Self, E: FnMut((Self, bool)) -> Self>(
        operands: Vec<Self>,
        mut combinator: F,
        mut extract: E,
    ) -> Action<'a> {
        let mut it = operands.into_iter().map(|i| extract(i.reduce_calls()));
        let first = it.next().unwrap();
        let second = it.next().unwrap();
        let third = it.next().unwrap();
        let rest: Vec<Action> = it.collect();
        return Self::multi_application(combinator(first, second, third), rest);
    }

    fn s_combinator<'b>(a: Action<'b>, b: Action<'b>, c: Action<'b>) -> Action<'b> {
        Self::application(Self::application(a, c.clone()), Self::application(b, c))
    }

    fn c_combinator<'b>(a: Action<'b>, b: Action<'b>, c: Action<'b>) -> Action<'b> {
        Self::application(Self::application(a, c), b)
    }

    fn b_combinator<'b>(a: Action<'b>, b: Action<'b>, c: Action<'b>) -> Action<'b> {
        Self::application(a, Self::application(b, c))
    }

    pub fn reduce_calls(self) -> (Action<'a>, bool) {
        let mut something_changed = false;
        let res = {
            let mut extract = Self::account_changed(&mut something_changed);
            match self {
                Self::SingleArgApplication(func, operand) => {
                    if *func == Self::Value("inc") {
                        // https://message-from-space.readthedocs.io/en/latest/message5.html#successor
                        if let Self::Number(n) = *operand {
                            println!("inc number");
                            return (Self::Number(n + 1), true);
                        }
                    } else if *func == Self::Value("neg") {
                        if let Self::Number(n) = *operand {
                            println!("neg number");
                            return (Self::Number(-n), true);
                        }
                    } else if *func == Self::Value("i") {
                        println!("identity");
                        return (extract(operand.reduce_calls()), true);
                    }
                    Self::application(
                        extract(func.reduce_calls()),
                        extract(operand.reduce_calls()),
                    )
                }
                Self::MultipleArgApplication(func, mut operands) => {
                    if *func == Self::Value("inc") {
                        // https://message-from-space.readthedocs.io/en/latest/message5.html#successor
                        if operands.len() == 1 {
                            if let Self::Number(n) = operands[0] {
                                println!("inc number");
                                return (Self::Number(n), true);
                            }
                        }
                    } else if *func == Self::Value("neg") {
                        if operands.len() == 1 {
                            if let Self::Number(n) = operands[0] {
                                println!("neg number");
                                return (Self::Number(-n), true);
                            }
                        }
                    } else if *func == Self::Value("add") {
                        if operands.len() == 2 {
                            if let [Self::Number(a), Self::Number(b)] = operands.as_slice() {
                                println!("add number");
                                return (Self::Number(a + b), true);
                            }
                        }
                    } else if *func == Self::Value("mul") {
                        // https://message-from-space.readthedocs.io/en/latest/message9.html#product
                        if operands.len() == 2 {
                            if let [Self::Number(a), Self::Number(b)] = operands.as_slice() {
                                println!("mul number");
                                return (Self::Number(a * b), true);
                            }
                        }
                    } else if *func == Self::Value("s") {
                        // https://message-from-space.readthedocs.io/en/latest/message18.html#s-combinator
                        if operands.len() >= 3 {
                            println!("s combinator");
                            return (
                                Self::apply_combinator(operands, Self::s_combinator, extract),
                                true,
                            );
                        }
                    } else if *func == Self::Value("c") {
                        if operands.len() >= 3 {
                            // https://message-from-space.readthedocs.io/en/latest/message19.html#c-combinator
                            println!("c combinator");
                            return (
                                Self::apply_combinator(operands, Self::c_combinator, extract),
                                true,
                            );
                        }
                    } else if *func == Self::Value("b") {
                        // https://message-from-space.readthedocs.io/en/latest/message20.html#b-combinator
                        if operands.len() >= 3 {
                            println!("b combinator");
                            return (
                                Self::apply_combinator(operands, Self::b_combinator, extract),
                                true,
                            );
                        }
                    } else if *func == Self::Value("i") {
                        // https://message-from-space.readthedocs.io/en/latest/message24.html#i-combinator
                        if operands.len() == 1 {
                            println!("identity");
                            return (extract(operands.pop().unwrap().reduce_calls()), true);
                        }
                    }

                    Self::multi_application(
                        extract(func.reduce_calls()),
                        operands
                            .into_iter()
                            .map(|o| extract(o.reduce_calls()))
                            .collect(),
                    )
                }
                _ => extract(self.recursive_apply_no_leafs(Self::reduce_calls)),
            }
        };
        (res, something_changed)
    }

    pub fn substitute_value(self, ident: &str, with: &Action<'a>) -> (Action<'a>, bool) {
        match self {
            Self::Value(i) if i == ident => {
                println!("substitution");
                (with.clone(), true)
            }
            _ => self.recursive_apply_no_leafs(|s| s.substitute_value(ident, with)),
        }
    }

    pub fn reduce_all(self) -> (Action<'a>, bool) {
        let (args_res, args_changed) = self.reduce_args();
        let (lists_res, lists_changed) = args_res.reduce_lists();
        let (calls_res, calls_changed) = lists_res.reduce_calls();
        (calls_res, args_changed || lists_changed || calls_changed)
    }

    pub fn parse_reduced(stream: &str) -> Vec<Action> {
        Self::parse(stream)
            .into_iter()
            .map(|a| a.reduce_all().0)
            .collect()
    }

    fn application<'b>(func: Action<'b>, operand: Action<'b>) -> Action<'b> {
        Action::SingleArgApplication(Box::new(func), Box::new(operand))
    }

    fn multi_application<'b>(func: Action<'b>, operands: Vec<Action<'b>>) -> Action<'b> {
        if operands.is_empty() {
            func
        } else {
            Action::MultipleArgApplication(Box::new(func), operands)
        }
    }
}

#[test]
fn test_parser() {
    let test1 = ":1029 = ap ap cons 7 ap ap cons 123229502148636 nil";
    let exp1 = vec![
        Action::Value(":1029"),
        Action::Value("="),
        Action::application(
            Action::application(Action::Value("cons"), Action::Value("7")),
            Action::application(
                Action::application(Action::Value("cons"), Action::Value("123229502148636")),
                Action::Value("nil"),
            ),
        ),
    ];
    assert_eq!(Action::parse(test1), exp1);
}

#[test]
fn test_reduce_args() {
    let test1 = "ap ap cons 7 ap ap cons 123229502148636 nil";
    let token = Action::parse(test1).pop().unwrap();
    let exp1 = Action::multi_application(
        Action::Value("cons"),
        vec![
            Action::Value("7"),
            Action::multi_application(
                Action::Value("cons"),
                vec![Action::Value("123229502148636"), Action::Value("nil")],
            ),
        ],
    );
    let res = token.reduce_args();
    assert_eq!(res, exp1);
}

#[test]
fn test_reduce_lists() {
    let test1 = "ap ap cons 7 ap ap cons 123229502148636 nil";
    let token = Action::parse(test1).pop().unwrap();
    let multi_token = token.reduce_args();
    let exp1 = Action::List(vec![Action::Value("7"), Action::Value("123229502148636")]);

    let res = multi_token.reduce_lists();
    assert_eq!(res, exp1);
}

#[test]
fn test_reduce_more_args() {
    let test1 = "ap ap ap ap c 1 2 3 4";
    // ap ap ap 1 3 2 4
    let token = Action::parse(test1).pop().unwrap();
    let exp1 = Action::multi_application(
        Action::Number(1),
        vec![Action::Number(3), Action::Number(2), Action::Number(4)],
    );

    let res = token.reduce_all().reduce_all();
    assert_eq!(res, exp1);
}
