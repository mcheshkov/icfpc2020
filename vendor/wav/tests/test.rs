extern crate wav;

#[cfg(test)]
mod tests {
    #[test]
    fn test_wav() -> std::io::Result<()> {
        use std::fs::File;

        let mut reader = File::open(std::path::Path::new("data/sine.wav"))?;
        let (h, b) = wav::read(&mut reader)?;

        let mut writer = File::create(std::path::Path::new("data/output.wav"))?;
        wav::write(h, b, &mut writer)?;

        Ok(())
    }
}
