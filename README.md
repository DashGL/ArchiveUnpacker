# ArchiveUnpacker

`ArchiveUnpacker` is a TypeScript library for extracting assets from various archive formats, with specialized support for Nintendo DS game files and Phantasy Star Zero assets. The library works in both browser and Node.js environments.

## Installation

```sh
npm i archiveunpacker
```

**Zero Dependencies**: ArchiveUnpacker now includes its own ByteReader implementation, so no external dependencies are required.

## Supported Archive Formats

- **NARC** - Nintendo Archive format used in DS games
- **PRS** - Phantasy Star compression algorithm
- **ZPR** - Custom compression format used in Phantasy Star Zero

## Quick Start

### Basic Usage

```typescript
import { narc, prs, zpr } from 'archiveunpacker';
import { readFileSync } from 'fs';

// Extract a ZPR-compressed NARC file (Phantasy Star Zero)
const compressedData = readFileSync('asset.narc');
const decompressed = zpr(compressedData.buffer);
const files = narc(decompressed);

console.log(`Extracted ${files.length} files`);
files.forEach(file => {
  console.log(`${file.name}: ${file.data.byteLength} bytes`);
});
```

### Phantasy Star Zero Asset Extraction

```typescript
import { extractPSZAsset, analyzePSZAsset } from 'archiveunpacker/example';

// Extract all files from a PSZ asset
extractPSZAsset('data/player/pb_bird.narc', './extracted');

// Analyze asset contents
analyzePSZAsset('data/enemy/vulture.narc');
```


## API Reference

### ZPR Decompression

Decompresses ZPR-compressed files used in Phantasy Star Zero:

```typescript
function zpr(buffer: ArrayBuffer): ArrayBuffer
```

- **buffer**: ZPR-compressed data
- **Returns**: Decompressed ArrayBuffer (usually NARC data)
- **Throws**: Error if invalid ZPR header or decompression fails

### NARC Archive Extraction

Extracts files from Nintendo DS NARC archives:

```typescript
function narc(buffer: ArrayBuffer): ByteFile[]

interface ByteFile {
  name: string;
  data: ArrayBuffer;
}
```

- **buffer**: NARC archive data
- **Returns**: Array of extracted files with names and data
- **Features**: Automatic file type detection, proper filename generation

### PRS Decompression

Decompresses data using the Phantasy Star compression algorithm:

```typescript
function prs(buffer: ArrayBuffer, outputSize?: number): ArrayBuffer
```

- **buffer**: PRS-compressed data
- **outputSize**: Expected output size (optional)
- **Returns**: Decompressed ArrayBuffer

## File Type Detection

The NARC extractor automatically detects file types and assigns appropriate extensions:

- **BMD0** → `.nsbmd` (3D Models)
- **BTX0** → `.nsbtx` (Textures)
- **BCA0** → `.nsbca` (Animations)
- **BTP0** → `.nsbtp` (Pattern Animations)
- **BTA0** → `.nsbta` (Material Animations)
- **NARC** → `.narc` (Nested Archives)
- **Unknown** → `.bin` (Binary Data)

## Examples

### Extract Player Weapon

```typescript
import { zpr, narc, ByteReader } from 'archiveunpacker';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// Load weapon file
const weaponData = readFileSync('data/player/08_handgun_sw_pa00.narc');

// Decompress and extract
const decompressed = zpr(weaponData.buffer);
const files = narc(decompressed);

// Save extracted files
mkdirSync('extracted/handgun', { recursive: true });
files.forEach((file, index) => {
  const outputPath = `extracted/handgun/${file.name}`;
  writeFileSync(outputPath, Buffer.from(file.data));
  console.log(`Extracted: ${file.name}`);
});

// Expected output:
// Extracted: 00.nsbmd (3D model)
// Extracted: 01.nsbca (animations)
// Extracted: 02.nsbtx (textures)
```

### Batch Process Directory

```typescript
import { readdirSync } from 'fs';
import { join } from 'path';

const inputDir = 'data/player';
const outputDir = 'extracted/player';

const narcFiles = readdirSync(inputDir).filter(f => f.endsWith('.narc'));

narcFiles.forEach(filename => {
  const inputPath = join(inputDir, filename);
  const assetName = filename.replace('.narc', '');

  try {
    extractPSZAsset(inputPath, join(outputDir, assetName));
    console.log(`✅ Processed ${filename}`);
  } catch (error) {
    console.error(`❌ Failed ${filename}:`, error.message);
  }
});
```

## Error Handling

The library includes comprehensive error handling:

```typescript
try {
  const decompressed = zpr(buffer);
  const files = narc(decompressed);
} catch (error) {
  if (error.message.includes('Invalid ZPR magic')) {
    console.log('File is not ZPR compressed');
  } else if (error.message.includes('Invalid NARC magic')) {
    console.log('Decompressed data is not a NARC archive');
  } else {
    console.error('Extraction failed:', error.message);
  }
}
```

## CLI Usage

Build and use the example CLI:

```bash
npm run build

# Extract a single asset
node lib/example.js extract data/player/pb_bird.narc ./output

# Analyze asset contents
node lib/example.js analyze data/enemy/vulture.narc
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Related Projects

- [apicula](https://github.com/scurest/apicula) - Convert extracted 3D models to modern formats
- [ndstool](https://github.com/devkitPro/ndstool) - Nintendo DS ROM manipulation
