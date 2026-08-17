import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/restaurants`)
      .then(r => r.json())
      .then(setRestaurants)
      .catch(() => setMessage('Backend is unavailable'));
  }, []);

  async function openRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    const response = await fetch(`${API}/restaurants/${restaurant.id}/menu`);
    setMenu(await response.json());
  }

  function addToCart(item) {
    setCart(current => {
      const found = current.find(x => x.id === item.id);
      if (found) {
        return current.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x);
      }
      return [...current, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(current => current.filter(x => x.id !== id));
  }

  async function placeOrder() {
    if (!name || !phone || cart.length === 0) {
      setMessage('Enter name, phone and add at least one item.');
      return;
    }

    const response = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        items: cart.map(x => ({ menuItemId: x.id, quantity: x.quantity }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || 'Order failed');
      return;
    }

    setMessage(`Order #${data.orderId} placed successfully. Total: ₹${data.totalAmount}`);
    setCart([]);
  }

  const total = cart.reduce((sum, x) => sum + Number(x.price) * x.quantity, 0);

  return (
    <div className="app">
      <header>
        <h1>🍔 FoodExpress</h1>
        <p>3-Tier Food Delivery Demo</p>
      </header>

      <main>
        <section>
          <h2>Restaurants</h2>
          <div className="restaurants">
            {restaurants.map(r => (
              <button className="restaurant" key={r.id} onClick={() => openRestaurant(r)}>
                <h3>{r.name}</h3>
                <p>{r.cuisine}</p>
                <strong>⭐ {r.rating}</strong>
              </button>
            ))}
          </div>

          {selectedRestaurant && (
            <>
              <h2>{selectedRestaurant.name} Menu</h2>
              <div className="menu">
                {menu.map(item => (
                  <div className="item" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <strong>₹{item.price}</strong>
                    </div>
                    <button onClick={() => addToCart(item)}>Add</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <aside>
          <h2>🛒 Cart</h2>
          {cart.length === 0 && <p>Your cart is empty.</p>}
          {cart.map(item => (
            <div className="cart-item" key={item.id}>
              <span>{item.name} × {item.quantity}</span>
              <span>₹{Number(item.price) * item.quantity}</span>
              <button onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          ))}
          <h3>Total: ₹{total}</h3>

          <input placeholder="Customer name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          <button className="order" onClick={placeOrder}>Place Order</button>

          {message && <p className="message">{message}</p>}
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
