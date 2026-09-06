import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { initializeFirebase } from '../config/firebase.js';
import { requireFirebaseUser } from '../middleware/auth.js';
import { createListingSchema } from '../schemas/listing.js';

const listingsRouter = Router();

function toListing(id, data) {
  return { id, ...data };
}

listingsRouter.get('/', async (req, res, next) => {
  try {
    const { db } = initializeFirebase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const snapshot = await db
      .collection('properties')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return res.json({
      data: snapshot.docs.map((doc) => toListing(doc.id, doc.data())),
    });
  } catch (error) {
    return next(error);
  }
});

listingsRouter.get('/:id', async (req, res, next) => {
  try {
    const { db } = initializeFirebase();
    const document = await db.collection('properties').doc(req.params.id).get();

    if (!document.exists) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    return res.json({ data: toListing(document.id, document.data()) });
  } catch (error) {
    return next(error);
  }
});

listingsRouter.post('/', requireFirebaseUser, async (req, res, next) => {
  const parsed = createListingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({
      error: 'Invalid listing data.',
      details: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const { db, messaging } = initializeFirebase();
    const listingReference = db.collection('properties').doc();
    const listing = {
      ...parsed.data,
      ownerId: req.user.uid,
      ownerName: req.user.name || null,
      ownerEmail: req.user.email || null,
      isVerified: false,
      isAvailable: true,
      isFeatured: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await listingReference.set(listing);

    // New listings are public, so every subscribed app may receive this alert.
    await messaging.send({
      topic: 'all_users',
      notification: {
        title: 'New Property Listed! 🏠',
        body: `Check out "${listing.title}" in ${listing.location}.`,
      },
      data: {
        listingId: listingReference.id,
        type: 'new_listing',
      },
      android: { priority: 'high' },
    });

    return res.status(201).json({
      data: { id: listingReference.id, ...listing },
    });
  } catch (error) {
    return next(error);
  }
});

export { listingsRouter };
