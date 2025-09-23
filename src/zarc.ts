/*
    This file is part of ArchiveUnpacker Library
    Copyright 2023 [Benjamin Collins](kion@dashgl.com)

    Permission is hereby granted, free of charge, to any person obtaining
    a copy of this software and associated documentation files (the
    "Software"), to deal in the Software without restriction, including
    without limitation the rights to use, copy, modify, merge, publish,
    distribute, sublicense, and/or sell copies of the Software, and to
    permit persons to whom the Software is furnished to do so, subject to
    the following conditions:

    The above copyright notice and this permission notice shall be included
    in all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

import ByteReader from './ByteReader';
import { ByteFile } from './types';

/**
 * Extracts files from ZARC archives (used in Phantasy Star Zero for player models)
 * Based on the Zipper/Zipper C# implementation
 */
const zarc = (inBuffer: ArrayBuffer): ByteFile[] => {
  const files: ByteFile[] = [];

  if (inBuffer.byteLength < 20) {
    throw new Error('ZARC file too small');
  }

  const bs = new ByteReader(inBuffer);

  // Check ZARC magic header
  const magic = bs.readString(4);
  if (magic !== 'ZARC') {
    throw new Error(`Invalid ZARC magic number: ${magic}`);
  }

  // Read header (based on C# code)
  bs.seek(0x0C); // Skip to headerSize offset
  const headerSize = bs.readUInt32(); // 0x0C - header size
  const fileCount = bs.readUInt32();  // 0x10 - file count
  const fileDefSize = bs.readUInt32(); // 0x14 - file definition size

  console.log(`ZARC: headerSize=${headerSize}, fileCount=${fileCount}, fileDefSize=${fileDefSize}`);

  // Extract files
  for (let i = 0; i < fileCount; i++) {
    // Seek to file definition entry
    bs.seek(headerSize + i * fileDefSize);

    const offset = bs.readUInt32();  // File data offset
    const size = bs.readUInt32();    // File data size

    // Skip 8 bytes (unknown fields)
    bs.seek(bs.tell() + 8);

    // Read filename (0x30 bytes maximum, null-terminated)
    const nameStartPos = bs.tell();
    const nameBytes = bs.subArray(nameStartPos, nameStartPos + 0x30);
    const nameView = new DataView(nameBytes);
    let fileName = '';

    // Convert to string until null terminator
    for (let j = 0; j < 0x30; j++) {
      const byte = nameView.getUint8(j);
      if (byte === 0) break;
      fileName += String.fromCharCode(byte);
    }

    if (!fileName) {
      // Generate fallback filename if name is empty
      fileName = `file_${i.toString().padStart(3, '0')}.bin`;
    }

    try {
      // Extract file data
      const fileData = bs.subArray(offset, offset + size);
      files.push({ name: fileName, data: fileData });

      console.log(`  Extracted: ${fileName} (${size} bytes at offset 0x${offset.toString(16)})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to extract file ${i} (${fileName}): ${message}`);
      // Add empty file entry to maintain index consistency
      files.push({
        name: `${fileName}.error`,
        data: new ArrayBuffer(0)
      });
    }
  }

  return files;
};

export default zarc;