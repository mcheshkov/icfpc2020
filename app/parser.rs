use std::fs::File;
use std::io::Read;
use std::path::Path;

mod text_parser;

use crate::text_parser::Action;

fn main() -> () {
    let mut input_file = File::open(Path::new("galaxy.txt")).expect("Could not open galaxy.txt");
    let mut data = String::new();
    input_file
        .read_to_string(&mut data)
        .expect("Could not read galaxy.txt to string");
    for line in data.lines() {
        let actions = Action::parse_reduced(line);
        println!(
            "{}",
            actions
                .into_iter()
                .map(|a| a.to_string())
                .collect::<Vec<_>>()
                .join(" ")
        );
    }
}
