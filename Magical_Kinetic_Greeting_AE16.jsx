/*
  Magical Kinetic Greeting AE16.jsx
  Target: Adobe After Effects 16.1.0

  To run: File -> Scripts -> Run Script File -> Magical_Kinetic_Greeting_AE16.jsx

  =========================================
  HOW TO EDIT PHRASES:
  Modify the PHRASES array below.
  Format: ["Text phrase", startTimeSeconds, endTimeSeconds, fontSize]
  =========================================
*/

// --- Settings ---
var COMP_WIDTH = 1080;
var COMP_HEIGHT = 1920;
var COMP_FPS = 24;
var COMP_FALLBACK_DURATION = 15.0;

// Text styling
var TEXT_COLOR = [0.98, 0.96, 0.90]; // Warm ivory / champagne (RGB 0-1)
var GLOW_COLOR = [0.85, 0.75, 0.45]; // Soft gold
var SHADOW_COLOR = [0.1, 0.08, 0.08]; // Soft dark shadow
var TEXT_FONT = "Arial"; // Fallback to safe font
var TEXT_Y_POS = COMP_HEIGHT * 0.3; // Upper third

// Animation timings
var FADE_DURATION = 0.5; // seconds
var RISE_AMOUNT = 40; // pixels
var BLUR_AMOUNT = 15; // pixels
var GLOW_BLUR_AMOUNT = 40; // pixels
var GLOW_OPACITY = 60; // percent

var PHRASES = [
  ["Пусть сегодня", 0.75, 2.55, 78],
  ["случится чудо", 2.55, 4.35, 82],
  ["пусть мечты", 4.35, 6.15, 78],
  ["станут ближе", 6.15, 7.95, 80],
  ["а в сердце", 7.95, 9.70, 78],
  ["будет свет", 9.70, 11.45, 82],
  ["С днём рождения!", 11.70, 15.00, 92]
];

// Helper: safe add effect
function safeAddEffect(layer, matchNames) {
    var effect = null;
    for (var i = 0; i < matchNames.length; i++) {
        if (layer.effects.canAddProperty(matchNames[i])) {
            try {
                effect = layer.effects.addProperty(matchNames[i]);
                if (effect != null) {
                    return effect;
                }
            } catch (e) {
                // Ignore and try next
            }
        }
    }
    return null;
}

// Helper: ease all keys
function easeAllKeys(property) {
    if (property.numKeys > 0) {
        var easeIn = new KeyframeEase(0, 33);
        var easeOut = new KeyframeEase(0, 33);
        for (var i = 1; i <= property.numKeys; i++) {
            try {
                property.setTemporalEaseAtKey(i, [easeIn], [easeOut]);
            } catch(e) {
                // Ignore if easing fails for single dimension, try 2 dimensions (e.g. 2D Position)
                try {
                    property.setTemporalEaseAtKey(i, [easeIn, easeIn], [easeOut, easeOut]);
                } catch(e2) {
                    // Try 3 dimensions (e.g. 3D Position)
                    try {
                        property.setTemporalEaseAtKey(i, [easeIn, easeIn, easeIn], [easeOut, easeOut, easeOut]);
                    } catch(e3) {
                        // Ignore if all fails
                    }
                }
            }
        }
    }
}

// Helper: Apply Text Style
function applyTextStyle(layer, textContent, fontSize, isFinal, isGlow) {
    var textProp = layer.property("Source Text");
    var textDocument = textProp.value;
    textDocument.text = textContent;
    textDocument.fontSize = fontSize;
    if (isFinal) {
        textDocument.fontSize = fontSize * 1.05; // Slightly larger for final hero greeting
    }

    textDocument.fillColor = isGlow ? GLOW_COLOR : TEXT_COLOR;
    textDocument.applyFill = true;
    textDocument.applyStroke = false;
    textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;

    textProp.setValue(textDocument);
}

