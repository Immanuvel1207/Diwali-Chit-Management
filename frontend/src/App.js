import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const API_URL = 'https://diwali-chit-management.onrender.com';

function App() {
  const [activeForm, setActiveForm] = useState('');
  const [result, setResult] = useState('');
  const [searchParams, setSearchParams] = useState({ village: '', category: '' });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2) {
      handleSearch();
    } else {
      fetchAllUsers();
    }
  }, [searchTerm, searchParams]);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/find_all_users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleSubmit = async (e, endpoint, data) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data);
      if (endpoint === '/add_user') {
        toast.success(`User added with ID: ${response.data.data.id}`);
        fetchAllUsers();
      } else if (endpoint === '/add_payments') {
        toast.success(`Payment added successfully for month: ${data.p_month}, amount: ${data.amount}`);
      }
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'An error occurred');
      setResult(JSON.stringify(error.response?.data || {}, null, 2));
    }
  };

  const handleGet = async (endpoint, params) => {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, { params });
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'An error occurred');
      setResult(JSON.stringify(error.response?.data || {}, null, 2));
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${API_URL}/search_users`, { 
        params: { ...searchParams, name: searchTerm } 
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('An error occurred while searching');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await axios.delete(`${API_URL}/delete_user/${userId}`);
      toast.success(`User with ID ${userId} was deleted`);
      fetchAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('An error occurred while deleting the user');
    }
  };

  const UserCard = ({ user }) => (
    <div className="card">
      <h3>{user.c_name}</h3>
      <p>ID: {user._id}</p>
      <p>Village: {user.c_vill}</p>
      <p>Category: {user.c_category}</p>
      <p>Phone: {user.phone}</p>
      <button onClick={() => handleDeleteUser(user._id)} className="delete-btn">Delete User</button>
    </div>
  );

  const PaymentCard = ({ payment }) => (
    <div className="card">
      <h3>Payment ID: {payment.p_id}</h3>
      <p>Month: {payment.p_month}</p>
      <p>Amount: {payment.amount}</p>
      <p>Customer: {payment.c_name}</p>
    </div>
  );

  return (
    <div className="App">
      <ToastContainer />
      <h1>Diwali Payments</h1>
      <div className="button-container">
        <button onClick={() => setActiveForm('addUser')}>Add User</button>
        <button onClick={() => setActiveForm('addPayment')}>Add Payment</button>
        <button onClick={() => setActiveForm('findUser')}>Find User</button>
        <button onClick={() => setActiveForm('findPayments')}>Find Payments</button>
        <button onClick={() => setActiveForm('viewPaymentsByMonth')}>View Payments by Month</button>
        <button onClick={() => setActiveForm('totalAmountPaid')}>Total Amount Paid</button>
        <button onClick={() => {setActiveForm(''); fetchAllUsers();}}>Find All Users</button>
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
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
          {activeForm === 'findUser' && result !== '{}' && (
            <UserCard user={JSON.parse(result)} />
          )}
          {activeForm === 'findPayments' && (
            <div className="card-container">
              {Array.isArray(JSON.parse(result)) ? 
                JSON.parse(result).map((payment) => (
                  <PaymentCard key={payment.p_id} payment={payment} />
                )) : 
                <p>No payments found</p>
              }
            </div>
          )}
          {activeForm === 'viewPaymentsByMonth' && (
            <div className="card-container">
              {Array.isArray(JSON.parse(result)) ?
                JSON.parse(result).map((payment) => (
                  <div key={payment.p_id} className="card">
                    <p>ID: {payment.c_id}</p>
                    <p>Name: {payment.c_name}</p>
                    <p>Amount: {payment.amount}</p>
                  </div>
                )) :
                <p>No payments found for this month</p>
              }
            </div>
          )}
          {activeForm === 'totalAmountPaid' && (
            <div className="card">
              <h3>Total Amount Paid</h3>
              <p>User ID: {JSON.parse(result).user_id}</p>
              <p>Total Amount: {JSON.parse(result).total_amount}</p>
            </div>
          )}
          {(activeForm === '' || activeForm === 'searchUsers') && (
            <pre>{result}</pre>
          )}
        </div>
      )}

      <div className="users-list">
        <h2>Users</h2>
        <div className="card-container">
          {users.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;