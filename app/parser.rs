use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use std::path::Path;
use text_parser::Action;

mod text_parser;

fn is_constant(action: &Action) -> bool {
    match action {
        Action::Number(_) => true,
        Action::Value("nil") => true,
        Action::List(args) => args.iter().all(is_constant),
        _ => false,
    }
}

fn parse_binding<'a, 'b>(actions: &'a [Action<'b>]) -> (&'b str, Action<'b>) {
    if let [Action::Value(id), Action::Value("="), rest] = actions {
        (id, rest.clone())
    } else {
        panic!("Could not parse binding");
    }
}

fn is_synonim(action: &Action) -> bool {
    match action {
        Action::Value(_) => true,
        _ => false,
    }
}

fn contains_no_references(action: &Action) -> bool {
    match action {
        Action::Number(_) => true,
        Action::Value(s) => !s.starts_with(":"),
        Action::List(items) => items.iter().all(contains_no_references),
        Action::SingleArgApplication(func, operand) => {
            contains_no_references(func) && contains_no_references(operand)
        }
        Action::MultipleArgApplication(func, operands) => {
            contains_no_references(func) && operands.iter().all(contains_no_references)
        }
    }
}

fn write_to_file(collection: &HashMap<&str, Action>, file: &mut File) {
    let mut items = collection.iter().collect::<Vec<_>>();
    items.sort();
    for (ident, body) in items {
        writeln!(file, "{} = {}", ident, body.to_string()).expect("Could not write line");
    }
}

type Bindings<'a> = HashMap<&'a str, Action<'a>>;

fn replace_all<'a, 'b>(mut bindings: Bindings<'a>, replacements: &'b Bindings<'a>) -> Bindings<'a> {
    bindings = bindings
        .into_iter()
        .map(|(k, mut value)| {
            for (ident, body) in replacements.iter() {
                let (new_value, _) = value.substitute_value(ident, body);
                value = new_value;
            }
            (k, value)
        })
        .collect();

    bindings
        .into_iter()
        .map(|(k, value)| (k, value.reduce_all_max().0))
        .collect()
}

fn replace_matching<F: FnMut(&Action) -> bool>(
    bindings: Bindings,
    mut f: F,
) -> (Bindings, Bindings) {
    let (replacements, new_bindings) = bindings
        .into_iter()
        .partition::<HashMap<_, _>, _>(|(_, value)| f(value));

    (replace_all(new_bindings, &replacements), replacements)
}

fn main() -> () {
    let mut input_file = File::open(Path::new("galaxy.txt")).expect("Could not open galaxy.txt");
    let mut data = String::new();
    input_file
        .read_to_string(&mut data)
        .expect("Could not read galaxy.txt to string");

    let mut known_file = File::create(Path::new("known.txt")).expect("Could not open known.txt");
    let mut unknown_file =
        File::create(Path::new("unknown.txt")).expect("Could not open unknown.txt");
    let mut removed_file =
        File::create(Path::new("removed.txt")).expect("Could not open removed.txt");

    let mut all_bindings = HashMap::new();

    for line in data.lines() {
        let actions = Action::parse_reduced(line);
        let (ident, body) = parse_binding(&actions);
        all_bindings.insert(ident, body);
    }

    let mut removed: HashMap<&str, Action> = HashMap::new();

    let mut something_changed = true;

    while something_changed {
        something_changed = false;

        let (new_all_bindings, substitutki) = replace_matching(all_bindings, is_constant);
        something_changed = something_changed || !substitutki.is_empty();
        removed.extend(substitutki);
        all_bindings = new_all_bindings;

        let (new_all_bindings, substitutki) =
            replace_matching(all_bindings, contains_no_references);
        something_changed = something_changed || !substitutki.is_empty();
        removed.extend(substitutki);
        all_bindings = new_all_bindings;

        let (new_all_bindings, substitutki) = replace_matching(all_bindings, is_synonim);
        something_changed = something_changed || !substitutki.is_empty();
        removed.extend(substitutki);
        all_bindings = new_all_bindings;
    }

    write_to_file(&removed, &mut removed_file);
    let (known, unknown) = all_bindings
        .into_iter()
        .partition::<HashMap<_, _>, _>(|(_, body)| is_constant(body));
    write_to_file(&known, &mut known_file);
    write_to_file(&unknown, &mut unknown_file);
}
