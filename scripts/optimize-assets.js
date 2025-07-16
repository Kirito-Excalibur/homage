#!/usr/bin/env node

/**
 * Asset Optimization Script
 * Optimizes game assets for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class AssetOptimizer {
    constructor() {
        this.assetsDir = path.join(projectRoot, 'src', 'assets');
        this.distAssetsDir = path.join(projectRoot, 'dist', 'assets');
        this.optimizationStats = {
            totalFiles: 0,
            optimizedFiles: 0,
            originalSize: 0,
            optimizedSize: 0,
            errors: []
        };
    }

    /**
     * Run asset optimization
     */
    async optimize() {
        console.log('🚀 Starting asset optimization...');
        
        try {
            await this.optimizeImages();
            await this.optimizeAudio();
            await this.optimizeData();
            await this.generateAssetManifest();
            
            this.printOptimizationReport();
            console.log('✅ Asset optimization completed successfully!');
        } catch (error) {
            console.error('❌ Asset optimization failed:', error);
            process.exit(1);
        }
    }

    /**
     * Optimize image assets
     */
    async optimizeImages() {
        console.log('📸 Optimizing images...');
        
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
        const imageFiles = this.findFilesByExtensions(this.assetsDir, imageExtensions);
        
        for (const filePath of imageFiles) {
            try {
                await this.optimizeImage(filePath);
                this.optimizationStats.optimizedFiles++;
            } catch (error) {
                this.optimizationStats.errors.push(`Image optimization failed for ${filePath}: ${error.message}`);
            }
            this.optimizationStats.totalFiles++;
        }
    }

    /**
     * Optimize single image file
     * @param {string} filePath - Path to image file
     */
    async optimizeImage(filePath) {
        const stats = fs.statSync(filePath);
        this.optimizationStats.originalSize += stats.size;
        
        // For now, just copy the file (in a real implementation, you'd use image optimization libraries)
        // You could integrate libraries like sharp, imagemin, etc.
        const relativePath = path.relative(this.assetsDir, filePath);
        const destPath = path.join(this.distAssetsDir, relativePath);
        
        // Ensure destination directory exists
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        // Copy file (placeholder for actual optimization)
        fs.copyFileSync(filePath, destPath);
        
        const optimizedStats = fs.statSync(destPath);
        this.optimizationStats.optimizedSize += optimizedStats.size;
        
        console.log(`  ✓ Optimized: ${relativePath}`);
    }

    /**
     * Optimize audio assets
     */
    async optimizeAudio() {
        console.log('🎵 Optimizing audio files...');
        
        const audioExtensions = ['.ogg', '.mp3', '.wav'];
        const audioFiles = this.findFilesByExtensions(this.assetsDir, audioExtensions);
        
        for (const filePath of audioFiles) {
            try {
                await this.optimizeAudio(filePath);
                this.optimizationStats.optimizedFiles++;
            } catch (error) {
                this.optimizationStats.errors.push(`Audio optimization failed for ${filePath}: ${error.message}`);
            }
            this.optimizationStats.totalFiles++;
        }
    }

    /**
     * Optimize single audio file
     * @param {string} filePath - Path to audio file
     */
    async optimizeAudioFile(filePath) {
        const stats = fs.statSync(filePath);
        this.optimizationStats.originalSize += stats.size;
        
        // For now, just copy the file (in a real implementation, you'd use audio optimization)
        const relativePath = path.relative(this.assetsDir, filePath);
        const destPath = path.join(this.distAssetsDir, relativePath);
        
        // Ensure destination directory exists
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        // Copy file (placeholder for actual optimization)
        fs.copyFileSync(filePath, destPath);
        
        const optimizedStats = fs.statSync(destPath);
        this.optimizationStats.optimizedSize += optimizedStats.size;
        
        console.log(`  ✓ Optimized: ${relativePath}`);
    }

    /**
     * Optimize data files (JSON, etc.)
     */
    async optimizeData() {
        console.log('📄 Optimizing data files...');
        
        const dataExtensions = ['.json'];
        const dataFiles = this.findFilesByExtensions(this.assetsDir, dataExtensions);
        
        for (const filePath of dataFiles) {
            try {
                await this.optimizeDataFile(filePath);
                this.optimizationStats.optimizedFiles++;
            } catch (error) {
                this.optimizationStats.errors.push(`Data optimization failed for ${filePath}: ${error.message}`);
            }
            this.optimizationStats.totalFiles++;
        }
    }

    /**
     * Optimize single data file
     * @param {string} filePath - Path to data file
     */
    async optimizeDataFile(filePath) {
        const stats = fs.statSync(filePath);
        this.optimizationStats.originalSize += stats.size;
        
        const relativePath = path.relative(this.assetsDir, filePath);
        const destPath = path.join(this.distAssetsDir, relativePath);
        
        // Ensure destination directory exists
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        if (path.extname(filePath) === '.json') {
            // Minify JSON
            const jsonContent = fs.readFileSync(filePath, 'utf8');
            const parsedJson = JSON.parse(jsonContent);
            const minifiedJson = JSON.stringify(parsedJson);
            
            fs.writeFileSync(destPath, minifiedJson);
        } else {
            // Just copy other data files
            fs.copyFileSync(filePath, destPath);
        }
        
        const optimizedStats = fs.statSync(destPath);
        this.optimizationStats.optimizedSize += optimizedStats.size;
        
        console.log(`  ✓ Optimized: ${relativePath}`);
    }

    /**
     * Generate asset manifest for efficient loading
     */
    async generateAssetManifest() {
        console.log('📋 Generating asset manifest...');
        
        const manifest = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            assets: {}
        };
        
        // Scan all optimized assets
        const allFiles = this.findAllFiles(this.distAssetsDir);
        
        for (const filePath of allFiles) {
            const relativePath = path.relative(this.distAssetsDir, filePath);
            const stats = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            let category = 'other';
            if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
                category = 'images';
            } else if (['.ogg', '.mp3', '.wav'].includes(ext)) {
                category = 'audio';
            } else if (['.json'].includes(ext)) {
                category = 'data';
            }
            
            if (!manifest.assets[category]) {
                manifest.assets[category] = {};
            }
            
            const assetKey = path.basename(filePath, ext);
            manifest.assets[category][assetKey] = {
                url: `assets/${relativePath}`,
                size: stats.size,
                type: this.getAssetType(ext),
                lastModified: stats.mtime.toISOString()
            };
        }
        
        // Write manifest
        const manifestPath = path.join(this.distAssetsDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log(`  ✓ Generated manifest with ${Object.keys(manifest.assets).length} categories`);
    }

    /**
     * Get asset type based on extension
     * @param {string} ext - File extension
     * @returns {string} Asset type
     */
    getAssetType(ext) {
        const typeMap = {
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.gif': 'image',
            '.ogg': 'audio',
            '.mp3': 'audio',
            '.wav': 'audio',
            '.json': 'json'
        };
        
        return typeMap[ext] || 'file';
    }

    /**
     * Find files by extensions
     * @param {string} dir - Directory to search
     * @param {string[]} extensions - File extensions to find
     * @returns {string[]} Array of file paths
     */
    findFilesByExtensions(dir, extensions) {
        const files = [];
        
        const scanDir = (currentDir) => {
            if (!fs.existsSync(currentDir)) return;
            
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    scanDir(itemPath);
                } else if (extensions.includes(path.extname(item).toLowerCase())) {
                    files.push(itemPath);
                }
            }
        };
        
        scanDir(dir);
        return files;
    }

    /**
     * Find all files in directory
     * @param {string} dir - Directory to search
     * @returns {string[]} Array of file paths
     */
    findAllFiles(dir) {
        const files = [];
        
        const scanDir = (currentDir) => {
            if (!fs.existsSync(currentDir)) return;
            
            const items = fs.readdirSync(currentDir);
            
            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const stats = fs.statSync(itemPath);
                
                if (stats.isDirectory()) {
                    scanDir(itemPath);
                } else {
                    files.push(itemPath);
                }
            }
        };
        
        scanDir(dir);
        return files;
    }

    /**
     * Print optimization report
     */
    printOptimizationReport() {
        console.log('\n📊 Optimization Report:');
        console.log('========================');
        console.log(`Total files processed: ${this.optimizationStats.totalFiles}`);
        console.log(`Successfully optimized: ${this.optimizationStats.optimizedFiles}`);
        console.log(`Original size: ${this.formatBytes(this.optimizationStats.originalSize)}`);
        console.log(`Optimized size: ${this.formatBytes(this.optimizationStats.optimizedSize)}`);
        
        const savings = this.optimizationStats.originalSize - this.optimizationStats.optimizedSize;
        const savingsPercent = this.optimizationStats.originalSize > 0 
            ? ((savings / this.optimizationStats.originalSize) * 100).toFixed(1)
            : 0;
        
        console.log(`Space saved: ${this.formatBytes(savings)} (${savingsPercent}%)`);
        
        if (this.optimizationStats.errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            this.optimizationStats.errors.forEach(error => {
                console.log(`  - ${error}`);
            });
        }
    }

    /**
     * Format bytes to human readable string
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Run optimization if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const optimizer = new AssetOptimizer();
    optimizer.optimize().catch(console.error);
}

export default AssetOptimizer;