use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use std::path::Path;
use text_parser::Action;

mod text_parser;

fn parse_binding<'a, 'b>(actions: &'a [Action<'b>]) -> Option<(&'b str, Action<'b>)> {
    if let [Action::Value(id), Action::Value("="), rest] = actions {
        Some((id, rest.clone()))
    } else {
        None
    }
}

fn escape_ident_ts(ident: &str) -> String {
    let first = ident.chars().next().expect("Empty ident for TS");

    if first.is_alphabetic() && ident.chars().all(|c| c.is_alphanumeric()) {
        return String::from(ident);
    }

    if first == ':' && ident.chars().skip(1).all(|c| c.is_digit(10)) {
        return format!("val_{}", &ident[1..]);
    }

    panic!("Bad ident for TS: {}", ident);
}

fn action_as_ts(action: &Action) -> String {
    let mut res = String::new();

    match action {
        Action::Value(i) => {
            res += &escape_ident_ts(i)
        },
        Action::Number(n) => {
            res += &format!("NumCons({}n)", n)
        },
        Action::SingleArgApplication(func, operand) => {
            res += &format!("{}({})", action_as_ts(&func), action_as_ts(&operand))
        },
        Action::MultipleArgApplication(func, args) => {
            let apps = args
                .iter()
                .map(action_as_ts)
                .map(|a| format!("({})", a))
                .collect::<Vec<_>>()
                .join("");
            res += &format!(
                "{}{}", action_as_ts(&func), apps)
        },
        Action::List(items) => {
            let items = items
                .iter()
                .map(action_as_ts)
                .collect::<Vec<_>>()
                .join(",");
            res += &format!("ListCons([{}])", items)
        },
    }

    res
}

fn binding_as_ts(binding: (&str, Action)) -> String {
    let (ident, body) = binding;
    format!("{}.result = {};", escape_ident_ts(ident), action_as_ts(&body))
}

fn main() -> () {
    let mut data = "
checkerboard = ap ap s ap ap b s ap ap c ap ap b c ap ap b ap c ap c ap ap s ap ap b s ap ap b ap b ap ap s i i lt eq ap ap s mul i nil ap ap s ap ap b s ap ap b ap b cons ap ap s ap ap b s ap ap b ap b cons ap c div ap c ap ap s ap ap b b ap ap c ap ap b b add neg ap ap b ap s mul div ap ap c ap ap b b checkerboard ap ap c add 2
    ";

    let mut input_file = File::open(Path::new("galaxy.txt")).expect("Could not open galaxy.txt");
    /*let mut data = String::new();
    input_file
        .read_to_string(&mut data)
        .expect("Could not read galaxy.txt to string");*/

    // let mut known_file = File::create(Path::new("known.txt")).expect("Could not open known.txt");
    // let mut unknown_file =
    //     File::create(Path::new("unknown.txt")).expect("Could not open unknown.txt");
    // let mut removed_file =
    //     File::create(Path::new("removed.txt")).expect("Could not open removed.txt");

    // let mut all_bindings = HashMap::new();

    let mut bindings = vec![];

    for line in data.lines() {
        let actions = Action::parse(line)
            .into_iter()
            .map(|a| a.reduce_args().reduce_lists())
            .collect::<Vec<_>>();

        if let Some(binding) = parse_binding(&actions) {
            bindings.push(binding);
        } else {
            for action in actions {
                print!("{} ", action_as_ts(&action));
            }
        }
    }

    for (ident, _) in &bindings {
        println!("const {} = empty_thunk();", escape_ident_ts(ident));
    }
    for binding in bindings {
        println!("{}", binding_as_ts(binding));
    }
}
