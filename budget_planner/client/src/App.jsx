import { useState, useEffect, useReducer, useRef } from 'react';
import { PieChart, BarChart, Trash2, Edit, Check, X, PlusCircle, Loader, DollarSign, Wallet, CreditCard, TrendingUp, ArrowDownCircle, ArrowUpCircle, Tag } from 'lucide-react';

// Reducer function for expenses
const expenseReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return [...state, action.payload];
    case 'DELETE_EXPENSE':
      return state.filter(expense => expense.id !== action.payload);
    case 'UPDATE_EXPENSE':
      return state.map(expense => 
        expense.id === action.payload.id 
          ? { ...expense, ...action.payload.updates } 
          : expense
      );
    default:
      return state;
  }
};

// Custom hook for local storage
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

export default function BudgetExpenseTracker() {
  // Using useReducer hook for expenses
  const [expenses, dispatch] = useReducer(expenseReducer, []);
  
  // Using useState hook for various state variables
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [type, setType] = useState('expense');
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState({
    food: 300,
    housing: 800,
    transportation: 150,
    utilities: 200,
    entertainment: 100,
    healthcare: 150,
    shopping: 200,
    other: 100
  });
  const [showEditBudget, setShowEditBudget] = useState(false);
  
  // Using useRef hook for focusing the input
  const descriptionInputRef = useRef(null);
  
  // Using useLocalStorage hook (which uses useState and useEffect)
  const [savedExpenses, setSavedExpenses] = useLocalStorage('expenses', []);
  const [savedBudgets, setSavedBudgets] = useLocalStorage('budgets', budgets);
  
  // Using useEffect hook for initialization and data syncing
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'INIT', payload: savedExpenses });
      setBudgets(savedBudgets);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [savedExpenses, savedBudgets]);
  
  useEffect(() => {
    if (!isLoading) {
      setSavedExpenses(expenses);
    }
  }, [expenses, isLoading, setSavedExpenses]);
  
  useEffect(() => {
    if (!isLoading) {
      setSavedBudgets(budgets);
    }
  }, [budgets, isLoading, setSavedBudgets]);
  
  const handleAddExpense = () => {
    if (description.trim() && amount && !isNaN(parseFloat(amount))) {
      const newExpenseObj = {
        id: Date.now(),
        description,
        amount: parseFloat(amount),
        category,
        type,
        date: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_EXPENSE', payload: newExpenseObj });
      
      setDescription('');
      setAmount('');
      setShowAddExpense(false);
    }
  };
  
  const deleteExpense = (id) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
  };
  
  const startEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setType(expense.type);
    setShowAddExpense(true);
    
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  };
  
  const updateExpense = () => {
    if (description.trim() && amount && !isNaN(parseFloat(amount)) && editingExpenseId) {
      dispatch({
        type: 'UPDATE_EXPENSE',
        payload: {
          id: editingExpenseId,
          updates: {
            description,
            amount: parseFloat(amount),
            category,
            type,
            updatedAt: new Date().toISOString()
          }
        }
      });
      
      setDescription('');
      setAmount('');
      setEditingExpenseId(null);
      setShowAddExpense(false);
    }
  };

  const updateBudget = (category, value) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue) && newValue >= 0) {
      setBudgets(prev => ({
        ...prev,
        [category]: newValue
      }));
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Filter expenses for current month
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });
  
  // Calculate totals for the current month
  const totalIncome = currentMonthExpenses
    .filter(expense => expense.type === 'income')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const totalExpenses = currentMonthExpenses
    .filter(expense => expense.type === 'expense')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const balance = totalIncome - totalExpenses;
  
  // Calculate category totals and check against budgets
  const categoryTotals = {};
  const categoryPercentages = {};
  
  Object.keys(budgets).forEach(cat => {
    categoryTotals[cat] = currentMonthExpenses
      .filter(expense => expense.category === cat && expense.type === 'expense')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    categoryPercentages[cat] = budgets[cat] > 0 
      ? (categoryTotals[cat] / budgets[cat] * 100) 
      : 0;
  });
  
  // Get month name
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Category icons
  const categoryIcons = {
    food: <Wallet className="h-4 w-4" />,
    housing: <CreditCard className="h-4 w-4" />,
    transportation: <TrendingUp className="h-4 w-4" />,
    utilities: <PieChart className="h-4 w-4" />,
    entertainment: <BarChart className="h-4 w-4" />,
    healthcare: <DollarSign className="h-4 w-4" />,
    shopping: <Tag className="h-4 w-4" />,
    other: <Wallet className="h-4 w-4" />
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Budget Tracker</h1>
          <p className="text-gray-600 text-center">Manage your finances with ease</p>
        </header>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-12 w-12 text-green-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Summary */}
            <div className="col-span-3 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (currentMonth === 0) {
                        setCurrentMonth(11);
                        setCurrentYear(currentYear - 1);
                      } else {
                        setCurrentMonth(currentMonth - 1);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ArrowDownCircle className="h-5 w-5 text-gray-500" />
                  </button>
                  <h2 className="text-xl font-semibold text-gray-800">{monthNames[currentMonth]} {currentYear}</h2>
                  <button 
                    onClick={() => {
                      if (currentMonth === 11) {
                        setCurrentMonth(0);
                        setCurrentYear(currentYear + 1);
                      } else {
                        setCurrentMonth(currentMonth + 1);
                      }
                    }}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <ArrowUpCircle className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <button 
                  onClick={() => setShowAddExpense(!showAddExpense)}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Income</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalIncome)}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Expenses</div>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
                </div>
                <div className={`${balance >= 0 ? 'bg-green-50' : 'bg-orange-50'} p-4 rounded-lg`}>
                  <div className="text-sm text-gray-600 mb-1">Balance</div>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              </div>
              
              {showAddExpense && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input 
                        type="text" 
                        ref={descriptionInputRef}
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="food">Food</option>
                        <option value="housing">Housing</option>
                        <option value="transportation">Transportation</option>
                        <option value="utilities">Utilities</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="shopping">Shopping</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setType('expense')}
                          className={`px-4 py-2 rounded-lg border ${
                            type === 'expense' 
                              ? 'bg-red-100 border-red-300 text-red-700' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Expense
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('income')}
                          className={`px-4 py-2 rounded-lg border ${
                            type === 'income' 
                              ? 'bg-green-100 border-green-300 text-green-700' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          Income
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddExpense(false);
                        setEditingExpenseId(null);
                        setDescription('');
                        setAmount('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingExpenseId ? updateExpense : handleAddExpense}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      {editingExpenseId ? 'Update' : 'Add'} Transaction
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Budget Overview */}
            <div className="col-span-1 bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Budget Overview</h2>
                <button 
                  onClick={() => setShowEditBudget(!showEditBudget)}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {showEditBudget ? 'Done' : 'Edit Budgets'}
                </button>
              </div>
              
              <div className="space-y-4">
                {Object.entries(budgets).map(([cat, limit]) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-gray-100">
                          {categoryIcons[cat]}
                        </div>
                        <span className="text-sm font-medium capitalize">{cat}</span>
                      </div>
                      {showEditBudget ? (
                        <input
                          type="number"
                          value={limit}
                          onChange={(e) => updateBudget(cat, e.target.value)}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                          step="10"
                        />
                      ) : (
                        <div className="text-sm font-medium">
                          {formatCurrency(categoryTotals[cat])} / {formatCurrency(limit)}
                        </div>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          categoryPercentages[cat] > 100 
                            ? 'bg-red-500' 
                            : categoryPercentages[cat] > 75 
                              ? 'bg-orange-500' 
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(categoryPercentages[cat], 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Recent Transactions */}
            <div className="col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
              
              <div className="space-y-3">
                {currentMonthExpenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No transactions yet. Add your first transaction!</p>
                  </div>
                ) : (
                  [...currentMonthExpenses]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(expense => (
                      <div 
                        key={expense.id} 
                        className="p-4 border border-gray-200 rounded-lg transition-all hover:border-gray-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              expense.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {expense.type === 'income' 
                                ? <ArrowDownCircle className="h-5 w-5 text-green-600" />
                                : <ArrowUpCircle className="h-5 w-5 text-red-600" />
                              }
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{expense.description}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="capitalize">{expense.category}</span>
                                <span>•</span>
                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`font-medium ${
                              expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditExpense(expense)}
                                className="p-1 text-gray-500 hover:text-blue-500"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteExpense(expense.id)}
                                className="p-1 text-gray-500 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}