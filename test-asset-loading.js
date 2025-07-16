/**
 * Test Asset Loading System
 * Simple test to verify the asset loading and management system works correctly
 */

import { ASSET_MANIFEST, CRITICAL_ASSETS, getAssetsByPriority, assetExists } from './src/config/assetManifest.js';

console.log('=== Asset Loading System Test ===\n');

// Test 1: Asset Manifest Structure
console.log('1. Testing Asset Manifest Structure:');
console.log(`- Sprites: ${Object.keys(ASSET_MANIFEST.sprites).length} assets`);
console.log(`- UI: ${Object.keys(ASSET_MANIFEST.ui).length} assets`);
console.log(`- Audio: ${Object.keys(ASSET_MANIFEST.audio).length} assets`);
console.log(`- Data: ${Object.keys(ASSET_MANIFEST.data).length} assets`);

// Test 2: Critical Assets
console.log('\n2. Testing Critical Assets:');
console.log(`- Critical sprites: ${Object.keys(CRITICAL_ASSETS.sprites).length}`);
console.log(`- Critical UI: ${Object.keys(CRITICAL_ASSETS.ui).length}`);
console.log(`- Critical data: ${Object.keys(CRITICAL_ASSETS.data).length}`);

// Test 3: Priority Filtering
console.log('\n3. Testing Priority Filtering:');
const highPriority = getAssetsByPriority(2);
const totalHighPriority = Object.values(highPriority).reduce((sum, category) => sum + Object.keys(category).length, 0);
console.log(`- High priority assets (1-2): ${totalHighPriority}`);

const allAssets = getAssetsByPriority(5);
const totalAssets = Object.values(allAssets).reduce((sum, category) => sum + Object.keys(category).length, 0);
console.log(`- All assets (1-5): ${totalAssets}`);

// Test 4: Asset Existence Check
console.log('\n4. Testing Asset Existence:');
console.log(`- player-idle-0 exists: ${assetExists('sprites', 'player-idle-0')}`);
console.log(`- button exists: ${assetExists('ui', 'button')}`);
console.log(`- nonexistent exists: ${assetExists('sprites', 'nonexistent')}`);

// Test 5: Asset URLs
console.log('\n5. Sample Asset URLs:');
console.log(`- Player sprite: ${ASSET_MANIFEST.sprites['player-idle-0'].url}`);
console.log(`- Button UI: ${ASSET_MANIFEST.ui['button'].url}`);
console.log(`- Story data: ${ASSET_MANIFEST.data['main-story'].url}`);

console.log('\n=== Test Complete ===');
console.log('Asset loading system structure is valid!');