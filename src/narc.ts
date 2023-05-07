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
import { ByteFile } from './types';

const narc = (inBuffer: ArrayBuffer): ByteFile[] => {
  const files: ByteFile[] = [];
  const bs = new ByteReader(inBuffer);

  // https://docs.dashgl.com/format/phantasy-star-zero/narc-archive#narc-section

  const NARC_MAGIC = 0x4352414e;

  const narcSection = {
    magic: bs.readUInt32(),
    a: bs.readUInt16(),
    b: bs.readUInt16(),
    archiveLen: bs.readUInt32(),
    headerLen: bs.readUInt16(),
    c: bs.readUInt16(),
  };

  if (narcSection.magic !== NARC_MAGIC) {
    throw new Error('Invalid NARC magic number');
  }

  // https://docs.dashgl.com/format/phantasy-star-zero/narc-archive#btaf-section

  const BTAF_MAGIC = 0x46415442;

  type bnafFiles_t = {
    name: string;
    startOffset: number;
    endOffset: number;
  };

  const btafSection = {
    magic: bs.readUInt32(),
    length: bs.readUInt32(),
    count: bs.readUInt32(),
  };

  if (btafSection.magic !== BTAF_MAGIC) {
    throw new Error('Invalid BTAF magic number');
  }

  const { count } = btafSection;
  const bnafFiles: bnafFiles_t[] = [];

  for (let i = 0; i < count; i++) {
    bnafFiles.push({
      name: '',
      startOffset: bs.readUInt32(),
      endOffset: bs.readUInt32(),
    });
  }

  // https://docs.dashgl.com/format/phantasy-star-zero/narc-archive#btnf-section

  const btnfHeader = {
    magic: bs.readUInt32(),
    length: bs.readUInt32(),
  };

  const relOffset = bs.tell();
  bnafFiles.forEach((file) => {
    file.startOffset += relOffset;
    file.endOffset += relOffset;
  });

  const rootNameEntryOffset = bs.readUInt32();

  // Read file names
  if (btnfHeader.length >= 16 && rootNameEntryOffset !== 4) {
    const firstFileIndex = bs.readUInt16();
    const rootDirectory = {
      parent: -1,
      name: '',
      nameEntryOffset: 0,
      firstFileIndex,
      count: 0,
    };

    const directoryEntryCount = bs.readUInt16();
    const directoryEntries = [rootDirectory];

    for (let i = 1; i < directoryEntryCount; i++) {
      const nameEntryTableOffset = bs.readUInt32();
      const firstFileIndex = bs.readUInt16();
      const parentDirectoryIndex = bs.readUInt16() & 0xfff;

      directoryEntries.push({
        parent: parentDirectoryIndex,
        name: `${parentDirectoryIndex.toString().padStart(3, '0')}`,
        nameEntryOffset: nameEntryTableOffset,
        firstFileIndex: firstFileIndex,
        count: 0,
      });
    }

    let currentDirectory = rootDirectory;
    let directoryIndex = 0;
    let fileIndex = 0;

    while (directoryIndex < directoryEntryCount) {
      const byte = bs.readUInt8();

      if (byte === 0) {
        directoryIndex++;
        if (directoryIndex >= directoryEntryCount) {
          break;
        }
        currentDirectory = directoryEntries[directoryIndex];
        continue;
      }

      currentDirectory.count++;
      const stringLen = byte & 0x7f;
      const name = bs.readString(stringLen);

      if (byte & 0x80) {
        const entryDirectoryIndex = bs.readUInt16() & 0xfff;
        const directoryEntry = directoryEntries[entryDirectoryIndex];
        directoryEntry.name = name;
      } else {
        const fileEntry = bnafFiles[fileIndex];
        const dir = directoryEntries[directoryIndex].name;

        fileEntry.name = dir + name;
        fileIndex++;
      }
    }
  }

  // Loop Through each file and slice
  bnafFiles.forEach((file) => {
    const { name, startOffset, endOffset } = file;
    const data = bs.subArray(startOffset, endOffset);
    files.push({ name, data });
  });

  return files;
};

export default narc;
