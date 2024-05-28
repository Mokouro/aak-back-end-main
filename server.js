require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const DOMAIN  = process.env.DOMAIN;
const DATABASE_URL = process.env.DATABASE_URL;

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware pour permettre les requêtes CORS
app.use(cors({
  origin: `${DOMAIN}`
}));

// Route pour créer un paiement avec Stripe
app.post("/create-checkout-session", async (req, res) => {
  const { products, shipping_address } = req.body;

    const lineItems = products.map((product) => ({
        price_data: {
            currency: "eur",
            product_data: {
                name:`${product.name} - ${product.size}`,
                images : [`${DATABASE_URL}/storage/uploads${product.image.path}`]
            },
            unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
    }));
    const shipping = {
      price_data: {
        currency: "eur",
        product_data: {
            name:`${shipping_address.name}`,
            description : `${shipping_address.line} \n ${shipping_address.postal_code} ${shipping_address.city}, ${shipping_address.country}`,
            images : [`${DATABASE_URL}/assets/link/6633feefab7c4aec340c47a2`],
        },
        unit_amount: 0,
    },
    quantity: 1,
    }
    lineItems.push(shipping);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        billing_address_collection:"required",
        mode: "payment",
        success_url: `${DOMAIN}/payment-success`,
        cancel_url: `${DOMAIN}/payment-cancel`,
    })

    res.json({ id: session.id });
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
