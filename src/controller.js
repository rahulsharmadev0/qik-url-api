import { tokenFromDeletionToken, normalizeExpiry, asyncHandler, httpError } from './utils.js';
import { firestore } from './config/firebase.js';
import { redis } from './config/redis.js';
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

    await firestore.collection('qik_urls').doc(qik_code).set(docData);

    const ttlSeconds = Math.max(1, Math.floor((expiryDate - new Date()) / 1000));
    
    await redis.setEx(qik_code, ttlSeconds, JSON.stringify(docData));

    const { click_count, ...response } = docData; // include click_count? README includes it => keep
    response.click_count = 0;
    res.status(201).json(response);
});


export const getQikUrl = asyncHandler(async (req, res) => {
    const { qik_code } = req.params;


    let dataStr = await redis.get(qik_code);
    let docData = dataStr ? JSON.parse(dataStr) : (await firestore.collection('qik_urls').doc(qik_code).get()).data();
    if (!docData) throw httpError(404, 'Short URL not found or expired.');

    const expired = docData.expires_at && Date.now() > new Date(docData.expires_at).getTime();
    if (expired) {
        await Promise.all([
            redis.del(qik_code),
            firestore.collection('qik_urls').doc(qik_code).delete()
        ]);
        throw httpError(404, 'Short URL not found or expired.');
    }

    if (docData.single_use && docData.click_count > 0) throw httpError(410, 'This link has already been used.');

    // Increment & persist
    docData.click_count += 1;
    if (docData.single_use) {
        await Promise.all([
            redis.del(qik_code),
            firestore.collection('qik_urls').doc(qik_code).delete()
        ]);
    } else {
        await firestore.collection('qik_urls').doc(qik_code).update({ click_count: docData.click_count });
        const ttlSeconds = Math.floor((new Date(docData.expires_at) - new Date()) / 1000);
        if (ttlSeconds > 0) await redis.setEx(qik_code, ttlSeconds, JSON.stringify(docData));
    }

    res.redirect(302, docData.long_url);
});


export const deleteQikUrl = asyncHandler(async (req, res) => {
    const { deletion_code } = req.params;
    const qik_code = tokenFromDeletionToken(deletion_code);

    const docRef = firestore.collection('qik_urls').doc(qik_code);
    const snap = await docRef.get();
    if (!snap.exists) throw httpError(401, 'Unauthorized. Invalid deletion token.');
    const data = snap.data();
    if (data.deletion_code !== deletion_code) throw httpError(401, 'Unauthorized. Invalid deletion token.');
    await Promise.all([
        redis.del(qik_code),
        docRef.delete()
    ]);
    res.json({ message: 'Short URL deleted successfully.' });
});

export const getHealth = asyncHandler(async (req, res) => {


    const results = await Promise.allSettled([
        firestore.collection('_health').doc('test').get(),
        redis.ping()
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