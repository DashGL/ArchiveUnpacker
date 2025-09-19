/*
    Example usage of ArchiveUnpacker for Phantasy Star Zero assets
    This demonstrates how to use the ZPR and NARC extractors
*/

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { zpr, narc, ByteFile, ByteReader } from './index';

/**
 * Extract a ZPR-compressed NARC file and save individual assets
 */
function extractPSZAsset(inputPath: string, outputDir: string): void {
  try {
    console.log(`Processing: ${inputPath}`);

    // Step 1: Read the ZPR-compressed file
    const compressedData = readFileSync(inputPath);

    // Step 2: Decompress ZPR to get NARC data
    console.log('Decompressing ZPR...');
    const narcData = zpr(compressedData.buffer);

    // Step 3: Extract files from NARC archive
    console.log('Extracting NARC files...');
    const extractedFiles = narc(narcData);

    // Step 4: Create output directory
    const assetName = basename(inputPath, '.narc');
    const assetDir = join(outputDir, assetName);
    mkdirSync(assetDir, { recursive: true });

    // Step 5: Save individual files
    extractedFiles.forEach((file: ByteFile, index: number) => {
      const outputPath = join(assetDir, file.name);
      writeFileSync(outputPath, Buffer.from(file.data));

      console.log(`  Extracted: ${file.name} (${file.data.byteLength} bytes)`);
    });

    console.log(`✅ Successfully extracted ${extractedFiles.length} files to ${assetDir}`);

  } catch (error) {
    console.error(`❌ Failed to process ${inputPath}:`, error.message);
  }
}

/**
 * Analyze file types in a PSZ asset
 */
function analyzePSZAsset(inputPath: string): void {
  try {
    const compressedData = readFileSync(inputPath);
    const narcData = zpr(compressedData.buffer);
    const extractedFiles = narc(narcData);

    console.log(`\n📊 Analysis of ${basename(inputPath)}:`);
    console.log(`Total files: ${extractedFiles.length}`);

    const fileTypes: Record<string, number> = {};
    extractedFiles.forEach(file => {
      const extension = file.name.split('.').pop() || 'unknown';
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    });

    console.log('File types:');
    Object.entries(fileTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} files`);
    });

  } catch (error) {
    console.error(`❌ Failed to analyze ${inputPath}:`, error.message);
  }
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage Examples:');
    console.log('');
    console.log('Extract a single asset:');
    console.log('  npx ts-node example.ts extract player/pb_bird.narc ./output');
    console.log('');
    console.log('Analyze an asset:');
    console.log('  npx ts-node example.ts analyze player/08_handgun_sw_pa00.narc');
    console.log('');
    process.exit(1);
  }

  const [command, ...commandArgs] = args;

  switch (command) {
    case 'extract':
      if (commandArgs.length !== 2) {
        console.error('Usage: extract <input.narc> <output-dir>');
        process.exit(1);
      }
      extractPSZAsset(commandArgs[0], commandArgs[1]);
      break;

    case 'analyze':
      if (commandArgs.length !== 1) {
        console.error('Usage: analyze <input.narc>');
        process.exit(1);
      }
      analyzePSZAsset(commandArgs[0]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

export { extractPSZAsset, analyzePSZAsset };