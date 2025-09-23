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

import prs from './prs';

const zpr = (inBuffer: ArrayBuffer): ArrayBuffer => {
  // Validate ZPR header
  const headerView = new DataView(inBuffer);
  const magic = new TextDecoder().decode(inBuffer.slice(0, 4));

  if (magic !== 'ZPR\0') {
    throw new Error('Invalid ZPR magic header');
  }

  if (inBuffer.byteLength < 16) {
    throw new Error('ZPR file too small');
  }

  // Read decompressed size from header at offset 0x08
  const decompressedSize = headerView.getUint32(0x08, true);

  // Extract compressed data (skip 16-byte header)
  const compressedData = new Uint8Array(inBuffer.slice(0x10));

  // XOR decrypt with key 0x95
  const decrypted = new Uint8Array(compressedData.length);
  for (let i = 0; i < compressedData.length; i++) {
    decrypted[i] = compressedData[i] ^ 0x95;
  }

  // PRS decompress with expected output size
  return prs(decrypted.buffer, decompressedSize);
};

export default zpr;
