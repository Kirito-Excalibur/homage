const fs = require('fs');
const path = require('path');

// Audio file definitions
const audioFiles = {
    music: [
        'menu_theme.ogg',
        'world_ambient.ogg', 
        'loading_theme.ogg'
    ],
    sfx: [
        'dialogue_open.ogg',
        'dialogue_next.ogg',
        'power_unlock.ogg',
        'power_activate.ogg',
        'item_pickup.ogg',
        'checkpoint.ogg',
        'menu_select.ogg',
        'footstep.ogg',
        'interact.ogg',
        'attack.ogg',
        'hit.ogg',
        'defeat.ogg',
        'story_complete.ogg'
    ]
};

// Create minimal OGG file header (silent audio)
function createSilentOggFile() {
    // Minimal OGG Vorbis header for a silent file
    const oggHeader = Buffer.from([
        0x4F, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x1E, 0x01, 0x76, 0x6F, 0x72,
        0x62, 0x69, 0x73, 0x00, 0x00, 0x00, 0x00, 0x01, 0x44, 0xAC, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0xEE, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xB8, 0x01
    ]);
    return oggHeader;
}

// Generate audio files
function generateAudioFiles() {
    console.log('Generating placeholder audio files...');
    
    Object.entries(audioFiles).forEach(([category, files]) => {
        const categoryPath = path.join('src', 'assets', 'audio', category);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(categoryPath)) {
            fs.mkdirSync(categoryPath, { recursive: true });
            console.log(`Created directory: ${categoryPath}`);
        }
        
        files.forEach(filename => {
            const filePath = path.join(categoryPath, filename);
            
            if (!fs.existsSync(filePath)) {
                const audioData = createSilentOggFile();
                fs.writeFileSync(filePath, audioData);
                console.log(`Generated: ${filePath}`);
            } else {
                console.log(`Skipped existing: ${filePath}`);
            }
        });
    });
    
    console.log('Audio placeholder generation complete!');
}

// Run the generator
generateAudioFiles();