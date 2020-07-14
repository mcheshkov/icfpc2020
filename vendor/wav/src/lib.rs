//! # WAV
//!
//! This is a crate for reading in and writing out wave files. It supports bit depths of 8, 16, and 24 bits, any number of channels, and uncompressed PCM data. Unfortunately other types of data format (e.g. compressed WAVE files) are not supported.
//!
//! ## Example
//!
//! ```rust
//! # fn main() -> std::io::Result<()> {
//! use std::fs::File;
//! use std::path::Path;
//!
//! let mut inp_file = File::open(Path::new("data/sine.wav"))?;
//! let (header, data) = wav::read(&mut inp_file)?;
//!
//! let mut out_file = File::create(Path::new("data/output.wav"))?;
//! wav::write(header, data, &mut out_file)?;
//! # Ok(())
//! # }
//! ```

use riff;
use std::io::{Read, Write};

/// Structure for the "fmt " chunk of wave files, specifying key information
/// about the enclosed data. This struct supports only PCM data, which is to
/// say there is no extra members for compressed format data.
#[derive(Debug, Default, Copy, Clone, Hash, PartialEq, Eq)]
pub struct Header {
    pub audio_format: u16,
    pub channel_count: u16,
    pub sampling_rate: u32,
    pub bytes_per_second: u32,
    pub bytes_per_sample: u16,
    pub bits_per_sample: u16,
}

impl Header {
    /// Creates a new Header object.
    ///
    /// # Parameters
    ///
    /// * `af` - Audio format. 1 for uncompressed PCM data.
    /// * `cc` - Channel count, the number of channels each sample has. Generally 1 (mono) or 2 (stereo).
    /// * `r` - Sampling rate (e.g. 44.1kHz, 48kHz, 96kHz, etc.).
    /// * `bps` - Number of bits in each (sub-channel) sample. Generally 8, 16, or 24.
    ///
    /// # Example
    ///
    /// ```
    /// let h = wav::Header::new(1, 2, 48_000, 16);
    /// ```
    pub fn new(af: u16, cc: u16, r: u32, bps: u16) -> Header {
        Header {
            audio_format: af,
            channel_count: cc,
            sampling_rate: r,
            bytes_per_second: (((bps >> 3) * cc) as u32) * r,
            bytes_per_sample: ((bps >> 3) * cc) as u16,
            bits_per_sample: bps,
        }
    }
}

impl Into<[u8; 16]> for Header {
    /// Converts the Header object into a vector of its bytes.
    ///
    /// # Example
    ///
    /// ```
    /// let h:[u8;16] = wav::Header::new(1, 2, 48_000, 16).into();
    /// ```
    fn into(self) -> [u8; 16] {
        let mut v: [u8; 16] = [0; 16];

        let b = self.audio_format.to_le_bytes();
        v[0] = b[0];
        v[1] = b[1];
        let b = self.channel_count.to_le_bytes();
        v[2] = b[0];
        v[3] = b[1];
        let b = self.sampling_rate.to_le_bytes();
        v[4] = b[0];
        v[5] = b[1];
        v[6] = b[2];
        v[7] = b[3];
        let b = self.bytes_per_second.to_le_bytes();
        v[8] = b[0];
        v[9] = b[1];
        v[10] = b[2];
        v[11] = b[3];
        let b = self.bytes_per_sample.to_le_bytes();
        v[12] = b[0];
        v[13] = b[1];
        let b = self.bits_per_sample.to_le_bytes();
        v[14] = b[0];
        v[15] = b[1];

        v
    }
}

