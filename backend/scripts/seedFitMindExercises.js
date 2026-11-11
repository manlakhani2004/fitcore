const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Exercise = require('../models/Exercise');

const mapBodyPart = (bodyPart) => {
  const bp = (bodyPart || '').toLowerCase();
  if (bp === 'chest') return 'Chest';
  if (bp === 'back') return 'Back';
  if (bp === 'legs') return 'Legs';
  if (bp === 'shoulders') return 'Shoulders';
  if (bp === 'core') return 'Core';
  if (bp === 'arms') return 'Arms';
  if (bp === 'cardio') return 'Cardio';
  return 'General';
};

const mapEquipment = (eq) => {
  if (!eq) return 'Bodyweight';
  const val = eq.toLowerCase();
  if (val === 'barbell') return 'Barbell';
  if (val === 'dumbbell') return 'Dumbbell';
  if (val === 'cable') return 'Cable';
  if (val === 'bodyweight') return 'Bodyweight';
  if (val === 'band') return 'Resistance Band';
  if (val === 'kettlebell') return 'Kettlebell';
  if (val === 'smith') return 'Smith Machine';
  if (val === 'ez-bar') return 'EZ-Bar';
  if (val === 'lever' || val === 'machine') return 'Machine';
  return val.charAt(0).toUpperCase() + val.slice(1);
};

const classifyDifficulty = (name, equipment, category) => {
  const n = (name || '').toLowerCase().trim();
  const eq = (equipment || '').toLowerCase().trim();
  const cat = (category || '').toLowerCase().trim();

  const advancedKeys = [
    'front lever', 'back lever', 'planche', 'human flag', 'dragon flag',
    'muscle up', 'muscle-up', 'handstand', 'pistol squat', 'iron cross',
    'l-sit', 'v-sit', 'snatch', 'clean and jerk', 'clean & jerk',
    'power clean', 'overhead squat', 'deficit deadlift', 'box jump'
  ];
  if (advancedKeys.some(k => n.includes(k)) || cat === 'plyometrics') {
    return 'advanced';
  }

  const beginnerKeys = [
    'assisted', 'wall', 'knee push', 'incline push', 'bird dog', 'dead bug',
    'cat cow', 'glute bridge', 'wrist curl', 'calf raise', 'shrug', 'step up',
    'pec deck', 'butterfly', 'cable pushdown', 'lat pulldown', 'leg extension',
    'leg curl', 'plank', 'crunch', 'bicep curl', 'lateral raise'
  ];
  if (
    beginnerKeys.some(k => n.includes(k)) || 
    ['lever', 'machine', 'band'].includes(eq) ||
    ['stretching', 'flexibility', 'warmup'].includes(cat)
  ) {
    return 'beginner';
  }

  return 'intermediate';
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for FitMindAI Exercise migration...');

    const rawDataPath = path.join(__dirname, '../data/fitmind_exercises.json');
    if (!fs.existsSync(rawDataPath)) {
      console.error(`Dataset not found at ${rawDataPath}`);
      process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));
    const rawExercises = rawData.exercises || [];
    console.log(`Loaded ${rawExercises.length} raw exercises from FitMindAI dataset.`);

    console.log('Wiping previous exercise collection...');
    await Exercise.deleteMany({});

    const formattedExercises = rawExercises.map((raw) => {
      const primaryGroup = mapBodyPart(raw.bodyPart);
      const secondaryGroups = (raw.secondaryMuscles || []).map(m => m.charAt(0).toUpperCase() + m.slice(1));
      const muscleGroups = Array.from(new Set([primaryGroup, ...secondaryGroups]));

      const equipmentItem = mapEquipment(raw.equipment);
      const difficulty = classifyDifficulty(raw.name, raw.equipment, raw.category);

      return {
        name: raw.name,
        description: raw.description || `${raw.name} is a targeted ${raw.category || 'strength'} movement focused on the ${raw.muscle || primaryGroup} using ${equipmentItem}.`,
        muscleGroups: muscleGroups,
        equipment: [equipmentItem],
        difficulty: difficulty,
        thumbnailUrl: raw.thumbUrl || raw.gifUrl,
        videoUrl: raw.gifUrl,
        instructions: raw.instructions && raw.instructions.length > 0 
          ? raw.instructions 
          : [
              'Assume the starting position with proper spinal alignment and abdominal bracing.',
              'Control the movement through the full active range of motion.',
              'Squeeze the target musculature at peak contraction.',
              'Return to start position controlling the eccentric lowering phase.'
            ],
        sets: 3,
        reps: primaryGroup === 'Core' ? 15 : 10,
        restTime: difficulty === 'advanced' ? 90 : 60
      };
    });

    console.log(`Inserting ${formattedExercises.length} FitMindAI exercises into FitCore...`);
    // Insert in batches of 200 for maximum performance
    const batchSize = 200;
    for (let i = 0; i < formattedExercises.length; i += batchSize) {
      const batch = formattedExercises.slice(i, i + batchSize);
      await Exercise.insertMany(batch);
      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1} (${Math.min(i + batchSize, formattedExercises.length)} / ${formattedExercises.length})`);
    }

    console.log(`[SUCCESS] All ${formattedExercises.length} FitMindAI exercises with animated GIFs successfully imported into FitCore!`);
    process.exit(0);
  } catch (err) {
    console.error('FitMindAI Seeding error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
