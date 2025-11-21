import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeFirebase, getFirestore, isFirebaseConfigured } from "./firebase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Firebase Configuration Route
  app.post("/api/firebase/config", async (req, res) => {
    try {
      const { projectId, privateKey, clientEmail } = req.body;

      if (!projectId || !privateKey || !clientEmail) {
        return res.status(400).json({ 
          message: "Missing required fields: projectId, privateKey, or clientEmail" 
        });
      }

      // Store credentials in environment (in production, use secure storage)
      process.env.FIREBASE_PROJECT_ID = projectId;
      process.env.FIREBASE_PRIVATE_KEY = privateKey;
      process.env.FIREBASE_CLIENT_EMAIL = clientEmail;

      // Initialize Firebase with the new credentials
      initializeFirebase(projectId, privateKey, clientEmail);

      res.json({ message: "Firebase configuration saved successfully" });
    } catch (error: any) {
      console.error("Firebase configuration error:", error);
      res.status(500).json({ 
        message: "Failed to configure Firebase",
        error: error.message 
      });
    }
  });

  // Get all products from Firestore
  app.get("/api/products", async (req, res) => {
    try {
      if (!isFirebaseConfigured()) {
        return res.status(503).json({ 
          message: "Firebase not configured. Please set up Firebase in settings." 
        });
      }

      const db = getFirestore();
      const productsSnapshot = await db.collection("products").get();
      
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(products);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ 
        message: "Failed to fetch products",
        error: error.message 
      });
    }
  });

  // Get a single product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      if (!isFirebaseConfigured()) {
        return res.status(503).json({ 
          message: "Firebase not configured" 
        });
      }

      const db = getFirestore();
      const productDoc = await db.collection("products").doc(req.params.id).get();
      
      if (!productDoc.exists) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ id: productDoc.id, ...productDoc.data() });
    } catch (error: any) {
      console.error("Error fetching product:", error);
      res.status(500).json({ 
        message: "Failed to fetch product",
        error: error.message 
      });
    }
  });

  // Add a new product to Firestore
  app.post("/api/products", async (req, res) => {
    try {
      if (!isFirebaseConfigured()) {
        return res.status(503).json({ 
          message: "Firebase not configured" 
        });
      }

      const { title, category, price, image } = req.body;

      if (!title || !category || !price) {
        return res.status(400).json({ 
          message: "Missing required fields: title, category, or price" 
        });
      }

      const db = getFirestore();
      const productRef = await db.collection("products").add({
        title,
        category,
        price: parseFloat(price),
        image: image || "",
        createdAt: new Date().toISOString()
      });

      const newProduct = await productRef.get();
      res.status(201).json({ id: newProduct.id, ...newProduct.data() });
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(500).json({ 
        message: "Failed to create product",
        error: error.message 
      });
    }
  });

  // Update a product
  app.patch("/api/products/:id", async (req, res) => {
    try {
      if (!isFirebaseConfigured()) {
        return res.status(503).json({ 
          message: "Firebase not configured" 
        });
      }

      const db = getFirestore();
      const productRef = db.collection("products").doc(req.params.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({ message: "Product not found" });
      }

      await productRef.update({
        ...req.body,
        updatedAt: new Date().toISOString()
      });

      const updatedProduct = await productRef.get();
      res.json({ id: updatedProduct.id, ...updatedProduct.data() });
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({ 
        message: "Failed to update product",
        error: error.message 
      });
    }
  });

  // Delete a product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      if (!isFirebaseConfigured()) {
        return res.status(503).json({ 
          message: "Firebase not configured" 
        });
      }

      const db = getFirestore();
      const productRef = db.collection("products").doc(req.params.id);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return res.status(404).json({ message: "Product not found" });
      }

      await productRef.delete();
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ 
        message: "Failed to delete product",
        error: error.message 
      });
    }
  });

  // Check Firebase connection status
  app.get("/api/firebase/status", (req, res) => {
    res.json({ 
      configured: isFirebaseConfigured(),
      message: isFirebaseConfigured() 
        ? "Firebase is connected" 
        : "Firebase not configured"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
