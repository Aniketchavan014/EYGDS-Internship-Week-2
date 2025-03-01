const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = 'my_super_secret_123!';

// Connect to MongoDB with error handling
mongoose.connect('mongodb://localhost:27017/crud', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Auction Item Schema
const auctionItemSchema = new mongoose.Schema({
  itemName: String,
  description: String,
  currentBid: Number,
  highestBidder: String,
  closingTime: Date,
  isClosed: { type: Boolean, default: false },
});

const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

// Middleware to verify token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized - No Token Provided' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
    req.user = user;
    next();
  });
};

// ✅ Secure Signup Route (Hashing Password)
app.post('/Signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Secure Signin Route (Password Validation)
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Signin successful', token });
  } catch (error) {
    console.error('Signin Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Create Auction Item (Protected Route)
app.post('/auction', authenticate, async (req, res) => {
  try {
    const { itemName, description, startingBid, closingTime } = req.body;

    if (!itemName || !description || !startingBid || !closingTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: '',
      closingTime,
    });

    await newItem.save();
    res.status(201).json({ message: 'Auction item created', item: newItem });
  } catch (error) {
    console.error('Auction Post Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Get all auction items
app.get('/auctions', async (req, res) => {
  try {
    const auctions = await AuctionItem.find();
    res.json(auctions);
  } catch (error) {
    console.error('Fetching Auctions Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Get a single auction item by ID
app.get('/auctions/:id', async (req, res) => {
  try {
    const auctionItem = await AuctionItem.findById(req.params.id);
    if (!auctionItem) return res.status(404).json({ message: 'Auction not found' });

    res.json(auctionItem);
  } catch (error) {
    console.error('Fetching Auction Item Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Bidding on an item (Protected)
app.post('/bid/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { bid } = req.body;
    
    if (!bid || isNaN(bid) || bid <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount' });
    }

    const item = await AuctionItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Auction item not found' });

    if (item.isClosed || new Date() > new Date(item.closingTime)) {
      item.isClosed = true;
      await item.save();
      return res.status(400).json({ message: 'Auction is closed', winner: item.highestBidder });
    }

    if (bid > item.currentBid) {
      item.currentBid = bid;
      item.highestBidder = req.user.username;
      await item.save();
      res.json({ message: 'Bid successful', item });
    } else {
      res.status(400).json({ message: 'Bid too low' });
    }
  } catch (error) {
    console.error('Bidding Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ✅ Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
