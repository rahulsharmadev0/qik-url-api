import { tokenFromDeletionToken, normalizeExpiry, asyncHandler, httpError } from './utils.js';
import { firebaseService } from './config/firebase.js';
import { redisService } from './config/redis.js';
import { randomUUID } from 'crypto';



export const createQikUrl = asyncHandler(async (req, res) => {
    const { long_url, expires_at, single_use } = req.body;
    const expiryDate = normalizeExpiry(expires_at);
    const deletion_code = randomUUID().replace(/-/g, '');
    const qik_code = tokenFromDeletionToken(deletion_code);

    const docData = {
        qik_code,
        long_url,
        expires_at: expiryDate.toISOString(),
        deletion_code,
        click_count: 0,
        single_use: !!single_use,
        created_at: new Date().toISOString()
    };

    await firebaseService.instance.collection('qik_urls').doc(qik_code).set(docData);

    // If expiry is less than 1 day, use that; otherwise, default to 1 day
    const ttlSeconds = Math.floor((expiryDate - new Date()) / 1000) <= 86400
        ? Math.floor((expiryDate - new Date()) / 1000)
        : 86400;

    await redisService.instance.setEx(qik_code, ttlSeconds, JSON.stringify(docData));

    res.status(201).json(docData);
});


export const redirectToLongUrl = asyncHandler(async (req, res) => {
    const { qik_code } = req.params;

    let dataStr = await redisService.instance.get(qik_code);
    let docData = dataStr ? JSON.parse(dataStr) : (await firebaseService.instance.collection('qik_urls').doc(qik_code).get()).data();
    if (!docData) throw httpError(404, 'Short URL not found or expired.');

    const expired = docData.expires_at && Date.now() > new Date(docData.expires_at).getTime();
    if (expired) {
        await Promise.all([
            redisService.instance.del(qik_code),
            firebaseService.instance.collection('qik_urls').doc(qik_code).delete()
        ]);
        throw httpError(404, 'Short URL not found or expired.');
    }

    if (docData.single_use && docData.click_count > 0) throw httpError(410, 'This link has already been used.');

    // Increment & persist
    docData.click_count += 1;
    if (docData.single_use) {
        await Promise.all([
            redisService.instance.del(qik_code),
            firebaseService.instance.collection('qik_urls').doc(qik_code).delete()
        ]);
    } else {
        await firebaseService.instance.collection('qik_urls').doc(qik_code).update({ click_count: docData.click_count });
        const ttlSeconds = Math.floor((new Date(docData.expires_at) - new Date()) / 1000);
        if (ttlSeconds > 0) await redisService.instance.setEx(qik_code, ttlSeconds, JSON.stringify(docData));
    }

    res.redirect(302, docData.long_url);
});


export const deleteQikUrl = asyncHandler(async (req, res) => {
    const { deletion_code } = req.params;
    const qik_code = tokenFromDeletionToken(deletion_code);

    const docRef = firebaseService.instance.collection('qik_urls').doc(qik_code);
    const snap = await docRef.get();
    if (!snap.exists) throw httpError(401, 'Unauthorized. Invalid deletion token.');
    const data = snap.data();
    if (data.deletion_code !== deletion_code) throw httpError(401, 'Unauthorized. Invalid deletion token.');
    await Promise.all([
        redisService.instance.del(qik_code),
        docRef.delete()
    ]);
    res.json({ message: 'Short URL deleted successfully.' });
});

export const getHealth = asyncHandler(async (req, res) => {


    const results = await Promise.allSettled([
        firebaseService.instance.collection('_health').doc('test').get(),
        redisService.instance.ping()
    ]);

    const database = results[0].status === 'fulfilled' ? 'connected' : 'disconnected';
    const cache = results[1].status === 'fulfilled' ? 'connected' : 'disconnected';
    const down = database === 'disconnected' || cache === 'disconnected';
    res.status(down ? 503 : 200).json({
        status: down ? 'degraded' : 'ok',
        timestamp: new Date().toISOString(),
        services: { database, cache }
    });
});