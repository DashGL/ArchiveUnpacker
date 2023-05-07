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

import { ByteReader } from 'bytereader';

const prs = (buffer: ArrayBuffer): ArrayBuffer => {
  const inBuffer = new Uint8Array(buffer);
  const outBuffer: number[] = [];
  const bs = new ByteReader(inBuffer);
  const { byteLength } = inBuffer;

  const out = {
    ofs: 0,
    bit: 0,
    cmd: 0,
  };

  const getBit = (): number => {
    if (out.bit === 0) {
      out.cmd = bs.readUInt8();
      out.bit = 8;
    }

    const newBit = out.cmd & 1;
    out.cmd >>= 1;
    out.bit -= 1;
    return newBit ? 1 : 0;
  };

  while (out.ofs < byteLength) {
    const bool = getBit();
    if (bool) {
      outBuffer.push(inBuffer[out.ofs]);
      out.ofs += 1;
      continue;
    }

    const t = getBit();
    let amount = 0;
    let start = 0;

    if (t) {
      const a = bs.readUInt8();
      const b = bs.readUInt8();

      const offset = ((b << 8) | a) >> 3;
      amount = a & 7;
      if (out.ofs < byteLength) {
        amount = amount === 0 ? bs.readUInt8() + 10 : amount + 2;
      }
      start = outBuffer.length - 0x2000 + offset;
    } else {
      amount = 0;
      for (let i = 0; i < 2; i++) {
        amount <<= 1;
        amount |= getBit();
      }
      const offset = bs.readUInt8();
      amount += 2;
      start = outBuffer.length - 0x100 + offset;
    }

    for (let i = 0; i < amount; i++) {
      if (start >= 0 && start < outBuffer.length) {
        outBuffer.push(outBuffer[start]);
      } else {
        outBuffer.push(0);
      }
      start += 1;
    }
  }

  const array = new Uint8Array(outBuffer);
  return array.buffer;
};

export default prs;
