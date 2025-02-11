import { useEffect, useState } from "react";
import axios from "axios";

const CustomerCRM = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("https://your-backend-url/api/customers")
      .then(res => setCustomers(res.data))
      .catch(err => console.error("Error fetching customers:", err));
  }, []);

  const filteredCustomers = customers.filter(c =>
    c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1>Customer Relationship Management (CRM)</h1>
      <input type="text" placeholder="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul>
        {filteredCustomers.map(customer => (
          <li key={customer.id}>{customer.first_name} {customer.last_name}</li>
        ))}
      </ul>
    </div>
  );
};

export default CustomerCRM;