// Helper: Add Text Phrase (creates main text and fake glow duplicate)
function addTextPhrase(comp, textContent, start, end, fontSize, isFinal) {
    // 1. Fake Glow Layer (bottom)
    var glowLayer = comp.layers.addText(textContent);
    glowLayer.name = textContent + " (Glow)";
    glowLayer.startTime = start;
    glowLayer.outPoint = end;
    glowLayer.blendingMode = BlendingMode.ADD;

    applyTextStyle(glowLayer, textContent, fontSize, isFinal, true);

    // Position
    glowLayer.property("Position").setValue([COMP_WIDTH / 2, TEXT_Y_POS]);

    // Glow animation & style
    glowLayer.property("Opacity").setValue(GLOW_OPACITY);
    var glowBlur = safeAddEffect(glowLayer, ["ADBE Gaussian Blur 2", "ADBE Gaussian Blur"]);
    if (glowBlur != null) {
        glowBlur.property(1).setValue(GLOW_BLUR_AMOUNT); // Bluriness
    }

    // Fade & Rise
    var gPos = glowLayer.property("Position");
    var gOp = glowLayer.property("Opacity");

    gOp.setValueAtTime(start, 0);
    gOp.setValueAtTime(start + FADE_DURATION, GLOW_OPACITY);
    if (!isFinal) {
        gOp.setValueAtTime(end - FADE_DURATION, GLOW_OPACITY);
        gOp.setValueAtTime(end, 0);
    }

    var startY = TEXT_Y_POS + RISE_AMOUNT;
    var endY = TEXT_Y_POS;
    var driftY = TEXT_Y_POS - (RISE_AMOUNT * 0.5);

    gPos.setValueAtTime(start, [COMP_WIDTH / 2, startY]);
    gPos.setValueAtTime(start + FADE_DURATION, [COMP_WIDTH / 2, endY]);
    gPos.setValueAtTime(end, [COMP_WIDTH / 2, driftY]);

    easeAllKeys(gPos);
    easeAllKeys(gOp);

    // 2. Main Text Layer (top)
    var mainLayer = comp.layers.addText(textContent);
    mainLayer.name = textContent;
    mainLayer.startTime = start;
    mainLayer.outPoint = end;

    applyTextStyle(mainLayer, textContent, fontSize, isFinal, false);

    // Add Drop Shadow
    var dropShadow = safeAddEffect(mainLayer, ["ADBE Drop Shadow"]);
    if (dropShadow != null) {
        try { dropShadow.property(1).setValue(SHADOW_COLOR); } catch(e){} // Color
        try { dropShadow.property(2).setValue(128); } catch(e){} // Opacity
        try { dropShadow.property(4).setValue(5); } catch(e){} // Distance
        try { dropShadow.property(5).setValue(20); } catch(e){} // Softness
    }

    // Main text animation (Fade, Rise, Sharp from blur)
    var mPos = mainLayer.property("Position");
    var mOp = mainLayer.property("Opacity");

    mOp.setValueAtTime(start, 0);
    mOp.setValueAtTime(start + FADE_DURATION, 100);
    if (!isFinal) {
        mOp.setValueAtTime(end - FADE_DURATION, 100);
        mOp.setValueAtTime(end, 0);
    }

    mPos.setValueAtTime(start, [COMP_WIDTH / 2, startY]);
    mPos.setValueAtTime(start + FADE_DURATION, [COMP_WIDTH / 2, endY]);
    mPos.setValueAtTime(end, [COMP_WIDTH / 2, driftY]);

    easeAllKeys(mPos);
    easeAllKeys(mOp);

    // Blur to sharp
    var mainBlur = safeAddEffect(mainLayer, ["ADBE Gaussian Blur 2", "ADBE Gaussian Blur"]);
    if (mainBlur != null) {
        var blurProp = mainBlur.property(1); // Blurriness
        blurProp.setValueAtTime(start, BLUR_AMOUNT);
        blurProp.setValueAtTime(start + FADE_DURATION, 0);
        if (!isFinal) {
            blurProp.setValueAtTime(end - FADE_DURATION, 0);
            blurProp.setValueAtTime(end, BLUR_AMOUNT);
        }
        easeAllKeys(blurProp);
    }
}

// Main execution function
function main() {
    // Ensure we are running inside After Effects
    if (typeof app === "undefined") {
        return;
    }

    app.beginUndoGroup("Magical Greeting Script");

    // 1. Select Video File
    var fileFilter = "Video Files:*.mp4;*.mov;*.m4v,All Files:*.*";
    if ($.os.indexOf("Mac") !== -1) {
        // macOS file filter is a function
        fileFilter = function(f) {
            var name = f.name.toLowerCase();
            return name.indexOf(".mp4") !== -1 || name.indexOf(".mov") !== -1 || name.indexOf(".m4v") !== -1 || f.constructor.name === "Folder";
        };
    }

    var videoFile = File.openDialog("Select a source video (MP4/MOV/M4V)", fileFilter);
    if (!videoFile) {
        app.endUndoGroup();
        return; // User canceled
    }

    // 2. Import Video
    var importOptions = new ImportOptions(videoFile);
    if (!importOptions.canImportAs(ImportAsType.FOOTAGE)) {
        alert("Cannot import selected file as footage. Please select a valid video file.");
        app.endUndoGroup();
        return;
    }

    var videoItem = null;
    try {
        videoItem = app.project.importFile(importOptions);
    } catch (e) {
        alert("Failed to import video: " + e.toString());
        app.endUndoGroup();
        return;
    }

    // 3. Determine Duration
    var compDuration = COMP_FALLBACK_DURATION;
    if (videoItem.duration > 0) {
        compDuration = videoItem.duration;
    }

    // 4. Create Composition
    var comp = app.project.items.addComp(
        "Magical Greeting Text Template",
        COMP_WIDTH,
        COMP_HEIGHT,
        1.0,
        compDuration,
        COMP_FPS
    );

    // 5. Add Video to Comp and Scale
    var videoLayer = comp.layers.add(videoItem);

    // Scale to cover 1080x1920
    var scaleX = (COMP_WIDTH / videoItem.width) * 100;
    var scaleY = (COMP_HEIGHT / videoItem.height) * 100;
    var scaleMax = Math.max(scaleX, scaleY); // cover
    videoLayer.property("Scale").setValue([scaleMax, scaleMax]);

    // 6. Add Text Phrases
    for (var i = 0; i < PHRASES.length; i++) {
        var pText = PHRASES[i][0];
        var pStart = PHRASES[i][1];
        var pEnd = PHRASES[i][2];
        var pSize = PHRASES[i][3];
        var isFinal = (i === PHRASES.length - 1);

        addTextPhrase(comp, pText, pStart, pEnd, pSize, isFinal);
    }

    app.endUndoGroup();

    alert("Done. Composition 'Magical Greeting Text Template' was created in the Project panel.");
}

main();
