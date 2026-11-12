import { Router } from "express";
import { ObjectId } from "mongodb";
import { listingsCollection, offersCollection, usersCollection } from "../db";
import type { Offer } from "../types";

const router = Router();

function validateOffer(body:
    {
        listingId: string;
        buyerId: string;
        amount: number;
    }): string | null {

    if (typeof body.listingId !== "string" || !ObjectId.isValid(body.listingId)) {
        return "listingId no tiene un formato válido";
    }

    if (typeof body.buyerId !== "string" || !ObjectId.isValid(body.buyerId)) {
        return "buyerId no tiene un formato válido";
    }
    
    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
        return "La cantidad debe ser un número mayor que cero";
    }
    return null;
}

router.post("/", async (req, res) => {
    const body = req.body ?? {};
    const error = validateOffer(body);

    if (error) {
        res.status(400).json({ error });
        return;
    }

    const listing = await listingsCollection().findOne({ _id: new ObjectId(body.listingId) });
    if (!listing) {
        res.status(400).json({ error: "No existe ningún anuncio con ese listingId" });
        return;
    }
    const buyer = await usersCollection().findOne({ _id: new ObjectId(body.buyerId) });
    if (!buyer) {
        res.status(400).json({ error: "No existe ningún usuario con ese buyerId" });
        return;
    }
    if (listing.status !== "AVAILABLE") {
        res.status(409).json({ error: "El anuncio que buscas no está disponible" });
        return;
    }

    const newOffer: Offer = {
        amount: body.amount,
        status: "PENDING",
        createdAt: new Date(),
        listing: { id: listing._id, title: listing.title, price: listing.price },
        buyer: { id: buyer._id, name: buyer.name },
    };

    const result = await offersCollection().insertOne(newOffer);

    res.status(201).json({ _id: result.insertedId, ...newOffer });
});

export default router;