impl From<[u8; 16]> for Header {
    /// Converts an array of 16 raw bytes into a Header object. Intended for
    /// use with bytes read in from wave files.
    ///
    /// # Parameters
    ///
    /// * `v` - The raw bytes to convert from.
    fn from(v: [u8; 16]) -> Self {
        let audio_format = u16::from_le_bytes([v[0], v[1]]);
        let channel_count = u16::from_le_bytes([v[2], v[3]]);
        let sampling_rate = u32::from_le_bytes([v[4], v[5], v[6], v[7]]);
        let bytes_per_second = u32::from_le_bytes([v[8], v[9], v[10], v[11]]);
        let bytes_per_sample = u16::from_le_bytes([v[12], v[13]]);
        let bits_per_sample = u16::from_le_bytes([v[14], v[15]]);

        Header {
            audio_format,
            channel_count,
            sampling_rate,
            bytes_per_second,
            bytes_per_sample,
            bits_per_sample,
        }
    }
}

impl From<&[u8]> for Header {
    /// Converts a slice of raw bytes into a Header object.
    ///
    /// # Panics
    ///
    /// This function will panic if the given slice is smaller than 16 bytes.
    ///
    /// # Parameters
    ///
    /// * `v` - The slice to convert from.
    fn from(v: &[u8]) -> Self {
        let mut a: [u8; 16] = [0; 16];
        a.copy_from_slice(&v[0..16]);
        Header::from(a)
    }
}

/// Enum listing the supported bit-depths and containers for the samples at each depth.
#[derive(Debug, PartialEq, Clone)]
pub enum BitDepth {
    Eight(Vec<u8>),
    Sixteen(Vec<i16>),
    TwentyFour(Vec<i32>),
    Empty,
}

impl Default for BitDepth {
    /// Default construction.
    fn default() -> Self {
        BitDepth::Empty
    }
}

impl From<Vec<u8>> for BitDepth {
    /// Creates a BitDepth object from the given u8 vector.
    fn from(v: Vec<u8>) -> Self {
        BitDepth::Eight(v)
    }
}
impl From<Vec<i16>> for BitDepth {
    /// Creates a BitDepth object from the given i16 vector.
    fn from(v: Vec<i16>) -> Self {
        BitDepth::Sixteen(v)
    }
}
impl From<Vec<i32>> for BitDepth {
    /// Creates a BitDepth object from the given i32 vector.
    fn from(v: Vec<i32>) -> Self {
        BitDepth::TwentyFour(v)
    }
}

impl std::convert::TryInto<Vec<u8>> for BitDepth {
    /// Error type if the conversion couldn't be performed.
    type Error = &'static str;

    /// Attempts to create a vector from the object.
    ///
    /// # Errors
    ///
    /// This function fails if `self` is not `BitDepth::Eight`.
    fn try_into(self) -> Result<Vec<u8>, Self::Error> {
        if let BitDepth::Eight(v) = self {
            Ok(v)
        } else {
            Err("Bit depth is not 8-bits")
        }
    }
}
impl std::convert::TryInto<Vec<i16>> for BitDepth {
    /// Error type if the conversion couldn't be performed.
    type Error = &'static str;

    /// Attempts to create a vector from the object.
    ///
    /// # Errors
    ///
    /// This function fails if `self` is not `BitDepth::Sixteen`.
    fn try_into(self) -> Result<Vec<i16>, Self::Error> {
        if let BitDepth::Sixteen(v) = self {
            Ok(v)
        } else {
            Err("Bit depth is not 16-bits")
        }
    }
}
impl std::convert::TryInto<Vec<i32>> for BitDepth {
    /// Error type if the conversion couldn't be performed.
    type Error = &'static str;

    /// Attempts to create a vector from the object.
    ///
    /// # Errors
    ///
    /// This function fails if `self` is not `BitDepth::TwentyFour`.
    fn try_into(self) -> Result<Vec<i32>, Self::Error> {
        if let BitDepth::TwentyFour(v) = self {
            Ok(v)
        } else {
            Err("Bit depth is not 24-bits")
        }
    }
}

