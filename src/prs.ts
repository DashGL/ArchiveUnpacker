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

const prs = (buffer: ArrayBuffer, outputSize?: number): ArrayBuffer => {
  const input = new Uint8Array(buffer);
  const targetSize = outputSize || input.length * 4; // Default estimation if not provided
  const output = new Uint8Array(targetSize);

  let inputPos = 0;
  let outputPos = 0;
  let ctrlByte = 0;
  let ctrlByteCounter = 1;

  const getControlBit = (): boolean => {
    ctrlByteCounter--;
    if (ctrlByteCounter === 0) {
      if (inputPos >= input.length) return false;
      ctrlByte = input[inputPos++];
      ctrlByteCounter = 8;
    }
    const bit = (ctrlByte & 1) > 0;
    ctrlByte >>= 1;
    return bit;
  };

  while (outputPos < targetSize && inputPos < input.length) {
    // Copy literal bytes while control bit is 1
    while (getControlBit()) {
      if (inputPos >= input.length || outputPos >= targetSize) break;
      output[outputPos++] = input[inputPos++];
    }

    if (outputPos >= targetSize || inputPos >= input.length) break;

    let offset: number, length: number;

    if (getControlBit()) {
      // Long distance back-reference (2-byte encoding)
      if (inputPos >= input.length - 1) break;

      const byte1 = input[inputPos++];
      const byte2 = input[inputPos++];

      if (byte1 === 0 && byte2 === 0) {
        // End marker
        break;
      }

      offset = (byte2 << 5) + (byte1 >> 3) - 8192;
      const lengthPart = byte1 & 7;

      if (lengthPart !== 0) {
        length = lengthPart + 2;
      } else {
        if (inputPos >= input.length) break;
        length = input[inputPos++] + 10;
      }
    } else {
      // Short distance back-reference
      length = 2;
      if (getControlBit()) length += 2;
      if (getControlBit()) length++;

      if (inputPos >= input.length) break;
      offset = input[inputPos++] - 256;
    }

    // Copy from back-reference
    const copyPos = offset + outputPos;
    for (let i = 0; i < length && outputPos < targetSize; i++) {
      if (copyPos + i >= 0 && copyPos + i < outputPos) {
        output[outputPos++] = output[copyPos + i];
      } else {
        // Handle invalid back-reference gracefully
        output[outputPos++] = 0;
      }
    }
  }

  // Return exact sized buffer
  return output.slice(0, outputPos).buffer;
};

export default prs;
