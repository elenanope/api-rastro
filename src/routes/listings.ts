import { Router } from "express";
import { ObjectId } from "mongodb";
import { listingsCollection } from "../db";

const router = Router();

// Lo que se enseña de cada anuncio en un listado
const LIST_FIELDS = { title: 1, price: 1, category: 1, city: 1, status: 1 };

// ---------- GET /api/listings (listado) ----------
router.get("/", async (_req, res) => {
    const listings = await listingsCollection()
        .find()
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
        .findOneAndUpdate({ _id: new ObjectId(req.params.id) }, { $inc: { views: 1 }}, {returnDocument: "after" });

    if (!listing) {
        res.status(404).json({ error: "Anuncio no encontrado" });
        return;
    }

    res.json(listing);
});

export default router;