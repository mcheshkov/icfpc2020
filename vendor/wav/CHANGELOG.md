# WAV

## Version 0.4.0

* Changed `read_wav` to `read` and `write_wav` to `write`.
* Updated documentation.

## Version 0.3.0

* Change `read_wav` and `write_wav` to accept generic IO types.
* Changed an error message.

## Version 0.2.0

* Renamed `read_file` to `read_wav` for consistency and clarity.

## Version 0.1.1

* Gives proper error when audio data that isn't in uncompressed PCM format.
* Ensures it's finds the correct chunks for header and data info, ignoring any extra metadata chunks.
* Minor documentation updates.
