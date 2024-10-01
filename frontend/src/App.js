import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {
  const [activeForm, setActiveForm] = useState('');
  const [result, setResult] = useState('');
  const [searchParams, setSearchParams] = useState({ village: '', category: '' });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/find_all_users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e, endpoint, data) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data);
      setResult(JSON.stringify(response.data, null, 2));
      if (endpoint === '/add_user') {
        fetchAllUsers(); // Refresh user list after adding a new user
      }
    } catch (error) {
      setResult(JSON.stringify(error.response.data, null, 2));
    }
  };

  const handleGet = async (endpoint, params) => {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, { params });
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(JSON.stringify(error.response.data, null, 2));
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${API_URL}/search_users`, { params: searchParams });
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setResult(JSON.stringify(error.response.data, null, 2));
    }
  };

  return (
    <div className="App">
      <h1>Diwali Payments</h1>
      <div className="button-container">
        <button onClick={() => setActiveForm('addUser')}>Add User</button>
        <button onClick={() => setActiveForm('addPayment')}>Add Payment</button>
        <button onClick={() => setActiveForm('findUser')}>Find User</button>
        <button onClick={() => setActiveForm('findPayments')}>Find Payments</button>
        <button onClick={() => setActiveForm('viewPaymentsByMonth')}>View Payments by Month</button>
        <button onClick={() => setActiveForm('totalAmountPaid')}>Total Amount Paid</button>
        <button onClick={() => handleGet('/find_all_users')}>Find All Users</button>
        <button onClick={() => setActiveForm('searchUsers')}>Search Users</button>
      </div>

      <div className="form-container">
        {activeForm === 'addUser' && (
          <form onSubmit={(e) => handleSubmit(e, '/add_user', {
            userId: e.target.userId.value,
            c_name: e.target.c_name.value,
            c_vill: e.target.c_vill.value,
            c_category: e.target.c_category.value,
            phone: e.target.phone.value
          })}>
            <input name="userId" placeholder="User ID" type="number" required />
            <input name="c_name" placeholder="Name" required />
            <input name="c_vill" placeholder="Village" required />
            <select name="c_category" required>
              <option value="">Select Category</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
            <input name="phone" placeholder="Phone" required />
            <button type="submit">Add User</button>
          </form>
        )}

        {activeForm === 'addPayment' && (
          <form onSubmit={(e) => handleSubmit(e, '/add_payments', {
            c_id: e.target.c_id.value,
            p_month: e.target.p_month.value,
            amount: e.target.amount.value
          })}>
            <input name="c_id" placeholder="User ID" required />
            <input name="p_month" placeholder="Payment Month" required />
            <input name="amount" placeholder="Amount" type="number" step="0.01" required />
            <button type="submit">Add Payment</button>
          </form>
        )}

        {activeForm === 'findUser' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGet('/find_user', { userId: e.target.userId.value });
          }}>
            <input name="userId" placeholder="User ID" required />
            <button type="submit">Find User</button>
          </form>
        )}

        {activeForm === 'findPayments' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGet('/find_payments', { userIdPayments: e.target.userIdPayments.value });
          }}>
            <input name="userIdPayments" placeholder="User ID" required />
            <button type="submit">Find Payments</button>
          </form>
        )}

        {activeForm === 'viewPaymentsByMonth' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGet('/view_payments_by_month', { p_month: e.target.p_month.value });
          }}>
            <input name="p_month" placeholder="Month" required />
            <button type="submit">View Payments</button>
          </form>
        )}

        {activeForm === 'totalAmountPaid' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleGet('/total_amount_paid', { userId: e.target.userId.value });
          }}>
            <input name="userId" placeholder="User ID" required />
            <button type="submit">Get Total Amount</button>
          </form>
        )}

        {activeForm === 'searchUsers' && (
          <div>
            <input
              placeholder="Village"
              value={searchParams.village}
              onChange={(e) => setSearchParams({ ...searchParams, village: e.target.value })}
            />
            <select
              value={searchParams.category}
              onChange={(e) => setSearchParams({ ...searchParams, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
            <button onClick={handleSearch}>Search Users</button>
          </div>
        )}
      </div>

      {result && (
        <div className="result-container">
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}

      {/* <div className="users-list">
        <h2>All Users</h2>
        <ul>
          {users.map((user) => (
            <li key={user._id}>
              {user._id} - {user.c_name} - {user.c_vill} - {user.c_category}
            </li>
          ))}
        </ul>
      </div> */}
    </div>
  );
}

export default App;