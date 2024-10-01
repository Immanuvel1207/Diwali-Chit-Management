const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://rimmanuvel12:Immanuvel%4012@cluster0.6ncy0.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas
const userSchema = new mongoose.Schema({
  _id: Number,
  c_name: String,
  c_vill: String,
  c_category: String,
  phone: String,
});

const paymentSchema = new mongoose.Schema({
  c_id: Number,
  p_date: Date,
  p_month: String,
  amount: Number,
});

const villageSchema = new mongoose.Schema({
  v_name: String,
});

// Define models
const User = mongoose.model('User', userSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Village = mongoose.model('Village', villageSchema);

// Middleware to check if the village exists, if not create it
async function checkAndCreateVillage(req, res, next) {
  const { c_vill } = req.body;
  try {
    const village = await Village.findOne({ v_name: c_vill });
    if (!village) {
      await Village.create({ v_name: c_vill });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Route for adding a user
app.post('/add_user', checkAndCreateVillage, async (req, res) => {
  const { userId, c_name, c_vill, c_category, phone } = req.body;
  try {
    const existingUser = await User.findById(userId);
    if (existingUser) {
      return res.status(400).json({ error: "User ID already exists" });
    }
    const user = new User({
      _id: userId,
      c_name,
      c_vill,
      c_category,
      phone
    });
    await user.save();
    res.json({ message: 'User added successfully', data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for adding payments
app.post('/add_payments', async (req, res) => {
  const { c_id, p_month, amount } = req.body;
  try {
    const payment = new Payment({
      c_id,
      p_date: new Date(),
      p_month,
      amount
    });
    await payment.save();
    res.json({ message: 'Payment added successfully', data: payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for calculating total amount paid by a user
app.get('/total_amount_paid', async (req, res) => {
  const userId = parseInt(req.query.userId);
  try {
    const result = await Payment.aggregate([
      { $match: { c_id: userId } },
      { $group: { _id: '$c_id', total_amount: { $sum: '$amount' } } }
    ]);
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
    const user = await User.findById(userId);
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
    const payments = await Payment.aggregate([
      { $match: { c_id: userId } },
      { $lookup: {
          from: 'users',
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
    ]);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for viewing payments by month
app.get('/view_payments_by_month', async (req, res) => {
  const month = req.query.p_month;
  try {
    const payments = await Payment.aggregate([
      { $match: { p_month: month } },
      { $lookup: {
          from: 'users',
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
    ]);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for finding all users
app.get('/find_all_users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for searching users by village, category, and name
app.get('/search_users', async (req, res) => {
  const { village, category, name } = req.query;
  try {
    let query = {};
    if (village) query.c_vill = new RegExp(village, 'i');
    if (category) query.c_category = category;
    if (name) query.c_name = new RegExp(name, 'i');

    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for deleting a user and their payments
app.delete('/delete_user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    // Delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete all payments associated with the user
    await Payment.deleteMany({ c_id: userId });

    res.json({ message: `User with ID ${userId} and their payments were deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});