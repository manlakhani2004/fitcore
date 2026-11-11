const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Exercise = require('../models/Exercise');

const exercises = [
  // CHEST
  {
    name: 'Barbell Bench Press',
    description: 'The king of upper body horizontal pushing movements. Builds raw mass and power across the pectoralis major, anterior deltoids, and triceps.',
    muscleGroups: ['Chest', 'Shoulders'],
    equipment: ['Barbell', 'Bench'],
    difficulty: 'intermediate',
    sets: 4,
    reps: 8,
    restTime: 120,
    instructions: [
      'Lie flat on the bench with eyes directly under the racked bar. Plant feet firmly into the floor.',
      'Grip the bar slightly wider than shoulder-width with wrists stacked straight over elbows.',
      'Unrack the bar, retract your scapulae, and lower the bar under control to the lower-sternum.',
      'Press powerfully upward and slightly backward toward your eye line while driving through your feet.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Incline Dumbbell Press',
    description: 'Targets the clavicular head (upper chest) and front deltoids with a greater range of motion and joint-friendly wrist freedom.',
    muscleGroups: ['Chest', 'Shoulders'],
    equipment: ['Dumbbell', 'Bench'],
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 90,
    instructions: [
      'Set an adjustable bench to a 30° to 45° angle.',
      'Kick the dumbbells up with your knees and press them overhead into the starting position.',
      'Lower the dumbbells steadily with elbows angled at roughly 45° from your torso.',
      'Feel a deep stretch across the upper chest, then press back up until dumbbells almost touch.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cable Chest Flyes',
    description: 'Provides constant continuous tension through the entire horizontal adduction arc, maximizing chest peak contraction.',
    muscleGroups: ['Chest'],
    equipment: ['Cable'],
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Set cable pulleys at chest height. Take one handle in each hand and step forward into a staggered stance.',
      'Maintain a slight bend in your elbows and open your arms until you feel a wide chest stretch.',
      'Contract your pectorals to bring your hands together in an hugging arc in front of your sternum.',
      'Squeeze hard at peak contraction for 1 second before slowly reversing the motion.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Push-Ups',
    description: 'Fundamental closed-chain bodyweight movement that develops chest strength, shoulder stability, and core rigidity.',
    muscleGroups: ['Chest', 'Core'],
    equipment: ['Bodyweight'],
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 60,
    instructions: [
      'Begin in a high plank position with hands slightly wider than shoulder-width and fingers splayed.',
      'Brace your glutes and core to keep your body in a straight line from heels to crown.',
      'Lower your chest until it hovers an inch above the floor, keeping elbows at a 45° angle.',
      'Drive through your palms to return to the top, fully protracting your shoulder blades at lockout.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Parallel Bar Dips',
    description: 'A powerful compound movement emphasizing the lower pectoral fibres, anterior deltoids, and tricep extensors.',
    muscleGroups: ['Chest', 'Arms'],
    equipment: ['Bodyweight', 'Parallel Bars'],
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    instructions: [
      'Mount the parallel bars and lock out your arms.',
      'Lean your torso forward 20-30° with knees bent and feet crossed to emphasize chest activation.',
      'Lower your body smoothly until your upper arms are at least parallel to the floor.',
      'Press through the heels of your palms to return to full arm extension.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600&auto=format&fit=crop&q=80'
  },

  // BACK
  {
    name: 'Conventional Barbell Deadlift',
    description: 'The ultimate posterior chain lift recruiting the entire spinal erector system, lats, glutes, and hamstrings for total body power.',
    muscleGroups: ['Back', 'Legs'],
    equipment: ['Barbell'],
    difficulty: 'advanced',
    sets: 4,
    reps: 5,
    restTime: 180,
    instructions: [
      'Stand with mid-foot directly under the bar, hip-width stance.',
      'Hinge at the hips and grip the bar just outside your shins.',
      'Drop hips, pull slack out of the bar, pack your lats, and brace your diaphragm.',
      'Drive the floor away with your legs, keeping the bar glued close to your shins and thighs.',
      'Stand tall and lock out hips and knees simultaneously without hyperextending the lower back.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Pull-Ups',
    description: 'Gold-standard vertical pulling exercise that sculpts back width (V-taper) and upper-body relative strength.',
    muscleGroups: ['Back', 'Arms'],
    equipment: ['Pull-Up Bar', 'Bodyweight'],
    difficulty: 'intermediate',
    sets: 4,
    reps: 8,
    restTime: 90,
    instructions: [
      'Grip the overhead bar with an overhand (pronated) grip slightly wider than shoulders.',
      'Hang at dead-hang with engaged shoulders; initiate the movement by depressing your scapulae.',
      'Pull your chest up toward the bar, driving elbows down and back.',
      'Clear your chin over the bar, hold briefly, then lower with a strict 3-second eccentric tempo.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Barbell Bent-Over Row',
    description: 'Builds dense lat thickness, rhomboid thickness, and mid-back muscle while demanding isometric lumbar stabilization.',
    muscleGroups: ['Back'],
    equipment: ['Barbell'],
    difficulty: 'intermediate',
    sets: 4,
    reps: 8,
    restTime: 90,
    instructions: [
      'Hinge at the hips with knees slightly bent until your torso is at roughly 45° to the floor.',
      'Grip the barbell overhand and pull the weight toward your navel.',
      'Retract your shoulder blades and drive elbows high, squeezing the mid-back at the top.',
      'Lower the bar under control without rounding your lumbar spine.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Lat Pulldown',
    description: 'Cable-based vertical pulling movement allowing precise lat overload with adjustable grip widths.',
    muscleGroups: ['Back'],
    equipment: ['Cable', 'Machine'],
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Sit securely with thigh pads locked snug over your quads.',
      'Grip the wide bar with an overhand grip, lean back approximately 10-15°.',
      'Pull the bar down smoothly to upper chest level, leading with your elbows.',
      'Control the ascent to allow a deep overhead stretch in your lats at the top.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Seated Cable Row',
    description: 'Horizontal pulling staple for building mid-back thickness, rhomboids, and lower lat recruitment.',
    muscleGroups: ['Back'],
    equipment: ['Cable', 'Machine'],
    difficulty: 'beginner',
    sets: 3,
    reps: 10,
    restTime: 60,
    instructions: [
      'Sit on the bench with feet on footplates and a slight bend in the knees.',
      'Reach forward to grip the V-handle, sit upright with a flat neutral back.',
      'Pull the handle into your abdomen while driving your elbows backwards and squeezing your shoulder blades together.',
      'Slowly extend arms forward for a full stretch before repeating.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'
  },

  // LEGS
  {
    name: 'Barbell Back Squat',
    description: 'The foundation of lower-body development. Recruits quadriceps, adductors, glutes, and spinal erectors for total leg mass.',
    muscleGroups: ['Legs', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    difficulty: 'intermediate',
    sets: 4,
    reps: 8,
    restTime: 120,
    instructions: [
      'Rest the bar across your upper traps (high bar) or rear delts (low bar). Stand shoulder-width apart, toes flared slightly out.',
      'Inhale deeply into your belly and brace your core 360 degrees.',
      'Break at the hips and knees simultaneously, descending until the hip crease dips below the top of the kneecap.',
      'Drive aggressively through the middle of the foot to return to the starting position.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Romanian Deadlift (RDL)',
    description: 'Premier hamstring and glute hypertrophy hinge. Emphasizes loaded eccentric elongation of the posterior chain.',
    muscleGroups: ['Legs', 'Back'],
    equipment: ['Barbell', 'Dumbbell'],
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 90,
    instructions: [
      'Stand holding the barbell at hip height with an overhand grip.',
      'Maintain soft knees and push your hips as far back as possible as if touching a wall behind you.',
      'Lower the bar close along your thighs and shins until you feel an intense stretch in the hamstrings.',
      'Engage glutes and hamstrings to drive hips forward back into lockout.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Leg Press (45 Degree)',
    description: 'High-volume quad and glute builder that minimizes axial spinal compression.',
    muscleGroups: ['Legs'],
    equipment: ['Machine'],
    difficulty: 'beginner',
    sets: 4,
    reps: 12,
    restTime: 90,
    instructions: [
      'Position feet shoulder-width apart on the sled platform.',
      'Release safety catches and lower the carriage smoothly until knees reach a 90° angle.',
      'Do not allow lower back or tailbone to lift off the padded backrest.',
      'Press the platform back up without hyper-locking your knees at the top.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Walking Dumbbell Lunges',
    description: 'Unilateral leg builder that improves balance, fixes strength asymmetries, and torches the glutes and quadriceps.',
    muscleGroups: ['Legs'],
    equipment: ['Dumbbell'],
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Hold a dumbbell in each hand at your sides, chest tall.',
      'Take a long stride forward, descending until both knees are bent at roughly 90 degrees.',
      'Ensure the front knee stays tracked over the second toe; rear knee hovers above the floor.',
      'Drive through the front heel to step forward into the next lunge step.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Lying Hamstring Leg Curl',
    description: 'Direct knee-flexion exercise isolating the biceps femoris, semitendinosus, and semimembranosus.',
    muscleGroups: ['Legs'],
    equipment: ['Machine'],
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Lie face down on the machine with the pad positioned just below the calf muscles.',
      'Keep hips pressed flat into the bench to avoid lumbar cheating.',
      'Curl the weight up towards your glutes as far as possible, holding peak tension for 1 second.',
      'Lower the weight back down slowly over 3 seconds.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80'
  },

  // SHOULDERS
  {
    name: 'Standing Overhead Barbell Press (OHP)',
    description: 'The supreme test of vertical pushing strength, developing 3D shoulder boulders, triceps, and core stabilization.',
    muscleGroups: ['Shoulders', 'Core'],
    equipment: ['Barbell'],
    difficulty: 'intermediate',
    sets: 4,
    reps: 6,
    restTime: 120,
    instructions: [
      'Grip the barbell at shoulder-width, resting it across your anterior delts and collarbone.',
      'Squeeze your glutes, flex your quads, and brace your abs to form a rigid pillar.',
      'Tilt your head slightly back as you press the bar straight up overhead.',
      'Once the bar clears your forehead, push your head through the "window" and lock out arms overhead.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Dumbbell Lateral Raises',
    description: 'The single most effective exercise for sculpting wide, capped lateral deltoids and creating an illusion of a narrower waist.',
    muscleGroups: ['Shoulders'],
    equipment: ['Dumbbell'],
    difficulty: 'beginner',
    sets: 4,
    reps: 15,
    restTime: 60,
    instructions: [
      'Stand with feet hip-width apart holding dumbbells slightly in front of your thighs.',
      'Lead with your elbows and raise arms out to the sides in the scapular plane (roughly 15° forward).',
      'Raise until weights are parallel to shoulders; imagine pouring water from pitchers at the top.',
      'Lower slowly over 2-3 seconds to maximize eccentric time under tension.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cable Face Pulls',
    description: 'Vital corrective posture exercise targeting the rear deltoids, rhomboids, and external rotator cuff.',
    muscleGroups: ['Shoulders', 'Back'],
    equipment: ['Cable', 'Rope Attachment'],
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 60,
    instructions: [
      'Set cable pulley at eye level with a rope attachment.',
      'Grip the rope with thumbs pointing back towards yourself.',
      'Step back, pull the centre of the rope directly towards your nose/eyes.',
      'Simultaneously externally rotate your shoulders so knuckles point back behind you at the end.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Seated Dumbbell Arnold Press',
    description: 'Pioneered by Arnold Schwarzenegger; rotates the wrist through the press to stimulate all three deltoid heads in one fluid rep.',
    muscleGroups: ['Shoulders'],
    equipment: ['Dumbbell', 'Bench'],
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 90,
    instructions: [
      'Sit upright with dumbbells held in front of your chest, palms facing towards your body.',
      'As you press upwards, rotate your wrists outward until palms face forward at full lockout.',
      'Reverse the rotational path smoothly as you descend back into the starting position.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80'
  },

  // CORE
  {
    name: 'Hanging Leg Raises',
    description: 'Elite lower-abdominal builder that activates the rectus abdominis through spinal flexion under gravity.',
    muscleGroups: ['Core'],
    equipment: ['Pull-Up Bar', 'Bodyweight'],
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Hang from a pull-up bar with straight arms and engaged lats.',
      'Without swinging your hips, curl your pelvis up and raise your legs until parallel with the floor or higher.',
      'Round your lower spine slightly at the top to fully contract the rectus abdominis.',
      'Control the descent to avoid momentum swings.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Weighted Plank',
    description: 'Isometric anti-extension core builder that strengthens the transverse abdominis and stabilizes the spine.',
    muscleGroups: ['Core'],
    equipment: ['Bodyweight', 'Weight Plate'],
    difficulty: 'beginner',
    duration: 60,
    sets: 3,
    reps: 1,
    restTime: 60,
    instructions: [
      'Set forearms on the floor with elbows directly under shoulders.',
      'Extend legs back on toes, squeeze glutes together, and draw navel firmly in toward the spine.',
      'Maintain a neutral spine without sagging hips or hiking your tailbone in the air.',
      'Hold position for the target duration while breathing rhythmically.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Cable Woodchoppers',
    description: 'Rotational core power exercise that sculpts the internal and external obliques.',
    muscleGroups: ['Core'],
    equipment: ['Cable'],
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 60,
    instructions: [
      'Attach a single handle to high pulley. Stand sideways to the cable stack, arms extended holding handle with both hands.',
      'Rotate your torso downward and across your body toward your opposite knee in a chopping motion.',
      'Pivot on the back foot as you twist, keeping arms relatively straight throughout.',
      'Slowly return to start position under control.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80'
  },
  {
    name: 'Ab Wheel Rollout',
    description: 'Advanced anti-extension core exercise placing immense eccentric strain on the entire abdominal wall.',
    muscleGroups: ['Core'],
    equipment: ['Ab Wheel', 'Bodyweight'],
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    instructions: [
      'Kneel on a soft mat holding the ab wheel directly below your shoulders.',
      'Round your upper back slightly and contract abs tightly.',
      'Roll the wheel slowly forward, extending your body as far as possible without letting your lower back sag.',
      'Use your abdominal muscles to pull the wheel back under your chest.'
    ],
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=80'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for exercise seeding...');

    // Clear existing or insert new
    const existing = await Exercise.countDocuments();
    if (existing > 0) {
      console.log(`Found ${existing} existing exercises. Updating/replacing...`);
      await Exercise.deleteMany({});
    }

    const created = await Exercise.insertMany(exercises);
    console.log(`Successfully seeded ${created.length} comprehensive exercises into FitCore!`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { exercises };