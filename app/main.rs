use std::io::Error;
use std::fs::File;
use std::path::Path;
use pitch_detection::{PitchDetector, AutocorrelationDetector, McLeodDetector};
use wav::BitDepth;

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

fn main() -> Result<(), Error> {
    let mut input_file = File::open(Path::new("data/2020-07-03/radio-transmission-recording.wav"))?;
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
    for n in data.iter() {
        println!("{}", n);
    }

    Ok(())
}