/// Reads in the given `Read` object and attempts to extract the audio data and
/// header from it.
///
/// # Errors
///
/// This function fails under the following circumstances:
/// * Any error occurring from the `reader` parameter during reading.
/// * The data isn't RIFF data.
/// * The wave data is malformed.
/// * The wave header specifies a compressed data format.
pub fn read(reader: &mut dyn Read) -> std::io::Result<(Header, BitDepth)> {
    let (wav, _) = riff::read_chunk(reader)?;

    let mut head = Header::default();
    let mut data = BitDepth::default();

    match wav.content {
        riff::ChunkContent::List {
            form_type,
            subchunks,
        } => {
            if form_type.as_str() != "WAVE" {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "RIFF file type not \"WAVE\"",
                ));
            } else {
                // Get the header from the first chunk
                for c in &subchunks {
                    // Check for `fmt ` chunk
                    if c.id.as_str() == "fmt " {
                        if let riff::ChunkContent::Subchunk(v) = &c.content {
                            head = Header::from(v.as_slice());
                        }
                    }
                }
                // Return error if not using PCM
                if head.audio_format != 1 {
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::Other,
                        "File does not use uncompressed PCM data format",
                    ));
                }

                // Get the data from the second chunk
                for c in &subchunks {
                    // Check for `data` chunk
                    if c.id.as_str() == "data" {
                        if let riff::ChunkContent::Subchunk(v) = &subchunks[1].content {
                            match head.bits_per_sample {
                                8 => {
                                    data = BitDepth::Eight(v.clone());
                                }
                                16 => {
                                    let mut i = 0;
                                    let mut sam = Vec::new();
                                    while i < v.len() {
                                        for _ in 0..head.channel_count {
                                            sam.push(i16::from_le_bytes([v[i], v[i + 1]]));
                                            i += 2;
                                        }
                                    }
                                    data = BitDepth::Sixteen(sam);
                                }
                                24 => {
                                    let mut i = 0;
                                    let mut sam = Vec::new();
                                    while i < v.len() {
                                        for _ in 0..head.channel_count {
                                            sam.push(i32::from_le_bytes([
                                                v[i],
                                                v[i + 1],
                                                v[i + 2],
                                                0,
                                            ]));
                                            i += 3;
                                        }
                                    }
                                    data = BitDepth::TwentyFour(sam);
                                }
                                _ => {
                                    return Err(std::io::Error::new(
                                        std::io::ErrorKind::Other,
                                        "Unsupported bit depth",
                                    ))
                                }
                            };
                        }
                    }
                }
            }
        }
        _ => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "File not a WAVE file",
            ))
        }
    };

    if data == BitDepth::Empty {
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Could not parse audio data",
        ));
    }

    Ok((head, data))
}

/// Writes the given wav data to the given `Write` object.
///
/// # Errors
///
/// This function fails under the following circumstances:
/// * Any error occurring from the `writer` parameter during writing.
/// * The path to the desired file destination couldn't be created.
/// * The given BitDepth is `BitDepth::Empty`
pub fn write(header: Header, track: BitDepth, writer: &mut dyn Write) -> std::io::Result<()> {
    let w_id = riff::ChunkId::new("WAVE").unwrap();

    let h_id = riff::ChunkId::new("fmt ").unwrap();
    let h_vec: [u8; 16] = header.into();
    let h_dat = riff::Chunk::new_data(h_id, Vec::from(&h_vec[0..16]));

    let d_id = riff::ChunkId::new("data").unwrap();
    let mut d_vec = Vec::new();
    match track {
        BitDepth::Eight(v) => {
            d_vec = v;
        }
        BitDepth::Sixteen(v) => {
            for s in v {
                let mut v = Vec::new();
                v.extend(&s.to_le_bytes());
                d_vec.append(&mut v);
            }
        }
        BitDepth::TwentyFour(v) => {
            for s in v {
                let mut v = Vec::new();
                v.extend(&s.to_le_bytes()[0..3]);
                d_vec.append(&mut v);
            }
        }
        _ => {
            return Err(std::io::Error::new(
                std::io::ErrorKind::Other,
                "Empty audio data given",
            ))
        }
    };
    let d_dat = riff::Chunk::new_data(d_id, d_vec);

    let r = riff::Chunk::new_riff(w_id, vec![h_dat, d_dat]);

    riff::write_chunk(writer, &r)?;

    Ok(())
}
