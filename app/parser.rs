use std::fs::File;
use std::io::Read;
use std::io::Write;
use std::path::Path;

mod text_parser;

use crate::text_parser::Action;

fn is_known(actions: &[Action]) -> bool {
    if let [first, eq, rest] = actions {
        match first {
            Action::Value(_) => {}
            _ => return false,
        }
        match eq {
            Action::Value("=") => {}
            _ => return false,
        }
        match rest {
            Action::List(args) => args.iter().all(|a| match a {
                Action::Number(_) => true,
                _ => false,
            }),
            _ => false,
        }
    } else {
        false
    }
}

fn main() -> () {
    let mut input_file = File::open(Path::new("galaxy.txt")).expect("Could not open galaxy.txt");
    let mut data = String::new();
    input_file
        .read_to_string(&mut data)
        .expect("Could not read galaxy.txt to string");

    let mut full_file = File::create(Path::new("full.txt")).expect("Could not open full.txt");
    let mut known_file = File::create(Path::new("known.txt")).expect("Could not open known.txt");
    let mut unknown_file =
        File::create(Path::new("unknown.txt")).expect("Could not open unknown.txt");

    for line in data.lines() {
        let actions = Action::parse_reduced(line);
        let repr = actions
            .iter()
            .map(|a| a.to_string())
            .collect::<Vec<_>>()
            .join(" ");
        writeln!(full_file, "{}", repr);
        if (is_known(&actions)) {
            writeln!(known_file, "{}", repr);
        } else {
            writeln!(unknown_file, "{}", repr);
        }
    }
}
