# WAV

This is a crate for reading in and writing out wave files. It supports bit depths of 8, 16, and 24 bits, any number of channels, and uncompressed PCM data. Unfortunately other types of data format (e.g. compressed WAVE files) are not supported.

## Example

```rust
use std::fs::File;
use std::path::Path;

let mut inp_file = File::open(Path::new("data/sine.wav"))?;
let (header, data) = wav::read(&mut inp_file)?;

let mut out_file = File::create(Path::new("data/output.wav"))?;
wav::write(header, data, &mut out_file)?;
```
