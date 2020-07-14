use std::io::{Error, Write, stdout};
use std::fs::File;
use std::path::Path;
use pitch_detection::{PitchDetector, McLeodDetector};
use wav::BitDepth;
use clap::{Arg, App, SubCommand};

const SAMPLE_RATE : usize = 500;
const SIZE : usize = 512;
const PADDING : usize = SIZE / 2;
const POWER_THRESHOLD : f32 = 0.0;
const CLARITY_THRESHOLD : f32 = 0.0;

fn use_pitch_detector(data: &[f32]) -> Vec<f32> {
    let mut detector = McLeodDetector::new(SIZE, PADDING);

    let mut res = vec!();
    for window in data.chunks(SIZE).filter(|x| x.len() == SIZE) {
        match detector.get_pitch(window, SAMPLE_RATE, POWER_THRESHOLD, CLARITY_THRESHOLD) {
            Some(pitch_res) => {
                res.push(pitch_res.frequency);
            }
            None => {}
        }
    }

    res
}

fn output_pitch_frequencies(input: &str) -> Result<(), Error> {
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

    let data = use_pitch_detector(&data);
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
                .required(true)
                .value_name("FILE")
                .takes_value(true))
                .help("input wave file")
        )
        .get_matches();

    if let Some(freqs_args) = args.subcommand_matches("freqs") {
        let input = freqs_args.value_of("input").unwrap();
        output_pitch_frequencies(input)?;
    }

    Ok(())
}
