const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors()); // Enable CORS for frontend communication

// API to get transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    let transactions = response.data;

    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    if (search) {
      transactions = transactions.filter(
        (transaction) =>
          transaction.title.toLowerCase().includes(search.toLowerCase()) ||
          transaction.description
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          String(transaction.price).includes(search)
      );
    }

    const total = transactions.length;
    const start = (page - 1) * perPage;
    const paginatedTransactions = transactions.slice(start, start + perPage);

    res.json({
      transactions: paginatedTransactions,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// API to get transaction stats by month
app.get("/api/transaction-stats", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const transactions = response.data;

    const selectedMonth = req.query.month; // Get the month from the query parameter

    // Define price ranges
    const priceRanges = [
      { label: "0-100", min: 0, max: 100 },
      { label: "101-200", min: 101, max: 200 },
      { label: "201-300", min: 201, max: 300 },
      { label: "301-400", min: 301, max: 400 },
      { label: "401-500", min: 401, max: 500 },
      { label: "501-600", min: 501, max: 600 },
      { label: "601-700", min: 601, max: 700 },
      { label: "701-800", min: 701, max: 800 },
      { label: "801-900", min: 801, max: 900 },
      { label: "901-above", min: 901, max: Infinity },
    ];

    const result = priceRanges.map((range) => ({
      range: range.label,
      count: 0,
    }));

    // Filter transactions based on the selected month
    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.dateOfSale);
      const transactionMonth = transactionDate.toLocaleString("default", {
        month: "long",
      });
      return transactionMonth.toLowerCase() === selectedMonth.toLowerCase();
    });

    // Categorize transactions by price range
    filteredTransactions.forEach((transaction) => {
      const price = transaction.price;
      const range = priceRanges.find(
        (range) => price >= range.min && price <= range.max
      );
      if (range) {
        const index = result.findIndex((item) => item.range === range.label);
        result[index].count++;
      }
    });

    res.json({ data: result });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({ message: "Error fetching transaction stats" });
  }
});

// API to get transaction summary by month
app.get("/api/transaction-summary", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const transactions = response.data;

    const selectedMonth = req.query.month; // Get the month from the query parameter

    // Filter transactions based on the selected month
    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.dateOfSale);
      const transactionMonth = transactionDate.toLocaleString("default", {
        month: "long",
      });
      return transactionMonth.toLowerCase() === selectedMonth.toLowerCase();
    });

    // Initialize statistics variables
    let totalSales = 0;
    let totalSoldItems = 0;
    let totalNotSoldItems = 0;

    // Calculate statistics based on the filtered transactions
    filteredTransactions.forEach((transaction) => {
      totalSales += transaction.price;
      if (transaction.sold) {
        totalSoldItems++;
      } else {
        totalNotSoldItems++;
      }
    });

    // Return the summary data
    res.json({
      totalSales,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error fetching transaction summary:", error);
    res.status(500).json({ message: "Error fetching transaction summary" });
  }
});

// New API to get category counts for pie chart
app.get("/api/category-count", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const transactions = response.data;

    const selectedMonth = req.query.month; // Get the month from the query parameter

    // Filter transactions based on the selected month
    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.dateOfSale);
      const transactionMonth = transactionDate.toLocaleString("default", {
        month: "long",
      });
      return transactionMonth.toLowerCase() === selectedMonth.toLowerCase();
    });

    // Count items in each category
    const categoryCount = {};

    filteredTransactions.forEach((transaction) => {
      const category = transaction.category; // Assume category is a field in the transaction
      if (category) {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });

    // Convert object to array for easier use in charts
    const chartData = Object.keys(categoryCount).map((category) => ({
      category,
      count: categoryCount[category],
    }));

    res.json(chartData);
  } catch (error) {
    console.error("Error fetching category counts:", error);
    res.status(500).json({ message: "Error fetching category counts" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
