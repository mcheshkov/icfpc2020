use std::io::{Error, Write, stdout};
use std::fs::File;
use std::path::Path;
use std::str::FromStr;
use pitch_detection::{PitchDetector, McLeodDetector};
use wav::BitDepth;
use clap::{Arg, App, SubCommand};
use rayon::prelude::*;

const SAMPLE_RATE : usize = 44100;
const POWER_THRESHOLD : f32 = 0.0;
const CLARITY_THRESHOLD : f32 = 0.0;

fn calculate<'a, T: rayon::iter::ParallelIterator<Item=&'a [f32]>>(parts: T, window_size: usize) -> Vec<f32> {
    parts.map_with(
        || McLeodDetector::new(window_size, window_size / 2),
        |create_detector, window| {
        create_detector()
            .get_pitch(window, SAMPLE_RATE, POWER_THRESHOLD, CLARITY_THRESHOLD)
            .map(|pitch_res| pitch_res.frequency)
    }).flatten().collect()
}

fn use_pitch_detector(data: &[f32], window_size: usize, use_windows: bool) -> Vec<f32> {
    if use_windows {
        calculate(data.par_windows(window_size), window_size)
    } else {
        calculate(data.par_chunks(window_size).filter(|x| x.len() == window_size), window_size)
    }
}

fn output_pitch_frequencies(input: &str, window_size: usize, use_windows: bool) -> Result<(), Error> {
    // "data/2020-07-03/radio-transmission-recording.wav"
    let mut input_file = File::open(Path::new(input))?;
    let (_, raw_data) = wav::read(&mut input_file)?;

    let data: Vec<_> = match raw_data {
        BitDepth::Sixteen(d) => {
            d.iter().map(|&v| v as f32).collect()
        }
        _ => {
            panic!("Unknown data format");
        }
    };

    let data = use_pitch_detector(&data, window_size, use_windows);
    let stdout_instance = stdout();
    let mut writer = stdout_instance.lock();
    for n in data.iter() {
        writer.write(n.to_string().as_bytes())?;
        writer.write("\n".as_bytes())?;
    }
    Ok(())
}

fn main() -> Result<(), Error> {
    let args = App::new("My Super Program")
        .about("Utilities for pegovka task: https://message-from-space.readthedocs.io/en/latest/radio-transmission-recording.html")
        .subcommand(SubCommand::with_name("freqs")
            .about("decodes input wave file into frequencies")
            .arg(Arg::with_name("input")
                .short("i")
                .long("input")
                .required(true)
                .value_name("FILE")
                .takes_value(true)
                .help("input wave file"))
            .arg(Arg::with_name("window-size")
                .short("w")
                .long("window-size")
                .value_name("NUMBER")
                .takes_value(true)
                .default_value("1024")
                .help("window size to calculate pitch frequency"))
            .arg(Arg::with_name("windows")
                .long("windows")
                .help("frequencies will be calculated for windows instead of chunks"))
        )
        .get_matches();

    if let Some(freqs_args) = args.subcommand_matches("freqs") {
        let input = freqs_args.value_of("input").unwrap();
        let window_size = usize::from_str(freqs_args.value_of("window-size").unwrap()).unwrap();
        let use_windows = freqs_args.is_present("windows");
        eprintln!("{:?}, {:?}, {:?}", input, window_size, use_windows);
        output_pitch_frequencies(input, window_size, use_windows)?;
    }

    Ok(())
}
