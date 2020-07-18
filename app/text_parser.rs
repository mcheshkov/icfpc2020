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

    fn recursive_apply_no_leafs<F: FnMut(Self) -> Self>(self, mut func: F) -> Self {
        match self {
            Self::Number(_) | Self::Value(_) => self,
            Self::SingleArgApplication(f, args) => Self::application(func(*f), func(*args)),
            Self::MultipleArgApplication(f, args) => {
                Self::multi_application(func(*f), args.into_iter().map(func).collect())
            }
            Self::List(items) => Self::List(items.into_iter().map(func).collect()),
        }
    }

    pub fn reduce_args(self) -> Action<'a> {
        match self {
            Self::SingleArgApplication(func, operand) => {
                let first_reduced = func.reduce_args();
                match first_reduced {
                    Action::Value(_) | Action::List(_) | Action::Number(_) => {
                        Action::multi_application(first_reduced, vec![operand.reduce_args()])
                    }
                    Action::MultipleArgApplication(func, mut args) => {
                        args.push(operand.reduce_args());
                        Action::MultipleArgApplication(func, args)
                    }
                    Action::SingleArgApplication(_, _) => {
                        unreachable!("cannot be SingleArgApplication")
                    }
                }
            }
            _ => self.recursive_apply_no_leafs(Self::reduce_args),
        }
    }

    pub fn reduce_lists(self) -> Action<'a> {
        match self {
            Self::MultipleArgApplication(val, mut args)
                if *val == Self::Value("cons") && args.len() == 2 =>
            {
                let second = args.pop().unwrap();
                let first = args.pop().unwrap();
                let second_list_possibly = second.reduce_lists();
                match second_list_possibly {
                    Self::List(mut items) => {
                        items.insert(0, first);
                        Self::List(items)
                    }
                    Self::Value("nil") => Self::List(vec![first]),
                    _ => Self::MultipleArgApplication(
                        Box::new(Self::Value("cons")),
                        vec![first, second_list_possibly],
                    ),
                }
            }
            _ => self,
        }
    }

    fn apply_combinator<F: FnMut(Self, Self, Self) -> Self>(
        operands: Vec<Self>,
        mut combinator: F,
    ) -> Action<'a> {
        let mut it = operands.into_iter().map(|i| i.reduce_calls());
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

    pub fn reduce_calls(self) -> Action<'a> {
        match self {
            Self::SingleArgApplication(func, operand) => {
                if *func == Self::Value("inc") {
                    // https://message-from-space.readthedocs.io/en/latest/message5.html#successor
                    if let Self::Number(n) = *operand {
                        return Self::Number(n + 1);
                    }
                } else if *func == Self::Value("neg") {
                    if let Self::Number(n) = *operand {
                        return Self::Number(-n);
                    }
                } else if *func == Self::Value("i") {
                    return operand.reduce_calls();
                }
                Self::application(func.reduce_calls(), operand.reduce_calls())
            }
            Self::MultipleArgApplication(func, mut operands) => {
                if *func == Self::Value("inc") {
                    // https://message-from-space.readthedocs.io/en/latest/message5.html#successor
                    if operands.len() == 1 {
                        if let Self::Number(n) = operands[0] {
                            return Self::Number(n);
                        }
                    }
                } else if *func == Self::Value("neg") {
                    if operands.len() == 1 {
                        if let Self::Number(n) = operands[0] {
                            return Self::Number(-n);
                        }
                    }
                } else if *func == Self::Value("add") {
                    if operands.len() == 2 {
                        if let [Self::Number(a), Self::Number(b)] = operands.as_slice() {
                            return Self::Number(a + b);
                        }
                    }
                } else if *func == Self::Value("mul") {
                    // https://message-from-space.readthedocs.io/en/latest/message9.html#product
                    if operands.len() == 2 {
                        if let [Self::Number(a), Self::Number(b)] = operands.as_slice() {
                            return Self::Number(a * b);
                        }
                    }
                } else if *func == Self::Value("s") {
                    // https://message-from-space.readthedocs.io/en/latest/message18.html#s-combinator
                    if operands.len() >= 3 {
                        return Self::apply_combinator(operands, Self::s_combinator);
                    }
                } else if *func == Self::Value("c") {
                    if operands.len() == 3 {
                        // https://message-from-space.readthedocs.io/en/latest/message19.html#c-combinator
                        return Self::apply_combinator(operands, Self::c_combinator);
                    }
                } else if *func == Self::Value("b") {
                    // https://message-from-space.readthedocs.io/en/latest/message20.html#b-combinator
                    if operands.len() == 3 {
                        return Self::apply_combinator(operands, Self::b_combinator);
                    }
                } else if *func == Self::Value("i") {
                    // https://message-from-space.readthedocs.io/en/latest/message24.html#i-combinator
                    if operands.len() == 1 {
                        return operands.pop().unwrap().reduce_calls();
                    }
                }

                Self::multi_application(
                    func.reduce_calls(),
                    operands.into_iter().map(|o| o.reduce_calls()).collect(),
                )
            }
            _ => self.recursive_apply_no_leafs(Self::reduce_calls),
        }
    }

    pub fn substitute_value(self, ident: &str, with: &Action<'a>) -> Action<'a> {
        match self {
            Self::Value(i) if i == ident => with.clone(),
            _ => self.recursive_apply_no_leafs(|s| s.substitute_value(ident, with)),
        }
    }

    pub fn reduce_all(self) -> Action<'a> {
        self.reduce_args().reduce_lists().reduce_calls()
    }

    pub fn parse_reduced(stream: &str) -> Vec<Action> {
        Self::parse(stream)
            .into_iter()
            .map(|a| a.reduce_all())
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
