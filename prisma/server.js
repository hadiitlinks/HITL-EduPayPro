const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- 1. STUDENT & FEE ROUTES ---
app.post('/api/students', async (req, res) => {
    const student = await prisma.student.create({ data: req.body });
    res.json(student);
});

app.post('/api/fees/collect', async (req, res) => {
    const record = await prisma.feeRecord.create({ data: req.body });
    res.json(record);
});

// --- 2. EXPENSE MANAGEMENT ---
app.post('/api/expenses', async (req, res) => {
    try {
        const expense = await prisma.expense.create({ data: req.body });
        res.status(201).json(expense);
    } catch (e) {
        res.status(400).json({ error: "Expense entry failed" });
    }
});

app.get('/api/expenses', async (req, res) => {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    res.json(expenses);
});

// --- 3. PETTY CASH (Daily Chotay Kharche) ---
app.post('/api/petty-cash', async (req, res) => {
    const entry = await prisma.pettyCash.create({ data: req.body });
    res.json(entry);
});

// --- 4. DASHBOARD ANALYTICS (The Core) ---
app.get('/api/dashboard/stats', async (req, res) => {
    const totalFees = await prisma.feeRecord.aggregate({ _sum: { amountPaid: true } });
    const totalExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
    const totalPetty = await prisma.pettyCash.aggregate({ _sum: { amount: true } });

    const netProfit = (totalFees._sum.amountPaid || 0) - (totalExpenses._sum.amount || 0) - (totalPetty._sum.amount || 0);

    res.json({
        totalRevenue: totalFees._sum.amountPaid || 0,
        totalExpenses: (totalExpenses._sum.amount || 0) + (totalPetty._sum.amount || 0),
        netProfit: netProfit
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));