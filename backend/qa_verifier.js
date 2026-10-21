const http = require('http');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: parsed
                });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

// Extract cookies
function getCookie(res, name) {
    const setCookie = res.headers['set-cookie'];
    if (!setCookie) return null;
    for (const c of setCookie) {
        const match = c.match(new RegExp(`^${name}=([^;]+)`));
        if (match) return match[1];
    }
    return null;
}

async function runQA() {
    console.log('================================================================');
    console.log('     FITCORE SENIOR SOFTWARE ENGINEER & SENIOR QA AUDIT        ');
    console.log('================================================================\n');

    await mongoose.connect('mongodb://127.0.0.1:27017/fitcore', { directConnection: true });
    const User = require('./models/User');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function assert(name, condition, extraInfo = '') {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`  [PASS] ${name}`);
        } else {
            failedTests++;
            console.error(`  [FAIL] ${name} -> ${extraInfo}`);
        }
    }

    try {
        const timestamp = Date.now();
        const memberEmail = `qa_member_${timestamp}@fitcore.test`;
        const coachEmail = `qa_coach_${timestamp}@fitcore.test`;
        const adminEmail = `qa_admin_${timestamp}@fitcore.test`;
        const testPassword = 'Password123!';

        // 1. AUTHENTICATION & SECURITY TESTS
        console.log('\n--- 1. Authentication & Security Suite ---');
        
        // 1.1 Rate limiting on empty body
        const badReg = await request('POST', '/api/auth/register', {});
        assert('Register handles empty payload with 400 Bad Request', badReg.status === 400);

        // 1.2 Register QA Member
        const regMember = await request('POST', '/api/auth/register', {
            name: 'QA Member',
            email: memberEmail,
            password: testPassword,
            role: 'member'
        });
        assert('Register Member successfully returns 201', regMember.status === 201 && regMember.data.success);
        const memberToken = getCookie(regMember, 'token');
        assert('Member JWT auth cookie set', !!memberToken);

        const memberHeaders = { Cookie: `token=${memberToken}` };

        // 1.3 Register QA Coach
        const regCoach = await request('POST', '/api/auth/register', {
            name: 'QA Coach',
            email: coachEmail,
            password: testPassword,
            role: 'coach'
        });
        assert('Register Coach successfully returns 201', regCoach.status === 201 && regCoach.data.success);
        const coachToken = getCookie(regCoach, 'token');
        const coachHeaders = { Cookie: `token=${coachToken}` };

        // 1.4 Test Login with Valid Credentials
        const loginRes = await request('POST', '/api/auth/login', {
            email: memberEmail,
            password: testPassword
        });
        assert('Login returns 200 and user metadata', loginRes.status === 200 && loginRes.data.data.email === memberEmail);

        // 1.5 Test Login with Bad Password
        const badLogin = await request('POST', '/api/auth/login', {
            email: memberEmail,
            password: 'WrongPassword'
        });
        assert('Login rejects invalid password with 401 Unauthorized', badLogin.status === 401);

        // 1.6 Password Reset Workflow (SHA-256)
        const forgotRes = await request('POST', '/api/auth/forgot-password', { email: memberEmail });
        assert('Forgot password generates token safely', forgotRes.status === 200 && forgotRes.data.success);
        const resetToken = forgotRes.data.resetToken;

        if (resetToken) {
            const resetRes = await request('POST', `/api/auth/reset-password/${resetToken}`, {
                password: 'NewPassword123!'
            });
            assert('Reset password with SHA-256 token succeeds', resetRes.status === 200 && resetRes.data.success);
            
            // Re-login with new password
            const reLogin = await request('POST', '/api/auth/login', {
                email: memberEmail,
                password: 'NewPassword123!'
            });
            assert('Login with updated password succeeds', reLogin.status === 200);
        }

        // 2. DAILY TASKS & COACH-CLIENT WORKFLOW
        console.log('\n--- 2. Daily Tasks & Coaching Suite ---');
        
        // 2.1 Get Member Tasks for today
        const todayDate = new Date().toISOString().split('T')[0];
        const myTasksRes = await request('GET', `/api/tasks/my?date=${todayDate}`, null, memberHeaders);
        assert('Member can fetch their daily tasks', myTasksRes.status === 200 && Array.isArray(myTasksRes.data.data));

        // 2.2 Coach Tasks list
        const coachTasksRes = await request('GET', `/api/tasks/coach`, null, coachHeaders);
        assert('Coach can fetch their assigned tasks list', coachTasksRes.status === 200 && Array.isArray(coachTasksRes.data.data));

        // 3. WORKOUTS & GAMIFICATION SUITE
        console.log('\n--- 3. Workouts & Gamification Suite ---');
        
        // 3.1 Get Workout Programs
        const programsRes = await request('GET', '/api/workouts/programs', null, memberHeaders);
        assert('Member can fetch workout program library', programsRes.status === 200 && Array.isArray(programsRes.data.data));

        // 3.2 Create Workout Program (Coach)
        const createProgRes = await request('POST', '/api/workouts/programs', {
            name: 'QA Hypertrophy Protocol',
            goal: 'Muscle Growth',
            durationWeeks: 6,
            difficulty: 'intermediate',
            schedule: [
                {
                    dayNumber: 1,
                    dayName: 'Upper Power',
                    exercises: [{ name: 'Barbell Bench Press', sets: 4, reps: 8, restSeconds: 90 }]
                }
            ]
        }, coachHeaders);
        assert('Coach can create workout programs', createProgRes.status === 201 && createProgRes.data.success);

        // 3.3 Log Workout (Member) & Gamification
        const logWorkoutRes = await request('POST', '/api/workouts/log', {
            date: new Date(),
            totalDuration: 45,
            caloriesBurned: 350,
            exercisesCompleted: [
                { name: 'Barbell Bench Press', sets: [{ setNumber: 1, reps: 10, weight: 80 }] }
            ]
        }, memberHeaders);
        assert('Member can log workout without UserGamification crash', logWorkoutRes.status === 200 || logWorkoutRes.status === 201);

        // 4. DIET, NUTRITION & HYDRATION SUITE
        console.log('\n--- 4. Diet & Hydration Suite ---');
        
        // 4.1 Water Tracking persistence
        const logWaterRes = await request('POST', '/api/diet/water', { waterIntake: 6 }, memberHeaders);
        assert('Log water intake returns 200 with persisted value', logWaterRes.status === 200 && logWaterRes.data.data.waterIntake === 6);

        // 4.2 Get Today Macros & Hydration
        const todayMacrosRes = await request('GET', '/api/diet/macros/today', null, memberHeaders);
        assert('Get today macros includes persisted waterIntake', todayMacrosRes.status === 200 && todayMacrosRes.data.data.waterIntake === 6);

        // 4.3 Create Diet Plan (Coach)
        const createDietRes = await request('POST', '/api/diet/plans', {
            name: 'QA Clean Bulk 2800',
            goal: 'Hypertrophy',
            caloriesTarget: 2800,
            macrosTarget: { protein: 200, carbs: 320, fat: 80 }
        }, coachHeaders);
        assert('Coach can create diet plans', createDietRes.status === 201 && createDietRes.data.success);

        // 5. COMMUNITY & CHALLENGES SUITE
        console.log('\n--- 5. Community & Challenges Suite ---');
        
        // 5.1 Get Community Feed
        const feedRes = await request('GET', '/api/community/posts', null, memberHeaders);
        assert('Get community posts returns array of posts', feedRes.status === 200 && Array.isArray(feedRes.data.data));

        // 5.2 Create Community Post
        const createPostRes = await request('POST', '/api/community/posts', {
            content: 'Just smashed a heavy chest session! Loving FitCore!'
        }, memberHeaders);
        assert('Member can create community posts', createPostRes.status === 201 && createPostRes.data.success);

        // 5.3 Fetch Community Challenges
        const challengesRes = await request('GET', '/api/community/challenges', null, memberHeaders);
        assert('Get community challenges returns seeded active challenges', challengesRes.status === 200 && challengesRes.data.data.length > 0);

        if (challengesRes.data.data.length > 0) {
            const challengeId = challengesRes.data.data[0]._id;
            const joinRes = await request('POST', `/api/community/challenges/${challengeId}/join`, null, memberHeaders);
            assert('Member can join active community challenge', joinRes.status === 200 && joinRes.data.success);
        }

        // 6. APPOINTMENTS & ROSTER SUITE
        console.log('\n--- 6. Appointments & Roster Suite ---');
        
        // 6.1 Member checks coach availability
        const coachesList = await request('GET', '/api/coaches', null, memberHeaders);
        assert('Member can fetch public coach catalog', coachesList.status === 200 && Array.isArray(coachesList.data.data));

        // 7. MEMBERSHIPS & BILLING SUITE
        console.log('\n--- 7. Memberships & Billing Suite ---');
        
        // 7.1 Get Membership Plans
        const plansRes = await request('GET', '/api/memberships/plans', null, memberHeaders);
        assert('Get membership plans returns available tiers', plansRes.status === 200 && Array.isArray(plansRes.data.data));

        // 7.2 Mock Dev Checkout for Membership
        if (plansRes.data.data.length > 0) {
            const planId = plansRes.data.data[0]._id;
            const checkoutRes = await request('POST', '/api/memberships/checkout', {
                planId: planId
            }, memberHeaders);
            assert('Membership purchase / checkout flow executes properly', checkoutRes.status === 200 && checkoutRes.data.success);
        }

        // 8. ADMIN REPORTS & EXPORTS SUITE
        console.log('\n--- 8. Admin Reports & Exports Suite ---');
        
        // Elevate QA Member to Admin
        await User.findOneAndUpdate({ email: memberEmail }, { role: 'admin' });
        
        // Re-login as Admin
        const adminLogin = await request('POST', '/api/auth/login', {
            email: memberEmail,
            password: 'NewPassword123!'
        });
        const adminToken = getCookie(adminLogin, 'token');
        const adminHeaders = { Cookie: `token=${adminToken}` };

        // 8.1 Export Users CSV
        const expUsers = await request('GET', '/api/reports/export/users', null, adminHeaders);
        assert('Admin export users CSV returns text/csv', expUsers.status === 200 && (expUsers.headers['content-type'] || '').includes('text/csv'));

        // 8.2 Export Revenue CSV
        const expRev = await request('GET', '/api/reports/export/revenue', null, adminHeaders);
        assert('Admin export revenue CSV returns text/csv', expRev.status === 200 && (expRev.headers['content-type'] || '').includes('text/csv'));

        // 8.3 Export Analytics CSV
        const expAnalytics = await request('GET', '/api/reports/export/analytics', null, adminHeaders);
        assert('Admin export analytics CSV returns text/csv', expAnalytics.status === 200 && (expAnalytics.headers['content-type'] || '').includes('text/csv'));

        // 8.4 Export Activity CSV
        const expActivity = await request('GET', '/api/reports/export/activity', null, adminHeaders);
        assert('Admin export activity CSV returns text/csv', expActivity.status === 200 && (expActivity.headers['content-type'] || '').includes('text/csv'));

        // SUMMARY
        console.log('\n========================================');
        console.log(`TOTAL TESTS:  ${totalTests}`);
        console.log(`PASSED:       ${passedTests}`);
        console.log(`FAILED:       ${failedTests}`);
        console.log(`SUCCESS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
        console.log('========================================\n');

        // Cleanup test accounts
        await User.deleteMany({ email: { $in: [memberEmail, coachEmail, adminEmail] } });
        console.log('[QA CLEANUP] Cleaned up temporary test accounts.');

    } catch (err) {
        console.error('Fatal error during QA verification:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runQA();
