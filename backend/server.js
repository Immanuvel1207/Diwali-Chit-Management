const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const uri = "mongodb+srv://rimmanuvel12:Immanuvel%4012@cluster0.6ncy0.mongodb.net/";
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("diwali");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB", error);
    process.exit(1);
  }
}

connectToDatabase();

// Middleware to check if the village exists, if not create it
async function checkAndCreateVillage(req, res, next) {
  const { c_vill } = req.body;
  const village = await db.collection('villages').findOne({ v_name: c_vill });
  if (!village) {
    await db.collection('villages').insertOne({ v_name: c_vill });
  }
  next();
}

// Route for adding a user
app.post('/add_user', checkAndCreateVillage, async (req, res) => {
  const { userId, c_name, c_vill, c_category, phone } = req.body;
  try {
    // Check if the userId already exists
    const existingUser = await db.collection('customers').findOne({ _id: parseInt(userId) });
    if (existingUser) {
      return res.status(400).json({ error: "User ID already exists" });
    }

    const result = await db.collection('customers').insertOne({
      _id: parseInt(userId),
      c_name,
      c_vill,
      c_category,
      phone
    });
    res.json({ message: 'User added successfully', data: { id: userId, c_name, c_vill, c_category, phone } });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route for adding payments
app.post('/add_payments', async (req, res) => {
  const { c_id, p_month, amount } = req.body;
  try {
    const result = await db.collection('payments').insertOne({
      c_id: parseInt(c_id),
      p_date: new Date(),
      p_month,
      amount: parseFloat(amount)
    });
    res.json({ message: 'Payment added successfully', data: { id: result.insertedId, c_id, p_month, amount } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for calculating total amount paid by a user
app.get('/total_amount_paid', async (req, res) => {
  const userId = parseInt(req.query.userId);
  try {
    const result = await db.collection('payments').aggregate([
      { $match: { c_id: userId } },
      { $group: { _id: '$c_id', total_amount: { $sum: '$amount' } } }
    ]).toArray();
    
    const totalAmount = result.length > 0 ? result[0].total_amount : 0;
    res.json({ user_id: userId, total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding a user by ID
app.get('/find_user', async (req, res) => {
  const userId = parseInt(req.query.userId);
  try {
    const user = await db.collection('customers').findOne({ _id: userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding payments made by a user
app.get('/find_payments', async (req, res) => {
  const userId = parseInt(req.query.userIdPayments);
  try {
    const payments = await db.collection('payments')
      .aggregate([
        { $match: { c_id: userId } },
        { $lookup: {
            from: 'customers',
            localField: 'c_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        { $project: {
            p_id: '$_id',
            c_id: 1,
            p_month: 1,
            amount: 1,
            c_name: '$customer.c_name'
          }
        }
      ]).toArray();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for viewing payments by month
app.get('/view_payments_by_month', async (req, res) => {
  const month = req.query.p_month;
  try {
    const payments = await db.collection('payments')
      .aggregate([
        { $match: { p_month: month } },
        { $lookup: {
            from: 'customers',
            localField: 'c_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        { $project: {
            p_id: '$_id',
            c_id: 1,
            p_month: 1,
            amount: 1,
            c_name: '$customer.c_name'
          }
        }
      ]).toArray();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding all users
app.get('/find_all_users', async (req, res) => {
  try {
    const users = await db.collection('customers').find().toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for searching users by village and category
app.get('/search_users', async (req, res) => {
  const { village, category } = req.query;
  try {
    let query = {};
    if (village) query.c_vill = village;
    if (category) query.c_category = category;

    const users = await db.collection('customers').find(query).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});