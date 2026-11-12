import { Router } from "express";
import { ObjectId } from "mongodb";
import { listingsCollection, offersCollection, usersCollection } from "../db";
import type { Filter } from "mongodb";
import type { Listing } from "../types";

const router = Router();

// Lo que se enseña de cada anuncio en un listado
const LIST_FIELDS = { title: 1, price: 1, category: 1, city: 1, status: 1 };

// ---------- GET /api/listings (listado) ----------
router.get("/", async (req, res) => {
    const filter: Filter<Listing> = {};

    if (typeof req.query.category === "string") {
        filter.category = req.query.category;
    }

    if (typeof req.query.city === "string") {
        filter.city = req.query.city;
    }

    if (typeof req.query.maxPrice === "string" && req.query.maxPrice !== "") {
        const maxPrice = Number(req.query.maxPrice);
        if (!Number.isFinite(maxPrice) || maxPrice < 0) {
            res.status(400).json({ error: "El precio máximo debe ser un número válido" });
            return;
        }
        filter.price = { $lte: maxPrice };
    }

    const listings = await listingsCollection()
        .find(filter)
        .project(LIST_FIELDS)
        .sort({ publishedAt: -1 })
        .toArray();

    res.json(listings);
});

router.get("/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: "El ID no tiene un formato válido" });
        return;
    }
    const listing = await listingsCollection()
        .findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $inc: { views: 1 } }, { returnDocument: "after" });

    if (!listing) {
        res.status(404).json({ error: "Anuncio no encontrado" });
        return;
    }

    res.json(listing);
});

router.get("/:id/offers", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: "El ID no tiene un formato válido" });
        return;
    }
    const listing = await listingsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!listing) {
        res.status(404).json({ error: "Anuncio no encontrado" });
        return;
    }

    const offers = await offersCollection()
        .find({ "listing.id": new ObjectId(req.params.id) })
        .toArray();

    res.json(offers);
});

async function validateListing(body:
    {
        title: string;
        description: string;
        price?: number;
        category: string;
        city: string;
        sellerId: string;
        attributes?: { size?: string, type?: string, wheelInches?: number };
    }): Promise<string | null> {


    if ((typeof body.title !== "string" || body.title.trim() === "")
        || (typeof body.description !== "string" || body.description.trim() === "")
        || (typeof body.category !== "string" || body.category.trim() === "")
        || (typeof body.city !== "string" || body.city.trim() === "")
    ) {
        return "Los campos title, description, category y city deben ser textos no vacíos";
    }

    if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
        return "El precio debe ser un número igual o mayor que cero";
    }

    if (typeof body.sellerId !== "string" || !ObjectId.isValid(body.sellerId)) {
        return "sellerId no tiene un formato válido";
    }
    return null;
}

router.post("/", async (req, res) => {
    const body = req.body ?? {};
    const error = await validateListing(body);

    if (error) {
        res.status(400).json({ error });
        return;
    }

    const seller = await usersCollection().findOne({ _id: new ObjectId(body.sellerId) });
    if (!seller) {
        res.status(400).json({ error: "No existe ningún usuario con ese sellerId" });
        return;
    }

    const attributes =
        typeof body.attributes === "object" && body.attributes !== null && !Array.isArray(body.attributes)
            ? body.attributes
            : {};

    const newListing: Listing = {
        title: body.title.trim(),
        description: body.description.trim(),
        price: body.price,
        category: body.category.trim(),
        status: "AVAILABLE",
        city: body.city.trim(),
        publishedAt: new Date(),
        views: 0,
        seller: { id: new ObjectId(body.sellerId), name: seller.name },
        photos: [],
        attributes: attributes
    };

    const result = await listingsCollection().insertOne(newListing);

    res.status(201).json({ _id: result.insertedId, ...newListing });
});

router.patch("/:id", async (req, res) => {
    const price = req.body?.price;
    if (typeof req.params.id !== "string" || !ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: "El id no tiene un formato válido" });
        return;
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        res.status(400).json({ error: "El precio debe ser un número igual o mayor que cero" });
        return;
    }
    const listing = await listingsCollection()
        .findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $set: { price: price } }, { returnDocument: "after" });

    if (!listing) {
        res.status(404).json({ error: "Anuncio no encontrado" });
        return;
    }

    res.json(listing);
});

router.delete("/:id", async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json({ error: "El ID no tiene un formato válido" });
        return;
    }
    const result = await listingsCollection()
        .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
        res.status(404).json({ error: "Anuncio no encontrado" });
        return;
    }

    res.status(204).send();
});

export default router;