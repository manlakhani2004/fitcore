const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Post = require('../models/Post');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitcore';

async function seedCommunity() {
    try {
        console.log('Connecting to MongoDB at:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected successfully.\n');

        // 1. Fetch available users
        const users = await User.find();
        if (!users || users.length === 0) {
            console.error('No users found in database. Please run general seeder first.');
            process.exit(1);
        }

        const userMap = {};
        users.forEach(u => {
            userMap[u.email.toLowerCase()] = u;
        });

        // Find or reference key athletes & coaches
        const chris = userMap['chris@fitcore.com'] || users.find(u => u.name.includes('Chris')) || users[0];
        const goggins = userMap['david@fitcore.com'] || users.find(u => u.name.includes('David')) || users[1 % users.length];
        const elena = userMap['elena@fitcore.com'] || users.find(u => u.name.includes('Elena')) || users[2 % users.length];
        const mike = userMap['mike@fitcore.com'] || users.find(u => u.name.includes('Mike')) || users[3 % users.length];
        const anjali = userMap['anjalisutariya232@gmail.com'] || users.find(u => u.name.includes('Anjali')) || users[4 % users.length];
        const harsh = userMap['harsh@gmail.com'] || users.find(u => u.name.includes('Harsh')) || users[5 % users.length];
        const bhargavi = userMap['bhargavi@gmail.com'] || users.find(u => u.name.includes('Bhargavi')) || users[6 % users.length];
        const man = userMap['manblakhani@gmail.com'] || users.find(u => u.name.includes('Man')) || users[0];

        // 2. Enhance user profiles with avatars & professional bios
        console.log('--- Enhancing Athlete Profiles with Avatars & Bios ---');
        const profileUpdates = [
            {
                user: chris,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                bio: '5x Classic Physique Champion. Passionate about progressive overload, high-intensity training, and clean nutrition.'
            },
            {
                user: goggins,
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                bio: 'Stay Hard. Ultra-marathoner, former Navy SEAL, and relentless mindset coach. You haven’t tapped into 40% of your potential.'
            },
            {
                user: elena,
                avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
                bio: 'Head of Strength & Mobility @ FitCore. Specializing in powerlifting biomechanics, Olympic lifting, and active recovery.'
            },
            {
                user: mike,
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
                bio: 'Boxing Hall of Fame. Explosive conditioning, head movement, and core power. Discipline over motivation every single day.'
            },
            {
                user: anjali,
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
                bio: 'Certified Strength & Conditioning Specialist. Helping athletes shatter PRs and build sustainable, lifelong fitness habits.'
            },
            {
                user: harsh,
                avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
                bio: 'Competitive Powerlifter in training. Chasing a 220kg deadlift this season. Consistency is the secret sauce.'
            },
            {
                user: bhargavi,
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                bio: 'Dedicated FitCore athlete. Focused on hypertrophy, endurance running, and hitting daily macros with 100% adherence.'
            },
            {
                user: man,
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
                bio: 'FitCore Lead Engineer. Building the modern high-performance operating system for athletes, coaches, and gym leaders.'
            }
        ];

        for (const item of profileUpdates) {
            if (item.user && item.user._id) {
                await User.findByIdAndUpdate(item.user._id, {
                    avatar: item.avatar,
                    bio: item.bio
                });
                console.log(`Updated profile for ${item.user.name} (${item.user.role})`);
            }
        }

        // 3. Setup realistic Following/Followers network
        console.log('\n--- Building Social Graph (Followers & Following) ---');
        // Let Bhargavi follow Chris, Elena, and David Goggins
        if (bhargavi && chris && elena && goggins) {
            const bhargaviFollowing = [chris._id, elena._id, goggins._id];
            await User.findByIdAndUpdate(bhargavi._id, {
                $addToSet: { following: { $each: bhargaviFollowing } }
            });

            // Update their followers
            await User.findByIdAndUpdate(chris._id, { $addToSet: { followers: bhargavi._id, following: goggins._id } });
            await User.findByIdAndUpdate(elena._id, { $addToSet: { followers: bhargavi._id, following: chris._id } });
            await User.findByIdAndUpdate(goggins._id, { $addToSet: { followers: bhargavi._id, following: chris._id } });
            if (harsh) {
                await User.findByIdAndUpdate(harsh._id, { $addToSet: { following: elena._id, followers: elena._id } });
            }
            console.log(`Social connections established for Bhargavi, Chris, Elena, and David Goggins.`);
        }

        // 4. Clean up any existing seeded posts (keep genuine posts like 'look at fitmind ai' if desired, or remove old seeds)
        console.log('\n--- Preparing Community Posts ---');
        // Delete older generic test posts
        await Post.deleteMany({
            content: { 
                $in: [
                    'Just smashed a heavy chest session! Loving FitCore!',
                    'Just smashed a heavy chest session! Loving FitCore'
                ] 
            }
        });

        const now = new Date();
        const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);
        const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

        // Curated Community Posts
        const seedPosts = [
            {
                author: chris._id,
                content: `Leg day complete! 🦵 Hit 5 solid sets of barbell squats today with progressive overload. Started at 140kg and finished with a clean triple at 180kg. Remember: discipline in depth and form will always beat ego lifting. Keep grinding team! 🔥`,
                imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&auto=format&fit=crop&q=80',
                likes: [bhargavi._id, harsh._id, elena._id, man._id],
                comments: [
                    {
                        author: elena._id,
                        content: 'Incredible form on those squats Chris! Bar path was vertical all the way through.',
                        createdAt: hoursAgo(2)
                    },
                    {
                        author: bhargavi._id,
                        content: 'Super inspiring! Motivated to hit my leg day tomorrow morning 💪',
                        createdAt: hoursAgo(1)
                    }
                ],
                createdAt: hoursAgo(4)
            },
            {
                author: goggins._id,
                content: `04:30 AM. 15-mile ruck run in the rain done. The voice in your head will try to tell you to stay under the warm sheets. Don't negotiate with weakness. When your mind tells you you're done, you're only 40% in. STAY HARD! 🌧️🏃‍♂️`,
                imageUrl: 'https://images.unsplash.com/photo-1486218119243-13883505764c?w=1200&auto=format&fit=crop&q=80',
                likes: [chris._id, harsh._id, bhargavi._id, mike._id, anjali._id],
                comments: [
                    {
                        author: harsh._id,
                        content: 'No excuses. Heading out for morning conditioning now!',
                        createdAt: hoursAgo(5)
                    },
                    {
                        author: chris._id,
                        content: 'Absolute machine David! 🔥',
                        createdAt: hoursAgo(4)
                    }
                ],
                createdAt: hoursAgo(8)
            },
            {
                author: elena._id,
                content: `Coach Tip of the Week: Prioritize shoulder mobility before pressing days! A simple 5-minute circuit of band pull-aparts, face pulls, and thoracic extensions will bulletproof your rotator cuffs and add kilos to your bench press. Try it in your next session! 🏋️‍♀️✨`,
                imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
                likes: [bhargavi._id, anjali._id, harsh._id],
                comments: [
                    {
                        author: bhargavi._id,
                        content: 'Started adding this to my warm-up last week and my shoulder impingement is completely gone! Thank you Coach Elena! 🙌',
                        createdAt: hoursAgo(10)
                    }
                ],
                createdAt: hoursAgo(12)
            },
            {
                author: harsh._id,
                content: `NEW PERSONAL RECORD! 🚀 Finally locked out 210kg (463 lbs) on the conventional deadlift today! Shoutout to Coach Elena for the cue to drive through the heels and engage the lats off the floor. We are just getting started!`,
                imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
                likes: [chris._id, elena._id, bhargavi._id, man._id],
                comments: [
                    {
                        author: elena._id,
                        content: 'Proud of the patience and consistency Harsh! That lock-out was rock solid! 👏',
                        createdAt: hoursAgo(14)
                    },
                    {
                        author: bhargavi._id,
                        content: 'Huge milestone! Congratulations Harsh! 💥',
                        createdAt: hoursAgo(13)
                    }
                ],
                createdAt: daysAgo(1)
            },
            {
                author: anjali._id,
                content: `Nutrition prep Sunday! 🥗 Macro targets for the week: 185g Protein, 260g Clean Carbs, 65g Healthy Fats. Prepared grilled lemon herb chicken breast, sweet potato medallions, and charred asparagus bowls. Fail to prepare, prepare to fail! What's on your prep menu this week?`,
                imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=80',
                likes: [bhargavi._id, chris._id, elena._id, harsh._id],
                comments: [
                    {
                        author: bhargavi._id,
                        content: 'Looks delicious! Do you weigh your sweet potatoes raw or cooked?',
                        createdAt: daysAgo(1)
                    },
                    {
                        author: anjali._id,
                        content: '@Bhargavi Always weigh raw for accurate macro tracking, but consistency is what matters most!',
                        createdAt: daysAgo(1)
                    }
                ],
                createdAt: daysAgo(2)
            },
            {
                author: mike._id,
                content: `12 rounds on the heavy bag, 500 pushups, and 1,000 jump rope turns. Iron sharpens iron. When you step into that ring or the gym, leave your doubts outside. Your only opponent in the mirror is you. 🥊⚡`,
                imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&auto=format&fit=crop&q=80',
                likes: [goggins._id, chris._id, harsh._id, man._id],
                comments: [
                    {
                        author: goggins._id,
                        content: 'Truth right there Mike. Pressure creates diamonds.',
                        createdAt: daysAgo(2)
                    }
                ],
                createdAt: daysAgo(3)
            },
            {
                author: bhargavi._id,
                content: `Crushed a 45-minute HIIT and Core blast this evening! 🔥 Completed all 4 rounds without taking extra rest. Feeling stronger and more energized every week with FitCore.`,
                imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
                likes: [chris._id, elena._id, harsh._id, anjali._id],
                comments: [
                    {
                        author: elena._id,
                        content: 'Incredible work ethic Bhargavi! Keep that momentum going into your next check-in.',
                        createdAt: daysAgo(3)
                    }
                ],
                createdAt: daysAgo(3)
            },
            {
                author: man._id,
                content: `Excited to launch our community feed updates! 🎉 Now featuring seamless photo sharing, athlete profiles, follow feeds, and interactive comments. Let us know your feedback and keep sharing your fitness journey! 🚀`,
                imageUrl: '',
                likes: [bhargavi._id, chris._id, elena._id, goggins._id, harsh._id, mike._id],
                comments: [
                    {
                        author: chris._id,
                        content: 'Loving the new interface! Super clean and fast.',
                        createdAt: daysAgo(4)
                    }
                ],
                createdAt: daysAgo(4)
            }
        ];

        console.log(`Inserting ${seedPosts.length} rich community posts...`);
        for (const postData of seedPosts) {
            await Post.create(postData);
        }

        console.log('\n========================================');
        console.log('✅ COMMUNITY SEEDING COMPLETED SUCCESSFULLY!');
        console.log(`- Updated ${profileUpdates.length} athlete profiles with avatars & bios.`);
        console.log(`- Created following/followers relationships.`);
        console.log(`- Inserted ${seedPosts.length} engaging posts with high-res photos, comments, and likes.`);
        console.log('========================================\n');

    } catch (err) {
        console.error('Error seeding community:', err);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected.');
    }
}

seedCommunity();
