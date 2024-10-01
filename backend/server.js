const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const uri = "mongodb://localhost:27017";
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
  const { c_name, c_vill, c_category, phone } = req.body;
  try {
    const result = await db.collection('customers').insertOne({
      c_name,
      c_vill,
      c_category: parseInt(c_category),
      phone
    });
    res.json({ message: 'User added successfully', data: { id: result.insertedId, c_name, c_vill, c_category, phone } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for adding payments
app.post('/add_payments', async (req, res) => {
  const { c_id, p_month } = req.body;
  try {
    const result = await db.collection('payments').insertOne({
      c_id: new ObjectId(c_id),
      p_date: new Date(),
      p_month
    });
    res.json({ message: 'Payment added successfully', data: { id: result.insertedId, c_id, p_month } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding a user by ID
app.get('/find_user', async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await db.collection('customers').findOne({ _id: new ObjectId(userId) });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding payments made by a user
app.get('/find_payments', async (req, res) => {
  const userId = req.query.userIdPayments;
  try {
    const payments = await db.collection('payments')
      .aggregate([
        { $match: { c_id: new ObjectId(userId) } },
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
            c_name: '$customer.c_name'
          }
        }
      ]).toArray();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for calculating total amount paid by a user
app.get('/total_amount_paid', async (req, res) => {
  const userId = req.query.userId;
  try {
    const payments = await db.collection('payments').find({ c_id: new ObjectId(userId) }).toArray();
    const categories = await db.collection('category').find().toArray();
    
    let totalAmount = 0;
    for (let payment of payments) {
      const category = categories.find(cat => cat.ct_name === payment.p_month);
      if (category) {
        totalAmount += category.ct_price;
      }
    }
    res.json({ total_amount: totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for updating user details
app.put('/update_user', async (req, res) => {
  const { c_id, c_name, c_vill, c_category, phone } = req.body;
  try {
    const result = await db.collection('customers').updateOne(
      { _id: new ObjectId(c_id) },
      { $set: { c_name, c_vill, c_category: parseInt(c_category), phone } }
    );
    if (result.modifiedCount > 0) {
      res.json({ message: 'User updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for deleting a user
app.delete('/delete_user', async (req, res) => {
  const userId = req.query.userId;
  try {
    const user = await db.collection('customers').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const paymentsCount = await db.collection('payments').countDocuments({ c_id: new ObjectId(userId) });
    
    await db.collection('payments').deleteMany({ c_id: new ObjectId(userId) });
    await db.collection('customers').deleteOne({ _id: new ObjectId(userId) });
    
    res.json({
      message: 'User and associated payments deleted successfully',
      userDetails: user,
      paymentCount: paymentsCount
    });
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

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});