use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::io::Write;
use std::path::Path;
use text_parser::Action;

mod text_parser;

fn is_known(action: &Action) -> bool {
    match action {
        Action::Number(_) => true,
        Action::Value("nil") => true,
        Action::List(args) => args.iter().all(is_known),
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

fn should_substitute(action: &Action) -> bool {
    match action {
        Action::Number(_) | Action::Value(_) => true,
        _ => is_known(action),
    }
}

fn write_to_file(collection: &HashMap<&str, Action>, file: &mut File) {
    let mut items = collection.iter().collect::<Vec<_>>();
    items.sort();
    for (ident, body) in items {
        writeln!(file, "{} = {}", ident, body.to_string()).expect("Could not write line");
    }
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
        let (substitutki, new_all_bindings) = all_bindings
            .into_iter()
            .partition::<HashMap<_, _>, _>(|(_, value)| should_substitute(value));

        something_changed = !substitutki.is_empty();

        all_bindings = new_all_bindings
            .into_iter()
            .map(|(k, mut value)| {
                for (ident, body) in substitutki.iter() {
                    let (new_value, changed) = value.substitute_value(ident, body);
                    value = new_value;
                    something_changed = something_changed || changed;
                }
                let (new_value, changed) = value.reduce_all();
                something_changed = something_changed || changed;
                (k, new_value)
            })
            .collect();

        removed.extend(substitutki);
    }

    write_to_file(&removed, &mut removed_file);
    let (known, unknown) = all_bindings
        .into_iter()
        .partition::<HashMap<_, _>, _>(|(_, body)| is_known(body));
    write_to_file(&known, &mut known_file);
    write_to_file(&unknown, &mut unknown_file);
}
