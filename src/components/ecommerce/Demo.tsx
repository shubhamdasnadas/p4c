"use client";
import { useState } from 'react';

export default function Demo() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price) }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Success! Product ID: ${data.productId}`);
        setName("");
        setPrice("");
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg max-w-sm">
      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <input
        type="text"
        placeholder="Product Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-3 border rounded text-black"
        required
      />
      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-2 mb-3 border rounded text-black"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}