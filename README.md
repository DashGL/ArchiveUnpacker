Sure! Here's a possible README for the `ArchiveUnpacker` repository:

# ArchiveUnpacker

`ArchiveUnpacker` is a simple library to unpack archive files that store binary data. It supports a few common archive formats, such as ZIP, RAR, and 7z. The library is written in TypeScript and can be used both in browser and Node.js environments.

## Archive Unpacker

You can install the library using `npm`:

```sh
npm i archiveunpacker
```

## Supported Archive Formats

The following archive formats are currently supported:

- .narc
- .prs
- .zpr

## Importing

To use the package, import the specific unpakc function from the package in order to be able to use it.

```javascript
import { narc, prs, zpr } from 'archiveunpacker';
```


```javascript
const { narc, prs, zpr } = require('archiveunpacker');
```

## Usage

The archive formats can be decompressed and split in both nodejs and in the browser. Using nodejs requires you to convert to and from and ArrayBuffer object from Node's built-in Buffer object, but the conversion is trivial. On the browser side, using ArrayBuffers is the standard and the conversions 

### Nodejs (read file)

```javascript
import { prs } from 'archiveunpacker';
import { readFileSync } from 'fs';

const prsFile = readFileSync('compressedFile.prs');
const decompressedArrayBuffer = prs(prsFile.buffer);
const decompressedBuffer = Buffer.from(decompressedArrayBuffer);
```

### Browser (ajax)

```javascript
const { prs } = require('archiveunpacker');
const req = await fetch('path/somefile.prs');
const prsFile = await res.arrayBuffer();
const decompressedArrayBuffer = prs(prsFile);
```

### Browser (file input)

```javascript
import { prs } from 'archiveunpacker';

const fileInput = document.getElementById('my-file-input');
fileInput.addEventListener('change', async evt => {

	const { files } evt.target;
	if(!files || !files.length) {
		return;
	}

	const [ file ] = files;
	const prsFile = await file.arrayBuffer()
	const decompressedArrayBuffer = prs(prsFile);

});
```

## Formats

### .prs

PRS is an LZ77 compression format often used by Sega for games on the Dreamcast and Gamecube. Often the files are not labeled with a `.prs` extension. The most common way to detect this format is to look at the binary of the file, if it starts with a MAGIC number and is somewhat readble, but gets more jumbled over time, then it is likely compressed. 

### .narc

NARC is a "Nitro Archive", which is an archive format used for Phantasy Star Zero on the Nintendo DS. Not sure where else this is used. This function will take a .narc archive and returns a list of Files with a name: string and data: ArrayBuffer.

### .zpr

ZPR is a compression format used for Phantasy Star Zero on the Nintendo DS. Intermally the way this works is there is a 0x10 length header, will all of the bytes afterwards (un)XOR'dby 0x95. This will fix the bytes to be readable and then decompress the file with `prs` and return the result. 

## License

The `ArchiveUnpacker` library is licensed under the MIT License. See the `LICENSE` file for details.
